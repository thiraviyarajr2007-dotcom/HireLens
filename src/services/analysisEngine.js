// Deterministic mock analysis service following HireLens architecture:
// RESUME -> TEXT EXTRACTION -> SECTION SEGMENTATION -> STRUCTURED FIELD EXTRACTION -> EVIDENCE VERIFICATION -> JOB DESCRIPTION MATCHING -> FIT SCORE -> CANDIDATE REPORT

// Normalization helper functions for silent background profile consolidation
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
 * Compares extracted candidate data against existing candidate profiles.
 * Automatically merges/updates on HIGH confidence without exposing duplicate detection as a UI feature.
 */
export function matchCandidateProfile(extractedData, existingCandidates = []) {
  const normEmail = normalizeEmail(extractedData.email);
  const normPhone = normalizePhone(extractedData.phone);
  const normLinkedin = normalizeLinkedin(extractedData.linkedin);
  const normName = normalizeName(extractedData.name);
  const inst = (extractedData.extractedProfile?.education || '').toLowerCase();
  const company = (extractedData.extractedProfile?.latestExperience || '').toLowerCase();

  let matchedCandidate = null;
  let matchConfidence = "LOW";

  for (const candidate of existingCandidates) {
    const cEmail = normalizeEmail(candidate.email);
    const cPhone = normalizePhone(candidate.phone);
    const cLinkedin = normalizeLinkedin(candidate.linkedin);
    const cName = normalizeName(candidate.name);
    const cInst = (candidate.extractedProfile?.education || '').toLowerCase();
    const cCompany = (candidate.extractedProfile?.latestExperience || '').toLowerCase();

    // 1. Strong Signals (Exact Email, Phone, or LinkedIn)
    if (normEmail && cEmail && normEmail === cEmail) {
      matchedCandidate = candidate;
      matchConfidence = "HIGH";
      break;
    }
    if (normPhone && cPhone && normPhone.length > 5 && normPhone === cPhone) {
      matchedCandidate = candidate;
      matchConfidence = "HIGH";
      break;
    }
    if (normLinkedin && cLinkedin && normLinkedin === cLinkedin) {
      matchedCandidate = candidate;
      matchConfidence = "HIGH";
      break;
    }

    // 2. Additional Signals (Name + Institution / Company / Location)
    if (normName && cName && normName === cName) {
      let signalCount = 0;
      if (inst && cInst && (inst.includes(cInst.slice(0, 6)) || cInst.includes(inst.slice(0, 6)))) signalCount++;
      if (company && cCompany && (company.includes(cCompany.slice(0, 6)) || cCompany.includes(company.slice(0, 6)))) signalCount++;
      if (extractedData.location && candidate.location && extractedData.location.toLowerCase() === candidate.location.toLowerCase()) signalCount++;

      if (signalCount >= 1) {
        matchedCandidate = candidate;
        matchConfidence = "HIGH";
        break;
      }
    }
  }

  if (matchedCandidate && matchConfidence === "HIGH") {
    // Silently associate new document with existing candidate
    const docName = extractedData.documents?.[0]?.name || "Updated_Resume.pdf";
    const existingDocs = matchedCandidate.documents || [
      { name: `${matchedCandidate.name.replace(/\s+/g, "_")}_Resume.pdf`, date: "Previous" }
    ];

    const updatedDocs = [
      { name: docName, date: new Date().toISOString().split('T')[0] },
      ...existingDocs.filter(d => d.name !== docName)
    ];

    const updatedCandidate = {
      ...matchedCandidate,
      // Update with latest fit score, recommendation & analysis criteria
      fitScore: extractedData.fitScore,
      fitStatus: extractedData.fitStatus,
      recommendation: extractedData.recommendation,
      skillsMatch: extractedData.skillsMatch,
      experienceMatch: extractedData.experienceMatch,
      educationMatch: extractedData.educationMatch,
      mainStrength: extractedData.mainStrength,
      mainGap: extractedData.mainGap,
      matchedRequirements: extractedData.matchedRequirements,
      missingRequirements: extractedData.missingRequirements,
      // Retain combined evidence fields for traceability
      evidenceFields: {
        ...matchedCandidate.evidenceFields,
        ...extractedData.evidenceFields
      },
      documents: updatedDocs,
      resumeText: extractedData.resumeText || matchedCandidate.resumeText,
      updatedNotice: "Existing candidate profile updated."
    };

    return { candidate: updatedCandidate, isExisting: true };
  } else {
    // Create new candidate profile
    const docName = extractedData.documents?.[0]?.name || `${extractedData.name.replace(/\s+/g, "_")}_Resume.pdf`;
    const newCandidate = {
      ...extractedData,
      documents: [{ name: docName, date: new Date().toISOString().split('T')[0] }]
    };
    return { candidate: newCandidate, isExisting: false };
  }
}

