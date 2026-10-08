/**
 * Section Segmentation Service:
 * Segments raw resume text into deterministic sections: CONTACT, SUMMARY, EDUCATION, EXPERIENCE, SKILLS, CERTIFICATIONS, PROJECTS.
 * Enforces strict header detection: short, standalone lines matching explicit canonical headers.
 * Never treats generic terms like tools, languages, degree, university, or college as section headers.
 */
export function segmentResumeSections(rawText) {
  const lines = (rawText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const sections = {
    CONTACT: [],
    SUMMARY: [],
    EDUCATION: [],
    EXPERIENCE: [],
    SKILLS: [],
    CERTIFICATIONS: [],
    PROJECTS: [],
    UNKNOWN: []
  };

  let currentSection = 'CONTACT';

  // Strict section header keywords - dropped tools, languages, degree, university, college (B11)
  const sectionKeywords = {
    SUMMARY: ['summary', 'professional summary', 'executive summary', 'profile', 'about me', 'career objective', 'objective'],
    EDUCATION: ['education', 'educational background', 'academic background', 'academics', 'academic history'],
    EXPERIENCE: ['experience', 'work experience', 'employment history', 'professional experience', 'work history', 'career history', 'professional background'],
    SKILLS: ['skills', 'technical skills', 'core competencies', 'key skills', 'technical competencies', 'technologies', 'areas of expertise'],
    CERTIFICATIONS: ['certifications', 'licenses', 'certificates', 'certifications and licenses'],
    PROJECTS: ['projects', 'key projects', 'personal projects', 'notable projects', 'selected projects']
  };

  for (const line of lines) {
    const lineLower = line.toLowerCase().trim();

    // Check if line qualifies as a standalone header:
    // 1. Must be short (<= 35 chars)
    // 2. Stripped of markdown header hashes, bullets, dashes, colons
    // 3. Must not look like a prose sentence (no terminal period, no commas)
    const cleanHeader = lineLower
      .replace(/^[\s#*•\->—]+/, '')
      .replace(/[:\-_—]+$/, '')
      .trim();

    let matchedHeader = null;
    if (cleanHeader.length > 0 && cleanHeader.length <= 35 && !cleanHeader.includes('.') && !cleanHeader.includes(',')) {
      for (const [secName, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.includes(cleanHeader)) {
          matchedHeader = secName;
          break;
        }
      }
    }

    if (matchedHeader) {
      currentSection = matchedHeader;
    } else {
      sections[currentSection].push(line);
    }
  }

  return {
    CONTACT: sections.CONTACT.join(' '),
    SUMMARY: sections.SUMMARY.join(' '),
    EDUCATION: sections.EDUCATION.join('\n'),
    EXPERIENCE: sections.EXPERIENCE.join('\n'),
    SKILLS: sections.SKILLS.join(', '),
    CERTIFICATIONS: sections.CERTIFICATIONS.join('\n'),
    PROJECTS: sections.PROJECTS.join('\n'),
    rawSections: sections
  };
}
