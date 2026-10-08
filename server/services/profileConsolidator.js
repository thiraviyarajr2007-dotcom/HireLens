function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

function normalizeLinkedin(url) {
  return (url || '').trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
}

function normalizeName(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Internal Identity Matching Service:
 * Matches candidate extracted info against existing profiles and consolidates records.
 * Uses high-precision signals (exact Email, clean Phone, exact LinkedIn).
 * Avoids false merges from loose 6-character substrings.
 * Fully synchronizes all extracted and evaluation fields on updates (B8).
 */
export function matchAndUpdateCandidate(newCandidate, existingCandidates = []) {
  const normEmail = normalizeEmail(newCandidate.email);
  const normPhone = normalizePhone(newCandidate.phone);
  const normLinkedin = normalizeLinkedin(newCandidate.linkedin);
  const normName = normalizeName(newCandidate.name);

  let matchedCandidate = null;

  for (const candidate of existingCandidates) {
    const cEmail = normalizeEmail(candidate.email);
    const cPhone = normalizePhone(candidate.phone);
    const cLinkedin = normalizeLinkedin(candidate.linkedin);
    const cName = normalizeName(candidate.name);

    // 1. Strong Primary Identifiers (Unique Email, Phone >= 10 digits, LinkedIn)
    if (normEmail && cEmail && normEmail === cEmail) {
      matchedCandidate = candidate;
      break;
    }
    if (normPhone && cPhone && normPhone.length >= 10 && normPhone === cPhone) {
      matchedCandidate = candidate;
      break;
    }
    if (normLinkedin && cLinkedin && normLinkedin === cLinkedin) {
      matchedCandidate = candidate;
      break;
    }

    // 2. Exact Full Name Match ONLY if corroborated by exact secondary signal (B8: strict matching)
    if (normName && cName && normName.length >= 5 && normName === cName) {
      const cInst = (candidate.extractedProfile?.education || '').toLowerCase().trim();
      const nInst = (newCandidate.extractedProfile?.education || '').toLowerCase().trim();
      const cComp = (candidate.extractedProfile?.latestExperience || '').toLowerCase().trim();
      const nComp = (newCandidate.extractedProfile?.latestExperience || '').toLowerCase().trim();

      // Require exact normalized institutional or company tokens (minimum 10 characters)
      const exactSchool = cInst.length >= 10 && nInst.length >= 10 && (cInst === nInst);
      const exactCompany = cComp.length >= 10 && nComp.length >= 10 && (cComp === nComp);

      if (exactSchool || exactCompany) {
        matchedCandidate = candidate;
        break;
      }
    }
  }

  // Manage multi-job evaluation history (B9)
  const currentEvaluation = {
    jobId: newCandidate.jobId || 'job_default',
    jobTitle: newCandidate.role || 'General Evaluation',
    evaluationId: newCandidate.evaluationId || ('eval_' + Date.now()),
    fitScore: newCandidate.fitScore,
    fitStatus: newCandidate.fitStatus,
    recommendation: newCandidate.recommendation,
    date: new Date().toISOString()
  };

  if (matchedCandidate) {
    const docName = newCandidate.documents?.[0]?.name || "Updated_Resume.pdf";
    const existingDocs = matchedCandidate.documents || [
      { name: `${matchedCandidate.name.replace(/\s+/g, "_")}_Resume.pdf`, date: "Previous" }
    ];

    const updatedDocs = [
      { name: docName, date: new Date().toISOString().split('T')[0] },
      ...existingDocs.filter(d => d.name !== docName)
    ];

    // Maintain evaluations across jobs without overwriting other JDs (B9)
    const existingEvals = matchedCandidate.evaluations || [];
    const updatedEvals = [
      currentEvaluation,
      ...existingEvals.filter(e => e.jobId !== currentEvaluation.jobId)
    ];

    // Update ALL evaluation and extracted fields (B8: no stale data)
    const updatedCandidate = {
      ...matchedCandidate,
      name: newCandidate.name || matchedCandidate.name,
      role: newCandidate.role || matchedCandidate.role,
      location: newCandidate.location !== undefined ? newCandidate.location : matchedCandidate.location,
      email: newCandidate.email || matchedCandidate.email,
      phone: newCandidate.phone || matchedCandidate.phone,
      linkedin: newCandidate.linkedin || matchedCandidate.linkedin,
      avatar: newCandidate.avatar || matchedCandidate.avatar || null,
      fitScore: newCandidate.fitScore,
      fitStatus: newCandidate.fitStatus,
      recommendation: newCandidate.recommendation,
      candidateSummary: newCandidate.candidateSummary,
      keyStrengths: newCandidate.keyStrengths || [],
      criticalGaps: newCandidate.criticalGaps || [],
      experienceLevelMatch: newCandidate.experienceLevelMatch || { required: 'N/A', evaluated: 'N/A', assessment: 'Adequate' },
      targetedInterviewQuestions: newCandidate.targetedInterviewQuestions || { technical: [], behavioral: [] },
      skillsMatch: newCandidate.skillsMatch,
      experienceMatch: newCandidate.experienceMatch,
      educationMatch: newCandidate.educationMatch,
      mainStrength: newCandidate.mainStrength,
      mainGap: newCandidate.mainGap,
      extractedProfile: newCandidate.extractedProfile || matchedCandidate.extractedProfile,
      matchedRequirements: newCandidate.matchedRequirements || [],
      missingRequirements: newCandidate.missingRequirements || [],
      evidenceFields: {
        ...matchedCandidate.evidenceFields,
        ...newCandidate.evidenceFields
      },
      evaluations: updatedEvals,
      analysisMode: newCandidate.analysisMode || 'heuristic',
      documents: updatedDocs,
      resumeText: newCandidate.resumeText || matchedCandidate.resumeText,
      updatedAt: new Date().toISOString()
    };

    return { candidate: updatedCandidate, isExisting: true };
  } else {
    const docName = newCandidate.documents?.[0]?.name || `${(newCandidate.name || 'Candidate').replace(/\s+/g, "_")}_Resume.pdf`;
    const freshCandidate = {
      ...newCandidate,
      evaluations: [currentEvaluation],
      documents: [{ name: docName, date: new Date().toISOString().split('T')[0] }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { candidate: freshCandidate, isExisting: false };
  }
}
