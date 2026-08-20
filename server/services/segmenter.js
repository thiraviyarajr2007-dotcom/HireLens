/**
 * Section Segmentation Service:
 * Segments raw resume text into deterministic sections: CONTACT, SUMMARY, EDUCATION, EXPERIENCE, SKILLS, CERTIFICATIONS, PROJECTS.
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

  const sectionKeywords = {
    SUMMARY: ['summary', 'objective', 'about me', 'profile'],
    EDUCATION: ['education', 'academic', 'degree', 'qualification', 'university', 'college'],
    EXPERIENCE: ['experience', 'employment', 'work history', 'career', 'professional experience'],
    SKILLS: ['skills', 'technical skills', 'core competencies', 'technologies', 'tools', 'languages'],
    CERTIFICATIONS: ['certifications', 'licenses', 'certificates'],
    PROJECTS: ['projects', 'key projects', 'personal projects']
  };

  for (const line of lines) {
    const lineLower = line.toLowerCase();

    // Check if line acts as a section header
    let matchedHeader = null;
    for (const [secName, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(kw => lineLower === kw || lineLower === `${kw}:` || lineLower.startsWith(`${kw} --`))) {
        matchedHeader = secName;
        break;
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
