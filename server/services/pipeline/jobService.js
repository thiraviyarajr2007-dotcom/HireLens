import { loadStore, saveStore } from '../storage.js';

const SKILL_KEYWORDS = [
  'React', 'Node.js', 'TypeScript', 'Python', 'Go', 'Java', 'PostgreSQL',
  'MySQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST API',
  'Redis', 'Linux', 'Git', 'CI/CD', 'FastAPI', 'Express', 'SQL', 'C++'
];

/**
 * Parses raw Job Description into structured Job entity
 */
export function parseJobDescription(jdText = '', overrides = {}) {
  const lines = jdText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const textLower = jdText.toLowerCase();

  // 1. Title Extraction
  let title = 'Software Engineer';
  const titleMatch = jdText.match(/(?:Job Title|Title|Role|Position):\s*([^\n\r]+)/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  } else if (lines.length > 0 && lines[0].length < 60 && /(?:Engineer|Developer|Architect|Lead|Manager)/i.test(lines[0])) {
    title = lines[0].replace(/^(?:Role:?|Title:?)\s*/i, '').trim();
  }

  // 2. Required Years Extraction
  let requiredYears = 2;
  const yearsMatch = jdText.match(/\b(\d+)\+?\s*(?:years|yrs)\b/i);
  if (yearsMatch) {
    requiredYears = parseInt(yearsMatch[1], 10);
  }

  // 3. Education Requirement
  let educationReq = 'Relevant Degree or equivalent experience';
  const eduMatch = jdText.match(/\b(?:Bachelor|Master|B\.S\.|M\.S\.|Degree)[^\n.]*/i);
  if (eduMatch) {
    educationReq = eduMatch[0].trim();
  }

  // 4. Skills Segmentation
  const detectedSkills = SKILL_KEYWORDS.filter(sk => {
    const regex = new RegExp(`\\b${sk.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    return regex.test(jdText);
  });

  const mandatorySkills = detectedSkills.slice(0, 4);
  const preferredSkills = detectedSkills.slice(4);

  // 5. Default Deterministic Weights
  const weights = {
    skills: 0.45,
    experience: 0.35,
    impact: 0.20,
    education: 0.0
  };

  const job = {
    id: 'job_' + Date.now(),
    title: overrides.title || title,
    rawText: jdText,
    requiredYears: overrides.requiredYears !== undefined ? Number(overrides.requiredYears) : requiredYears,
    educationReq: overrides.educationReq || educationReq,
    mandatorySkills: overrides.mandatorySkills || mandatorySkills,
    preferredSkills: overrides.preferredSkills || preferredSkills,
    weights: overrides.weights || weights,
    requirements: [
      ...mandatorySkills.map((sk, idx) => ({
        id: `req-m-${idx + 1}`,
        title: `${sk} Proficiency`,
        skill: sk,
        isMandatory: true
      })),
      ...preferredSkills.map((sk, idx) => ({
        id: `req-p-${idx + 1}`,
        title: `${sk} Experience`,
        skill: sk,
        isMandatory: false
      }))
    ],
    createdAt: new Date().toISOString()
  };

  return job;
}

export function saveJobEntity(job) {
  const store = loadStore();
  if (!store.jobs) store.jobs = [];
  
  const existingIdx = store.jobs.findIndex(j => j.id === job.id);
  if (existingIdx !== -1) {
    store.jobs[existingIdx] = job;
  } else {
    store.jobs.unshift(job);
  }
  saveStore(store);
  return job;
}

export function getJobById(jobId) {
  const store = loadStore();
  return (store.jobs || []).find(j => j.id === jobId) || null;
}

export function listAllJobs() {
  const store = loadStore();
  return store.jobs || [];
}
