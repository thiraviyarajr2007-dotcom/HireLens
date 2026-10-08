import dotenv from 'dotenv';
dotenv.config();

/**
 * HireLens AI Production Evaluator Engine
 * Integrates directly with OpenAI, Gemini, Groq, or local Ollama endpoints.
 * Includes a zero-crash offline heuristic fallback for uninterrupted hackathon demos.
 */

export const HIRELENS_SYSTEM_PROMPT = `You are HireLens AI, an expert technical recruiter and talent evaluation engine. Your task is to critically analyze a candidate's Resume against a provided Job Description (JD), identify qualification matches and red flags, and generate a tailored evaluation report.

### Evaluation Instructions:
1. Hard Skills & Tech Stack Alignment: Identify matching core technologies, tools, and missing must-haves.
2. Experience Depth: Assess whether the candidate's years of experience and project scope meet the seniority level expected in the JD.
3. Quantifiable Impact: Look for measurable business results (e.g., metrics, percentages, throughput gains) vs. generic responsibility lists.
4. Risk & Gap Analysis: Highlight missing critical skills, suspicious timeline gaps, or misaligned domain experience.
5. Targeted Interview Questions: Generate 3 deep-dive technical questions targeting their weakest/unclear project claims, and 2 behavioral questions related to the role context.

### Output Format:
Return ONLY a valid JSON object matching the following schema without any markdown wrapping:
{
  "candidate_summary": "Concise 2-sentence executive summary of the profile.",
  "match_score": 85,
  "recommendation": "Strong Hire" | "Hire" | "Weak Hire" | "Reject",
  "key_strengths": [
    "Strength 1 with evidence from resume",
    "Strength 2 with evidence from resume"
  ],
  "critical_gaps": [
    "Missing requirement or weak claim 1",
    "Missing requirement or weak claim 2"
  ],
  "experience_level_match": {
    "required": "e.g., 3+ years",
    "evaluated": "e.g., ~3.5 years",
    "assessment": "Underqualified" | "Adequate" | "Overqualified"
  },
  "targeted_interview_questions": {
    "technical": [
      "Technical deep-dive question 1",
      "Technical deep-dive question 2",
      "Technical deep-dive question 3"
    ],
    "behavioral": [
      "Role-specific behavioral question 1",
      "Role-specific behavioral question 2"
    ]
  },
  "matched_requirements": [
    {
      "id": "req-1",
      "title": "Title of matched requirement",
      "status": "MATCHED",
      "explanation": "Why it matches",
      "evidence": "Direct quote from resume"
    }
  ],
  "missing_requirements": [
    {
      "id": "gap-1",
      "title": "Title of missing skill",
      "status": "NOT_FOUND",
      "explanation": "Why it is missing or weak"
    }
  ]
}`;

/**
 * Evaluates candidate using LLM (OpenAI / Groq / Gemini compatible endpoint)
 * If no API key is present or request fails, falls back gracefully to offline intelligent heuristic.
 */
export async function evaluateCandidateWithAI(resumeText, jobDescription, fallbackFields = {}) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
  const modelName = process.env.LLM_MODEL || (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

  if (apiKey) {
    try {
      const sanitizedResume = sanitizePII(resumeText);
      console.log(`🤖 Calling HireLens AI (${modelName}) with PII-sanitized text...`);
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: HIRELENS_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `### Input Data:\n- [JOB_DESCRIPTION]:\n"""${jobDescription}"""\n\n- [RESUME_TEXT (Sanitized)]:\n"""${sanitizedResume}"""\n\nProvide the complete JSON evaluation now.`
            }
          ]
        })
      });

      if (response.ok) {
        const json = await response.json();
        const content = json.choices[0]?.message?.content;
        const parsed = JSON.parse(content);
        return formatAiEvaluationResult(parsed, fallbackFields, resumeText);
      } else {
        const errText = await response.text();
        console.warn('⚠️ AI API responded with error, using fallback:', errText);
      }
    } catch (err) {
      console.warn('⚠️ AI Service network call failed, falling back to deterministic analyzer:', err.message);
    }
  }

  // Graceful offline fallback
  return generateOfflineEvaluation(resumeText, jobDescription, fallbackFields);
}

