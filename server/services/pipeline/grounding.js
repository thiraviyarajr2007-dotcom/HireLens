/**
 * Verbatim Evidence Grounding Stage:
 * Requires LLM-extracted quotes to exist as verbatim substrings in the original resume.
 * Unverified evidence is downgraded to UNVERIFIED, zeroed in scoring, and logged for divergence audit.
 */

export function groundEvidenceRequirements(requirements = [], originalResumeText = '') {
  const rawText = originalResumeText || '';
  const normalizedRaw = normalizeText(rawText);

  const verifiedRequirements = [];
  const rejectedEvidence = [];
  const divergences = [];

  for (const req of requirements) {
    if (req.status === 'NOT_FOUND' || !req.evidenceQuote) {
      verifiedRequirements.push({
        ...req,
        isGrounded: false,
        groundingStatus: 'NOT_FOUND',
        charStart: -1,
        charEnd: -1,
        finalStatus: 'NOT_FOUND'
      });
      continue;
    }

    const cleanQuote = normalizeText(req.evidenceQuote);

    if (cleanQuote.length < 5) {
      verifiedRequirements.push({
        ...req,
        isGrounded: false,
        groundingStatus: 'UNVERIFIED',
        charStart: -1,
        charEnd: -1,
        finalStatus: 'UNVERIFIED'
      });
      rejectedEvidence.push({
        requirementId: req.requirementId,
        quote: req.evidenceQuote,
        reason: 'Evidence snippet too short (< 5 characters) for valid grounding.'
      });
      divergences.push({
        requirementId: req.requirementId,
        claimedStatus: req.status,
        verifiedStatus: 'UNVERIFIED',
        divergenceType: 'EVIDENCE_REJECTED_TOO_SHORT'
      });
      continue;
    }

    // 1. Exact Substring Verification
    const exactIdx = normalizedRaw.indexOf(cleanQuote);
    if (exactIdx !== -1) {
      verifiedRequirements.push({
        ...req,
        isGrounded: true,
        groundingStatus: 'EXACT',
        charStart: exactIdx,
        charEnd: exactIdx + cleanQuote.length,
        finalStatus: req.status
      });
      continue;
    }

    // 2. High-precision Fuzzy Verification (>= 0.92 Dice Coefficient)
    let fuzzyMatchFound = false;
    const words = cleanQuote.split(' ');

    if (words.length >= 3 && cleanQuote.length > 15) {
      const firstTwo = words.slice(0, 2).join(' ');
      const lastTwo = words.slice(-2).join(' ');
      const startIdx = normalizedRaw.indexOf(firstTwo);
      const endIdx = normalizedRaw.indexOf(lastTwo, startIdx + 1);

      if (startIdx !== -1 && endIdx !== -1 && (endIdx - startIdx) <= cleanQuote.length * 1.35) {
        const candidateSpan = normalizedRaw.slice(startIdx, endIdx + lastTwo.length);
        const similarity = computeDiceSimilarity(cleanQuote, candidateSpan);

        if (similarity >= 0.92) {
          fuzzyMatchFound = true;
          verifiedRequirements.push({
            ...req,
            isGrounded: true,
            groundingStatus: 'FUZZY',
            similarity: Math.round(similarity * 100) / 100,
            charStart: startIdx,
            charEnd: endIdx + lastTwo.length,
            finalStatus: req.status
          });
        }
      }
    }

    // 3. Hallucination Detection & Rejection
    if (!fuzzyMatchFound) {
      verifiedRequirements.push({
        ...req,
        isGrounded: false,
        groundingStatus: 'UNVERIFIED',
        charStart: -1,
        charEnd: -1,
        finalStatus: 'UNVERIFIED' // Downgraded
      });

      rejectedEvidence.push({
        requirementId: req.requirementId,
        quote: req.evidenceQuote,
        reason: 'Hallucinated or modified text: quote not found verbatim in original document.'
      });

      divergences.push({
        requirementId: req.requirementId,
        claimedStatus: req.status,
        verifiedStatus: 'UNVERIFIED',
        divergenceType: 'HALLUCINATED_EVIDENCE_REJECTED'
      });
    }
  }

  return {
    verifiedRequirements,
    rejectedEvidence,
    divergences
  };
}

function normalizeText(str = '') {
  return str
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeDiceSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;
  
  const bigrams = new Map();
  for (let i = 0; i < str1.length - 1; i++) {
    const bg = str1.slice(i, i + 2);
    bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < str2.length - 1; i++) {
    const bg = str2.slice(i, i + 2);
    const count = bigrams.get(bg) || 0;
    if (count > 0) {
      bigrams.set(bg, count - 1);
      intersection++;
    }
  }

  return (2 * intersection) / ((str1.length - 1) + (str2.length - 1));
}
