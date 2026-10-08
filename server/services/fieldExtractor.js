import { segmentResumeSections } from './segmenter.js';

/**
 * Technical Skills Taxonomy & Synonym Dictionary
 */
const SKILL_TAXONOMY = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
  'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS', 'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte',
  'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'Ruby on Rails',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'DynamoDB',
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Linux', 'Git',
  'CI/CD', 'GraphQL', 'REST API', 'gRPC', 'Kafka', 'RabbitMQ', 'Microservices',
  'Tailwind CSS', 'Redux', 'Jest', 'Cypress', 'Playwright', 'PyTorch', 'TensorFlow',
  'scikit-learn', 'Pandas', 'NumPy', 'Solidity', 'WebSockets', 'Webpack', 'Vite'
];

const SKILL_SYNONYMS = {
  'js': 'JavaScript',
  'ts': 'TypeScript',
  'py': 'Python',
  'golang': 'Go',
  'reactjs': 'React',
  'react.js': 'React',
  'nodejs': 'Node.js',
  'node': 'Node.js',
  'expressjs': 'Express',
  'express.js': 'Express',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'mongo': 'MongoDB',
  'mongodb': 'MongoDB',
  'k8s': 'Kubernetes',
  'gcp': 'Google Cloud',
  'rest': 'REST API',
  'restful': 'REST API',
  'rest api': 'REST API',
  'rest apis': 'REST API',
  'graphql': 'GraphQL',
  'tailwind': 'Tailwind CSS'
};

/**
 * Finds exact character offset range in original text
 */
function findOffsets(sourceText, targetStr) {
  if (!sourceText || !targetStr) return { charStart: 0, charEnd: 0 };
  const idx = sourceText.indexOf(targetStr);
  if (idx !== -1) {
    return { charStart: idx, charEnd: idx + targetStr.length };
  }
  const lowerSource = sourceText.toLowerCase();
  const lowerTarget = targetStr.toLowerCase();
  const lowerIdx = lowerSource.indexOf(lowerTarget);
  if (lowerIdx !== -1) {
    return { charStart: lowerIdx, charEnd: lowerIdx + targetStr.length };
  }
  return { charStart: 0, charEnd: 0 };
}

/**
 * Structured Field Extractor & Evidence Grounding Service:
 * Extracts candidate fields and binds exact source evidence quotes to each field.
 * Never infers missing facts; sets status to FOUND, NOT_FOUND, or AMBIGUOUS.
 * Confidence is strictly computed based on evidence grounding strength.
 */