export function analyzeResume(resumeFile, resumeText, jobDescription) {
  const fileName = resumeFile ? resumeFile.name : "Uploaded_Resume.pdf";
  const nameParts = fileName.replace(/\.[^/.]+$/, "").split(/[_-\s]+/);
  
  let candidateName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  if (!candidateName || candidateName.toLowerCase().includes("resume") || candidateName.length < 3) {
    candidateName = "John Mathew";
  }

  const id = "c_" + Date.now();
  const jdLower = (jobDescription || "").toLowerCase();
  const resLower = (resumeText || "").toLowerCase();

  // Deterministic scoring based on keyword correlation
  let score = 75;
  const keywords = ["react", "python", "node", "typescript", "aws", "docker", "sql", "postgresql", "rest", "api"];
  let matchedCount = 0;
  
  keywords.forEach(kw => {
    if (jdLower.includes(kw) && resLower.includes(kw)) {
      matchedCount += 1;
    }
  });

  score = Math.min(96, Math.max(58, 65 + matchedCount * 4));

  const fitStatus = score >= 85 ? "Strong Match" : score >= 70 ? "Moderate Match" : "Partial Match";
  const recommendation = score >= 85
    ? "Strong Match. High correlation with required technical stack. Proceed to technical screening."
    : score >= 70
    ? "Moderate Match. Core competencies aligned; minor missing verification items."
    : "Partial Match. Candidate shows partial alignment; key senior requirements unverified.";

  const skillsMatch = Math.min(100, score + 3);
  const experienceMatch = Math.max(60, score - 5);
  const educationMatch = 90;

  const extractedProfile = {
    education: "B.S. Computer Science\nState University, 2020",
    latestExperience: `Senior Software Engineer\n2021 - Present`,
    skills: [
      { name: "React", verified: resLower.includes("react") || true },
      { name: "Node.js", verified: resLower.includes("node") || true },
      { name: "TypeScript", verified: resLower.includes("typescript") || true },
      { name: "Python", verified: resLower.includes("python") || true },
      { name: "SQL", verified: resLower.includes("sql") || true }
    ]
  };

  const matchedRequirements = [
    {
      id: "req-gen-1",
      title: "Core Technical Stack Match",
      status: "MATCHED",
      explanation: "Extracted direct skill assertions matching Job Description key requirements.",
      fieldId: "SKILLS-LIST",
      evidence: `Extracted Skills: React, Node.js, TypeScript, SQL from ${fileName}`
    },
    {
      id: "req-gen-2",
      title: "Full-Stack Development Experience",
      status: "MATCHED",
      explanation: "Found evidence in work experience section demonstrating production system implementation.",
      fieldId: "EXP-LEAD",
      evidence: "Demonstrated modern software engineering practices in active role."
    }
  ];

  const missingRequirements = [
    {
      id: "req-gen-m1",
      title: "REST API Deep Architecture",
      status: "NOT_FOUND",
      explanation: "REST API deep architecture experience was not found in the available resume evidence.",
      fieldId: "API-EXP"
    },
    {
      id: "req-gen-m2",
      title: "Cloud Infrastructure Certification",
      status: "AMBIGUOUS",
      explanation: "Available resume evidence is insufficient to verify official cloud infrastructure certification.",
      fieldId: "CLOUD-CERT"
    }
  ];

  const evidenceFields = {
    "SKILLS-LIST": {
      fieldId: "SKILLS-LIST",
      category: "Skills",
      status: "FOUND",
      extractedValue: "React, Node.js, TypeScript, SQL",
      sourceSection: "Technical Skills",
      evidenceText: `"...proficient in React, Node.js, TypeScript, and SQL database management..." [Extracted from ${fileName}]`,
      confidence: score,
      reasoningLog: [
        { type: "info", title: "Text Extraction", detail: "Parsed UTF-8 text from uploaded document." },
        { type: "success", title: "Evidence Verification", detail: `High semantic match for provided Job Description. Confidence score set to ${score}%.` }
      ]
    }
  };

  return {
    id,
    name: candidateName,
    role: "Senior Software Engineer",
    location: "San Francisco, CA",
    email: `${candidateName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    phone: "+1 (555) 012-4829",
    linkedin: `linkedin.com/in/${candidateName.toLowerCase().replace(/\s+/g, "")}`,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    fitScore: score,
    fitStatus,
    recommendation,
    skillsMatch,
    experienceMatch,
    educationMatch,
    mainStrength: "Strong Technical Stack Alignment",
    mainGap: "Cloud Certification evidence ambiguous",
    extractedProfile,
    matchedRequirements,
    missingRequirements,
    evidenceFields,
    documents: [{ name: fileName, date: new Date().toISOString().split('T')[0] }],
    resumeText: resumeText || `CANDIDATE: ${candidateName.toUpperCase()}\nRole: Senior Software Engineer\n\nSUMMARY\nPassionate software engineer with experience building web applications and backend APIs.\n\nSKILLS\nReact, Node.js, TypeScript, Python, SQL, Git`
  };
}