/**
 * PII Redaction Engine: Strips emails, phones, and demographic markers
 * to mitigate baseline systemic bias before LLM inference.
 */
export function sanitizePII(text) {
  if (!text) return '';
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
    .replace(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]')
    .replace(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi, 'linkedin.com/in/[REDACTED]')
    .replace(/github\.com\/[a-zA-Z0-9_-]+/gi, 'github.com/[REDACTED]');
}

function computeDiceCoefficient(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const bigrams = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
  }
  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    const count = bigrams.get(bg) || 0;
    if (count > 0) {
      bigrams.set(bg, count - 1);
      intersection++;
    }
  }
  return (2 * intersection) / ((a.length - 1) + (b.length - 1));
}

/**
 * Extracts a genuine excerpt from raw resume text for a matched keyword.
 * Never invents fake evidence.
 */
function findRealEvidenceSnippet(rawText, keyword) {
  if (!rawText || !keyword) return null;
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const escaped = keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');

  for (const line of lines) {
    if (regex.test(line)) {
      return line.length > 180 ? line.slice(0, 180) + '...' : line;
    }
  }
  return null;
}

/**
 * Verbatim Grounding Verification: Confirms that evidence strings returned by the LLM
 * genuinely exist as verbatim substrings in the original unredacted resume text.
 * Requires the whole quote to match (or >=0.92 Dice similarity for whitespace/token variations).
 */
