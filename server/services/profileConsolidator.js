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
 * Matches candidate extracted info against existing profiles and consolidates under ONE candidate.
 */
export function matchAndUpdateCandidate(newCandidate, existingCandidates = []) {
  const normEmail = normalizeEmail(newCandidate.email);
  const normPhone = normalizePhone(newCandidate.phone);
  const normLinkedin = normalizeLinkedin(newCandidate.linkedin);
  const normName = normalizeName(newCandidate.name);
  const inst = (newCandidate.extractedProfile?.education || '').toLowerCase();
  const company = (newCandidate.extractedProfile?.latestExperience || '').toLowerCase();

  let matchedCandidate = null;

  for (const candidate of existingCandidates) {
    const cEmail = normalizeEmail(candidate.email);
    const cPhone = normalizePhone(candidate.phone);
    const cLinkedin = normalizeLinkedin(candidate.linkedin);
    const cName = normalizeName(candidate.name);
    const cInst = (candidate.extractedProfile?.education || '').toLowerCase();
    const cCompany = (candidate.extractedProfile?.latestExperience || '').toLowerCase();

    // 1. Strong Signals (Exact Email, Phone, LinkedIn)
    if (normEmail && cEmail && normEmail === cEmail) {
      matchedCandidate = candidate;
      break;
    }
    if (normPhone && cPhone && normPhone.length > 5 && normPhone === cPhone) {
      matchedCandidate = candidate;
      break;
    }
    if (normLinkedin && cLinkedin && normLinkedin === cLinkedin) {
      matchedCandidate = candidate;
      break;
    }

    // 2. Additional Signals (Name + Context)
    if (normName && cName && normName === cName) {
      let signalCount = 0;
      if (inst && cInst && (inst.includes(cInst.slice(0, 6)) || cInst.includes(inst.slice(0, 6)))) signalCount++;
      if (company && cCompany && (company.includes(cCompany.slice(0, 6)) || cCompany.includes(company.slice(0, 6)))) signalCount++;
      if (signalCount >= 1) {
        matchedCandidate = candidate;
        break;
      }
    }
  }

  if (matchedCandidate) {
    const docName = newCandidate.documents?.[0]?.name || "Updated_Resume.pdf";
    const existingDocs = matchedCandidate.documents || [
      { name: `${matchedCandidate.name.replace(/\s+/g, "_")}_Resume.pdf`, date: "Previous" }
    ];

    const updatedDocs = [
      { name: docName, date: new Date().toISOString().split('T')[0] },
      ...existingDocs.filter(d => d.name !== docName)
    ];

    const updatedCandidate = {
      ...matchedCandidate,
      fitScore: newCandidate.fitScore,
      fitStatus: newCandidate.fitStatus,
      recommendation: newCandidate.recommendation,
      skillsMatch: newCandidate.skillsMatch,
      experienceMatch: newCandidate.experienceMatch,
      educationMatch: newCandidate.educationMatch,
      mainStrength: newCandidate.mainStrength,
      mainGap: newCandidate.mainGap,
      matchedRequirements: newCandidate.matchedRequirements,
      missingRequirements: newCandidate.missingRequirements,
      evidenceFields: {
        ...matchedCandidate.evidenceFields,
        ...newCandidate.evidenceFields
      },
      documents: updatedDocs,
      resumeText: newCandidate.resumeText || matchedCandidate.resumeText,
      updatedAt: new Date().toISOString()
    };

    return { candidate: updatedCandidate, isExisting: true };
  } else {
    const docName = newCandidate.documents?.[0]?.name || `${newCandidate.name.replace(/\s+/g, "_")}_Resume.pdf`;
    const freshCandidate = {
      ...newCandidate,
      documents: [{ name: docName, date: new Date().toISOString().split('T')[0] }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { candidate: freshCandidate, isExisting: false };
  }
}