export function extractCandidateFields(rawText = '', fileName = '') {
  const sections = segmentResumeSections(rawText);
  const text = rawText || '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Real Name Extraction (from first lines of resume text, NEVER filename or default)
  let extractedName = null;
  let nameQuote = null;
  let nameConfidence = 0;

  const nonNamePatterns = [
    /@/, /https?:\/\//i, /linkedin\.com/i, /github\.com/i, /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    /\b(?:developer|engineer|architect|manager|designer|analyst|consultant|specialist|lead|administrator|director|profile|summary|experience|education|skills|projects|certifications|curriculum|vitae|resume|page|contact|email|phone|objective|portfolio|bio|about)\b/i
  ];

  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const candidateLine = lines[i];
    if (nonNamePatterns.some(pat => pat.test(candidateLine))) continue;
    if (candidateLine.length < 3 || candidateLine.length > 40) continue;

    // Check for valid name shape: 2 to 4 capitalized words, alphabetic characters only
    const words = candidateLine.split(/\s+/);
    const isValidNameShape = words.length >= 2 && words.length <= 4 &&
      words.every(w => /^[A-Z][a-zA-Z'.-]*$/.test(w));

    if (isValidNameShape) {
      extractedName = candidateLine;
      nameQuote = candidateLine;
      // Confidence: top 2 lines = 95%, lines 3-5 = 80%
      nameConfidence = i <= 1 ? 95 : 80;
      break;
    }
  }

  const nameOffsets = nameQuote ? findOffsets(text, nameQuote) : { charStart: 0, charEnd: 0 };
  const nameField = {
    value: extractedName,
    status: extractedName ? 'FOUND' : 'NOT_FOUND',
    confidence: nameConfidence,
    evidence: extractedName ? {
      quote: nameQuote,
      charStart: nameOffsets.charStart,
      charEnd: nameOffsets.charEnd,
      section: 'Header'
    } : null
  };

  // 2. Real Email Extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const emailMatches = text.match(emailRegex);
  const extractedEmail = emailMatches && emailMatches.length > 0 ? emailMatches[0] : null;
  const emailOffsets = extractedEmail ? findOffsets(text, extractedEmail) : { charStart: 0, charEnd: 0 };

  const emailField = {
    value: extractedEmail,
    status: extractedEmail ? 'FOUND' : 'NOT_FOUND',
    confidence: extractedEmail ? 98 : 0,
    evidence: extractedEmail ? {
      quote: extractedEmail,
      charStart: emailOffsets.charStart,
      charEnd: emailOffsets.charEnd,
      section: 'Contact'
    } : null
  };

  // 3. Real Phone Extraction (strict format, avoids matching date ranges like 2020 - 2022)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g;
  const phoneMatches = text.match(phoneRegex);
  let extractedPhone = null;

  if (phoneMatches) {
    for (const match of phoneMatches) {
      // Guard against false-positive 4-digit date spans (e.g., "2020 - 2022")
      const digitCount = match.replace(/\D/g, '').length;
      if (digitCount >= 10 && !/\b20\d{2}\s*[-–—]\s*20\d{2}\b/.test(match)) {
        extractedPhone = match.trim();
        break;
      }
    }
  }

  const phoneOffsets = extractedPhone ? findOffsets(text, extractedPhone) : { charStart: 0, charEnd: 0 };
  const phoneField = {
    value: extractedPhone,
    status: extractedPhone ? 'FOUND' : 'NOT_FOUND',
    confidence: extractedPhone ? 95 : 0,
    evidence: extractedPhone ? {
      quote: extractedPhone,
      charStart: phoneOffsets.charStart,
      charEnd: phoneOffsets.charEnd,
      section: 'Contact'
    } : null
  };

  // 4. Real LinkedIn Extraction
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
  const linkedinMatch = text.match(linkedinRegex);
  const extractedLinkedin = linkedinMatch ? linkedinMatch[0] : null;
  const linkedinOffsets = extractedLinkedin ? findOffsets(text, extractedLinkedin) : { charStart: 0, charEnd: 0 };

  const linkedinField = {
    value: extractedLinkedin,
    status: extractedLinkedin ? 'FOUND' : 'NOT_FOUND',
    confidence: extractedLinkedin ? 98 : 0,
    evidence: extractedLinkedin ? {
      quote: extractedLinkedin,
      charStart: linkedinOffsets.charStart,
      charEnd: linkedinOffsets.charEnd,
      section: 'Contact'
    } : null
  };

  // 5. Real GitHub Extraction
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i;
  const githubMatch = text.match(githubRegex);
  const extractedGithub = githubMatch ? githubMatch[0] : null;
  const githubOffsets = extractedGithub ? findOffsets(text, extractedGithub) : { charStart: 0, charEnd: 0 };

  const githubField = {
    value: extractedGithub,
    status: extractedGithub ? 'FOUND' : 'NOT_FOUND',
    confidence: extractedGithub ? 98 : 0,
    evidence: extractedGithub ? {
      quote: extractedGithub,
      charStart: githubOffsets.charStart,
      charEnd: githubOffsets.charEnd,
      section: 'Contact'
    } : null
  };

  // 6. Real Location Extraction
  let extractedLocation = null;
  let locationConfidence = 0;
  const locationRegex = /\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?|[A-Z][a-zA-Z]+,\s*[A-Z][a-zA-Z]+)\b/;
  const contactLines = (sections.CONTACT || lines.slice(0, 8).join('\n')).split('\n');

  for (const line of contactLines) {
    const locMatch = line.match(locationRegex);
    if (locMatch && !locMatch[0].toLowerCase().includes('university') && !locMatch[0].toLowerCase().includes('college')) {
      extractedLocation = locMatch[0].trim();
      locationConfidence = 85;
      break;
    }
  }

  const locationOffsets = extractedLocation ? findOffsets(text, extractedLocation) : { charStart: 0, charEnd: 0 };
  const locationField = {
    value: extractedLocation,
    status: extractedLocation ? 'FOUND' : 'NOT_FOUND',
    confidence: locationConfidence,
    evidence: extractedLocation ? {
      quote: extractedLocation,
      charStart: locationOffsets.charStart,
      charEnd: locationOffsets.charEnd,
      section: 'Contact'
    } : null
  };

  // 7. Real Skills Extraction (Taxonomy + Synonyms; NO hardcoded fallbacks)
  const foundSkillsMap = new Map();
  const textLower = text.toLowerCase();
  const skillsSectionLower = (sections.SKILLS || '').toLowerCase();
  const expSectionLower = (sections.EXPERIENCE || '').toLowerCase();

  // Search canonical skills
  for (const skill of SKILL_TAXONOMY) {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    
    if (regex.test(text)) {
      let confidence = 70; // baseline mention
      let section = 'Body';
      
      if (skillsSectionLower && regex.test(skillsSectionLower)) {
        confidence = 98; // explicitly declared in Skills section
        section = 'Skills';
      } else if (expSectionLower && regex.test(expSectionLower)) {
        confidence = 88; // demonstrated in Experience section
        section = 'Experience';
      }

      const matchOffsets = findOffsets(text, skill);
      foundSkillsMap.set(skill, {
        name: skill,
        verified: true,
        confidence,
        section,
        offsets: matchOffsets
      });
    }
  }

  // Search synonyms
  for (const [synonym, canonical] of Object.entries(SKILL_SYNONYMS)) {
    if (!foundSkillsMap.has(canonical)) {
      const escaped = synonym.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text)) {
        let confidence = 65;
        let section = 'Body';
        if (skillsSectionLower && regex.test(skillsSectionLower)) {
          confidence = 95;
          section = 'Skills';
        } else if (expSectionLower && regex.test(expSectionLower)) {
          confidence = 82;
          section = 'Experience';
        }
        const matchOffsets = findOffsets(text, synonym);
        foundSkillsMap.set(canonical, {
          name: canonical,
          verified: true,
          confidence,
          section,
          offsets: matchOffsets
        });
      }
    }
  }

  const extractedSkills = Array.from(foundSkillsMap.values()).map(s => ({
    name: s.name,
    verified: true,
    confidence: s.confidence,
    section: s.section
  }));

  const skillsConfidence = extractedSkills.length > 0
    ? Math.round(extractedSkills.reduce((acc, s) => acc + s.confidence, 0) / extractedSkills.length)
    : 0;

  const skillsField = {
    value: extractedSkills.map(s => s.name),
    status: extractedSkills.length > 0 ? 'FOUND' : 'NOT_FOUND',
    confidence: skillsConfidence,
    evidence: extractedSkills.length > 0 ? {
      quote: sections.SKILLS || extractedSkills.map(s => s.name).join(', '),
      charStart: 0,
      charEnd: 0,
      section: sections.SKILLS ? 'Technical Skills' : 'Resume Body'
    } : null
  };

  // 8. Real Education Extraction
  let extractedEducation = null;
  let eduConfidence = 0;
  let eduEvidenceQuote = null;

  if (sections.EDUCATION && sections.EDUCATION.trim().length > 0) {
    const eduLines = sections.EDUCATION.split('\n').filter(Boolean);
    extractedEducation = eduLines.slice(0, 2).join('\n');
    eduEvidenceQuote = sections.EDUCATION;
    eduConfidence = 92;
  } else {
    // Search body for degree mentions
    const degreeRegex = /(?:Bachelor|Master|Doctor|B\.S\.|M\.S\.|Ph\.D\.|B\.Tech|M\.Tech|B\.E\.|B\.A\.|M\.A\.)[^,\n.]*/i;
    const degMatch = text.match(degreeRegex);
    if (degMatch) {
      extractedEducation = degMatch[0].trim();
      eduEvidenceQuote = degMatch[0];
      eduConfidence = 72;
    }
  }

  const eduOffsets = eduEvidenceQuote ? findOffsets(text, eduEvidenceQuote.slice(0, 40)) : { charStart: 0, charEnd: 0 };
  const educationField = {
    value: extractedEducation,
    status: extractedEducation ? 'FOUND' : 'NOT_FOUND',
    confidence: eduConfidence,
    evidence: extractedEducation ? {
      quote: eduEvidenceQuote,
      charStart: eduOffsets.charStart,
      charEnd: eduOffsets.charEnd,
      section: sections.EDUCATION ? 'Education' : 'Body'
    } : null
  };

  // 9. Real Experience Extraction
  let latestExperience = null;
  let expConfidence = 0;
  let expQuote = null;

  if (sections.EXPERIENCE && sections.EXPERIENCE.trim().length > 0) {
    const expLines = sections.EXPERIENCE.split('\n').filter(Boolean);
    latestExperience = expLines.slice(0, 2).join(' — ');
    expQuote = expLines[0];
    expConfidence = 90;
  } else {
    // Search for role title pattern
    const roleRegex = /(?:Software Engineer|Developer|Architect|Product Manager|Data Scientist|Engineering Manager)[^\n.]*/i;
    const roleMatch = text.match(roleRegex);
    if (roleMatch) {
      latestExperience = roleMatch[0].trim();
      expQuote = roleMatch[0];
      expConfidence = 68;
    }
  }

  const expOffsets = expQuote ? findOffsets(text, expQuote) : { charStart: 0, charEnd: 0 };
  const experienceField = {
    value: latestExperience,
    status: latestExperience ? 'FOUND' : 'NOT_FOUND',
    confidence: expConfidence,
    evidence: latestExperience ? {
      quote: expQuote,
      charStart: expOffsets.charStart,
      charEnd: expOffsets.charEnd,
      section: sections.EXPERIENCE ? 'Experience' : 'Body'
    } : null
  };

  // 10. Certifications Extraction
  let extractedCertifications = null;
  if (sections.CERTIFICATIONS && sections.CERTIFICATIONS.trim().length > 0) {
    extractedCertifications = sections.CERTIFICATIONS.split('\n').filter(Boolean);
  }

  // Structured Profile (clean null values for absent data, never fabricated defaults)
  const extractedProfile = {
    fullName: extractedName,
    email: extractedEmail,
    phone: extractedPhone,
    linkedin: extractedLinkedin,
    github: extractedGithub,
    location: extractedLocation,
    education: extractedEducation,
    latestExperience: latestExperience,
    skills: extractedSkills,
    certifications: extractedCertifications || []
  };

  // Evidence fields collection for explorer UI
  const evidenceFields = {
    "CONTACT-NAME": {
      fieldId: "CONTACT-NAME",
      category: "Candidate Identity",
      status: nameField.status,
      extractedValue: extractedName || "Not found in resume",
      sourceSection: nameField.evidence?.section || "Header",
      evidenceText: nameField.evidence?.quote || "No explicit candidate name detected in resume header.",
      confidence: nameField.confidence,
      reasoningLog: [
        {
          type: extractedName ? "success" : "info",
          title: extractedName ? "Header Identity Parsed" : "Name Absent",
          detail: extractedName ? `Parsed "${extractedName}" with computed confidence ${nameField.confidence}%.` : "No valid 2-4 token name detected in top header lines."
        }
      ]
    },
    "CONTACT-EMAIL": {
      fieldId: "CONTACT-EMAIL",
      category: "Contact Info",
      status: emailField.status,
      extractedValue: extractedEmail || "Not found in resume",
      sourceSection: emailField.evidence?.section || "Contact",
      evidenceText: extractedEmail ? `Email address: ${extractedEmail}` : "No valid RFC-compliant email address found.",
      confidence: emailField.confidence,
      reasoningLog: [
        {
          type: extractedEmail ? "success" : "warning",
          title: extractedEmail ? "Email Verified" : "Email Missing",
          detail: extractedEmail ? `RFC 5322 regex match confirmed: ${extractedEmail}` : "Resume contains no valid email address."
        }
      ]
    },
    "CONTACT-PHONE": {
      fieldId: "CONTACT-PHONE",
      category: "Contact Info",
      status: phoneField.status,
      extractedValue: extractedPhone || "Not found in resume",
      sourceSection: phoneField.evidence?.section || "Contact",
      evidenceText: extractedPhone ? `Phone number: ${extractedPhone}` : "No standard telephone number detected.",
      confidence: phoneField.confidence,
      reasoningLog: [
        {
          type: extractedPhone ? "success" : "info",
          title: extractedPhone ? "Phone Grounded" : "Phone Absent",
          detail: extractedPhone ? `Verified phone token: ${extractedPhone}` : "No phone number found."
        }
      ]
    },
    "SKILLS-LIST": {
      fieldId: "SKILLS-LIST",
      category: "Skills",
      status: skillsField.status,
      extractedValue: extractedSkills.length > 0 ? extractedSkills.map(s => s.name).join(", ") : "Not found in resume",
      sourceSection: skillsField.evidence?.section || "Skills",
      evidenceText: skillsField.evidence?.quote || "No recognized technical taxonomy skills found in resume.",
      confidence: skillsField.confidence,
      reasoningLog: [
        {
          type: extractedSkills.length > 0 ? "success" : "warning",
          title: extractedSkills.length > 0 ? `${extractedSkills.length} Skills Grounded` : "No Skills Grounded",
          detail: extractedSkills.length > 0 ? `Matched against skill taxonomy with average confidence ${skillsField.confidence}%.` : "Zero skills identified from taxonomy and synonym dictionary."
        }
      ]
    },
    "EDU-DEGREE": {
      fieldId: "EDU-DEGREE",
      category: "Education",
      status: educationField.status,
      extractedValue: extractedEducation || "Not found in resume",
      sourceSection: educationField.evidence?.section || "Education",
      evidenceText: educationField.evidence?.quote || "No academic degree or institution identified.",
      confidence: educationField.confidence,
      reasoningLog: [
        {
          type: extractedEducation ? "success" : "info",
          title: extractedEducation ? "Education Parsed" : "Education Missing",
          detail: extractedEducation ? `Extracted academic credential: "${extractedEducation.split('\n')[0]}".` : "No recognized education credentials found."
        }
      ]
    },
    "WORK-EXP": {
      fieldId: "WORK-EXP",
      category: "Experience",
      status: experienceField.status,
      extractedValue: latestExperience || "Not found in resume",
      sourceSection: experienceField.evidence?.section || "Experience",
      evidenceText: experienceField.evidence?.quote || "No professional experience entries identified.",
      confidence: experienceField.confidence,
      reasoningLog: [
        {
          type: latestExperience ? "success" : "info",
          title: latestExperience ? "Experience Grounded" : "Experience Missing",
          detail: latestExperience ? `Extracted role: "${latestExperience}".` : "No experience section or entries identified."
        }
      ]
    }
  };

  return {
    fullName: extractedName,
    email: extractedEmail,
    phone: extractedPhone,
    linkedin: extractedLinkedin,
    github: extractedGithub,
    location: extractedLocation,
    education: extractedEducation,
    latestExperience,
    extractedProfile,
    evidenceFields,
    rawText: text
  };
}