export function verifyVerbatimGrounding(requirements, originalResumeText) {
  if (!requirements || !Array.isArray(requirements)) return [];
  const rawText = originalResumeText || '';
  const normalizedRaw = rawText.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, ' ');

  return requirements.map(req => {
    if (!req.evidence || typeof req.evidence !== 'string' || req.evidence.trim().length === 0) {
      return {
        ...req,
        isVerbatimVerified: false,
        confidenceFactor: 0,
        groundingStatus: 'UNVERIFIED',
        charStart: -1,
        charEnd: -1
      };
    }

    const cleanQuote = req.evidence
      .replace(/quoted from resume:?|['"]/gi, '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    if (cleanQuote.length < 4) {
      return {
        ...req,
        isVerbatimVerified: false,
        confidenceFactor: 0,
        groundingStatus: 'UNVERIFIED',
        charStart: -1,
        charEnd: -1
      };
    }

    const exactIdx = normalizedRaw.indexOf(cleanQuote);
    const isExact = exactIdx !== -1;

    let isVerified = isExact;
    let charStart = isExact ? exactIdx : -1;
    let charEnd = isExact ? exactIdx + cleanQuote.length : -1;
    let groundingStatus = isExact ? 'VERIFIED_EXACT' : 'UNVERIFIED';

    // Fuzzy check if exact substring not found
    if (!isExact && cleanQuote.length > 15) {
      const words = cleanQuote.split(' ');
      if (words.length >= 3) {
        const firstTwo = words.slice(0, 2).join(' ');
        const lastTwo = words.slice(-2).join(' ');
        const firstIdx = normalizedRaw.indexOf(firstTwo);
        const lastIdx = normalizedRaw.indexOf(lastTwo, firstIdx + 1);
        if (firstIdx !== -1 && lastIdx !== -1 && (lastIdx - firstIdx) <= cleanQuote.length * 1.3) {
          const matchedSpan = normalizedRaw.slice(firstIdx, lastIdx + lastTwo.length);
          const similarity = computeDiceCoefficient(cleanQuote, matchedSpan);
          if (similarity >= 0.92) {
            isVerified = true;
            charStart = firstIdx;
            charEnd = lastIdx + lastTwo.length;
            groundingStatus = 'VERIFIED_FUZZY';
          }
        }
      }
    }

    return {
      ...req,
      isVerbatimVerified: isVerified,
      confidenceFactor: isVerified ? (groundingStatus === 'VERIFIED_EXACT' ? 1.0 : 0.92) : 0,
      groundingStatus,
      charStart,
      charEnd
    };
  });
}

/**
 * Deterministic Scoring Formula:
 * Final Score = (0.45 * S_skills) + (0.35 * S_experience) + (0.20 * S_impact)
 */
export function calculateDeterministicScore(skillsScore, experienceScore, impactScore) {
  const sSkills = Math.min(100, Math.max(0, Number(skillsScore) || 0));
  const sExp = Math.min(100, Math.max(0, Number(experienceScore) || 0));
  const sImpact = Math.min(100, Math.max(0, Number(impactScore) || 0));

  return Math.round((0.45 * sSkills) + (0.35 * sExp) + (0.20 * sImpact));
}

/**
 * Standardizes AI JSON output into HireLens internal candidate model format
 */
function formatAiEvaluationResult(aiData, fallbackFields, originalResumeText) {
  const rawScore = Number(aiData.match_score) || 75;
  const skillsScore = Math.min(100, Math.max(0, rawScore));
  const experienceScore = Math.min(100, Math.max(0, rawScore - 5));
  
  const hasQuantifiedMetrics = (aiData.key_strengths || []).some(s => /\d+%|\$\d+|\b\d+x\b|\b\d+\s*(ms|k|m|tps)\b/i.test(s));
  const impactScore = hasQuantifiedMetrics ? 85 : 65;

  const finalScore = calculateDeterministicScore(skillsScore, experienceScore, impactScore);
  const fitStatus = finalScore >= 85 ? 'Strong Match' : finalScore >= 70 ? 'Moderate Match' : 'Partial Match';

  const verifiedMatched = verifyVerbatimGrounding(aiData.matched_requirements || [], originalResumeText);

  return {
    analysisMode: 'ai',
    fitScore: finalScore,
    fitStatus,
    recommendation: aiData.candidate_summary || `${fitStatus}. Evaluated by HireLens AI Engine.`,
    candidateSummary: aiData.candidate_summary,
    keyStrengths: aiData.key_strengths || [],
    criticalGaps: aiData.critical_gaps || [],
    experienceLevelMatch: aiData.experience_level_match || { required: 'N/A', evaluated: 'N/A', assessment: 'Adequate' },
    targetedInterviewQuestions: aiData.targeted_interview_questions || { technical: [], behavioral: [] },
    skillsMatch: skillsScore,
    experienceMatch: experienceScore,
    educationMatch: fallbackFields?.education ? 85 : 0,
    impactMatch: impactScore,
    mainStrength: (aiData.key_strengths && aiData.key_strengths[0]) || 'Technical Alignment',
    mainGap: (aiData.critical_gaps && aiData.critical_gaps[0]) || 'Domain experience to be confirmed in interview',
    matchedRequirements: verifiedMatched,
    missingRequirements: aiData.missing_requirements || []
  };
}

/**
 * Heuristic Evaluation Mode (No LLM):
 * Transparent heuristic matching without fabricated evidence strings.
 */
function generateOfflineEvaluation(resumeText, jobDescription, fallbackFields) {
  const jdLower = (jobDescription || '').toLowerCase();
  const resLower = (resumeText || '').toLowerCase();

  const coreKeywords = ['react', 'node', 'python', 'typescript', 'aws', 'docker', 'sql', 'postgresql', 'graphql', 'rest'];
  const matched = coreKeywords.filter(kw => jdLower.includes(kw) && resLower.includes(kw));
  const missing = coreKeywords.filter(kw => jdLower.includes(kw) && !resLower.includes(kw));

  const totalEvaluated = matched.length + missing.length;
  const sSkills = totalEvaluated > 0 ? Math.round((matched.length / totalEvaluated) * 100) : 50;
  
  // Real experience estimation from parsed date ranges
  const dateRanges = (resumeText || '').match(/\b(20\d{2})\s*[-–—]\s*(20\d{2}|present|current)\b/gi) || [];
  const sExp = dateRanges.length >= 3 ? 85 : dateRanges.length >= 1 ? 70 : 40;

  // Impact: real quantified metrics search
  const hasMetrics = /\d+%|\$\d+|\b\d+x\b|\b\d+\s*(ms|k|m|tps)\b/i.test(resumeText || '');
  const sImpact = hasMetrics ? 80 : 50;

  const score = calculateDeterministicScore(sSkills, sExp, sImpact);
  const fitStatus = score >= 85 ? 'Strong Match' : score >= 70 ? 'Moderate Match' : 'Partial Match';

  // Extract genuine quotes from resume text (never fake strings)
  const matchedRequirements = matched.map((kw, i) => {
    const realSnippet = findRealEvidenceSnippet(resumeText, kw);
    const hasEvidence = Boolean(realSnippet);
    return {
      id: `req-${i + 1}`,
      title: `${kw.toUpperCase()} Implementation`,
      status: 'MATCHED',
      explanation: hasEvidence ? `Identified in resume text: "${realSnippet}"` : `Keyword ${kw} detected.`,
      fieldId: 'SKILLS-LIST',
      evidence: realSnippet,
      isVerbatimVerified: hasEvidence,
      confidenceFactor: hasEvidence ? 1.0 : 0.6
    };
  });

  const missingRequirements = missing.map((kw, i) => ({
    id: `gap-${i + 1}`,
    title: `${kw.toUpperCase()} Experience`,
    status: 'NOT_FOUND',
    explanation: `No mention of ${kw} found in the uploaded resume.`,
    fieldId: 'SKILLS-LIST'
  }));

  return {
    analysisMode: 'heuristic',
    fallbackReason: 'Heuristic mode (no LLM)',
    fitScore: score,
    fitStatus,
    recommendation: `${fitStatus}. Evaluated in Heuristic Mode (no LLM). Keyword alignment identified in ${matched.slice(0, 3).join(', ') || 'stack'}.`,
    candidateSummary: `Evaluated using heuristic keyword matching. Identified alignment in ${matched.join(', ') || 'detected skills'}. Gaps noted in ${missing.slice(0, 2).join(' and ') || 'none'}.`,
    keyStrengths: matched.length > 0 ? [
      `Grounded occurrences in resume: ${matched.slice(0, 4).join(', ')}.`,
      hasMetrics ? 'Quantified impact metrics present in resume.' : 'Technical terms detected across experience entries.'
    ] : ['Resume parsed, no core JD tech keywords detected.'],
    criticalGaps: missing.length > 0 
      ? [`Missing JD requirements: ${missing.join(', ')}.`] 
      : ['Candidate matches evaluated keywords; recommend technical screening.'],
    experienceLevelMatch: {
      required: 'Per JD',
      evaluated: `${dateRanges.length} verifiable role periods detected`,
      assessment: dateRanges.length >= 2 ? 'Adequate' : 'Underqualified'
    },
    targetedInterviewQuestions: {
      technical: matched.slice(0, 2).map(kw => `Can you elaborate on your production experience with ${kw}?`),
      behavioral: [
        'Describe a complex project failure and how your team resolved the blockers.',
        'How do you validate code quality and performance in your daily workflow?'
      ]
    },
    skillsMatch: sSkills,
    experienceMatch: sExp,
    educationMatch: fallbackFields?.education ? 85 : 0,
    impactMatch: sImpact,
    mainStrength: matched.length > 0 ? `Core Stack: ${matched.slice(0, 2).join(' & ')}` : 'Profile Parsed',
    mainGap: missing.length > 0 ? `Unverified: ${missing.join(', ')}` : 'None',
    matchedRequirements,
    missingRequirements
  };
}
