import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_GRAPH_PATH = path.resolve(__dirname, '../data/skillGraph.json');

let skillGraph = { skills: {} };
try {
  if (fs.existsSync(SKILL_GRAPH_PATH)) {
    skillGraph = JSON.parse(fs.readFileSync(SKILL_GRAPH_PATH, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load skillGraph.json:', e.message);
}

/**
 * Identify transferable skills for requirements not directly matched.
 * Transferable matches are strictly labelled TRANSFERABLE, never MATCHED.
 */
export function explainSkillGaps(requirements = [], candidateSkills = []) {
  const normCandSkills = (candidateSkills || []).map(s => {
    if (typeof s === 'string') return s.toLowerCase().trim();
    return (s.name || s.value || '').toLowerCase().trim();
  }).filter(Boolean);

  return requirements.map(req => {
    if (req.finalStatus === 'MATCHED' || req.status === 'MATCHED') {
      return {
        requirementId: req.id || req.requirementId,
        skill: req.skill || req.title,
        status: 'MATCHED',
        note: 'Direct verbatim evidence verified in candidate profile.'
      };
    }

    const target = (req.skill || req.title || '').toLowerCase();
    
    // Check if candidate has adjacent transferable skill
    let transferableMatch = null;

    for (const [key, meta] of Object.entries(skillGraph.skills || {})) {
      if (target.includes(key)) {
        // Find if candidate has any of the adjacent skills
        for (const adj of meta.transferableTo || []) {
          if (normCandSkills.some(cs => cs.includes(adj))) {
            transferableMatch = {
              candidateSkill: adj,
              requiredSkill: key,
              domain: meta.domain,
              similarity: meta.similarity
            };
            break;
          }
        }
      }
      if (transferableMatch) break;
    }

    if (transferableMatch) {
      return {
        requirementId: req.id || req.requirementId,
        skill: req.skill || req.title,
        status: 'TRANSFERABLE',
        transferableSkill: transferableMatch.candidateSkill,
        domain: transferableMatch.domain,
        similarity: transferableMatch.similarity,
        note: `Candidate demonstrates transferable competency in "${transferableMatch.candidateSkill}" (${transferableMatch.domain}, ~${Math.round(transferableMatch.similarity * 100)}% adjacent).`
      };
    }

    return {
      requirementId: req.id || req.requirementId,
      skill: req.skill || req.title,
      status: 'NOT_FOUND',
      note: 'No direct or transferable skill match found in resume text.'
    };
  });
}
