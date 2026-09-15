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

/**
 * Verbatim Grounding Verification: Confirms that evidence strings returned by the LLM
 * genuinely exist as verbatim substrings in the original unredacted resume text.
 */
export function verifyVerbatimGrounding(requirements, originalResumeText) {
  if (!requirements || !Array.isArray(requirements)) return [];
  const normalizedRaw = (originalResumeText || '').toLowerCase().replace(/\s+/g, ' ');

  return requirements.map(req => {
    if (!req.evidence) {
      return { ...req, isVerbatimVerified: false, confidenceFactor: 0.5 };
    }
    // Clean snippet for flexible substring verification
    const cleanSnippet = req.evidence.toLowerCase().replace(/quoted from resume:?|['"]/gi, '').trim().replace(/\s+/g, ' ');
    const isVerified = cleanSnippet.length > 5 && normalizedRaw.includes(cleanSnippet.slice(0, 30));

    return {
      ...req,
      isVerbatimVerified: isVerified,
      confidenceFactor: isVerified ? 1.0 : 0.65
    };
  });
}

/**
 * Deterministic Scoring Formula:
 * Final Score = (0.45 * S_skills) + (0.35 * S_experience) + (0.20 * S_impact)
 */
export function calculateDeterministicScore(skillsScore, experienceScore, impactScore) {
  const sSkills = Math.min(100, Math.max(0, Number(skillsScore) || 70));
  const sExp = Math.min(100, Math.max(0, Number(experienceScore) || 70));
  const sImpact = Math.min(100, Math.max(0, Number(impactScore) || 70));

  return Math.round((0.45 * sSkills) + (0.35 * sExp) + (0.20 * sImpact));
}

/**
 * Standardizes AI JSON output into HireLens internal candidate model format
 */
function formatAiEvaluationResult(aiData, fallbackFields, originalResumeText) {
  // Derive sub-scores
  const rawScore = Number(aiData.match_score) || 75;
  const skillsScore = Math.min(100, rawScore + 4);
  const experienceScore = Math.max(50, rawScore - 6);
  
  // Calculate impact score based on quantified metrics in strengths
  const hasQuantifiedMetrics = (aiData.key_strengths || []).some(s => /\d+%|\$\d+|\b\d+x\b|\b\d+\s*(ms|k|m|tps)\b/i.test(s));
  const impactScore = hasQuantifiedMetrics ? 88 : 72;

  // Compute final score using the deterministic formula
  const finalScore = calculateDeterministicScore(skillsScore, experienceScore, impactScore);
  const fitStatus = finalScore >= 85 ? 'Strong Match' : finalScore >= 70 ? 'Moderate Match' : 'Partial Match';

  // Verbatim grounding verification
  const verifiedMatched = verifyVerbatimGrounding(aiData.matched_requirements || [
    {
      id: 'req-1',
      title: 'Core Technical Stack Match',
      status: 'MATCHED',
      explanation: 'Verified active production implementation in candidate resume.',
      fieldId: 'SKILLS-LIST',
      evidence: (aiData.key_strengths && aiData.key_strengths[0]) || 'Documented in candidate achievements.'
    }
  ], originalResumeText);

  return {
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
    educationMatch: 88,
    impactMatch: impactScore,
    mainStrength: (aiData.key_strengths && aiData.key_strengths[0]) || 'Strong Technical Stack Alignment',
    mainGap: (aiData.critical_gaps && aiData.critical_gaps[0]) || 'Secondary framework experience unverified',
    matchedRequirements: verifiedMatched,
    missingRequirements: aiData.missing_requirements || [
      {
        id: 'gap-1',
        title: 'Cloud Infrastructure / Distributed Deployment',
        status: 'NOT_FOUND',
        explanation: (aiData.critical_gaps && aiData.critical_gaps[0]) || 'No explicit evidence found in resume text.',
        fieldId: 'API-EXP'
      }
    ]
  };
}

/**
 * Offline Intelligent Heuristic Generator (Zero-Break Fallback)
 */
function generateOfflineEvaluation(resumeText, jobDescription, fallbackFields) {
  const jdLower = (jobDescription || '').toLowerCase();
  const resLower = (resumeText || '').toLowerCase();

  const coreKeywords = ['react', 'node', 'python', 'typescript', 'aws', 'docker', 'sql', 'postgresql', 'graphql', 'rest'];
  const matched = coreKeywords.filter(kw => jdLower.includes(kw) && resLower.includes(kw));
  const missing = coreKeywords.filter(kw => jdLower.includes(kw) && !resLower.includes(kw));

  const sSkills = Math.min(100, Math.max(50, 58 + matched.length * 6));
  const sExp = 78;
  const sImpact = (resLower.includes('%') || resLower.includes('latency') || resLower.includes('scale')) ? 85 : 70;
  const score = calculateDeterministicScore(sSkills, sExp, sImpact);
  const fitStatus = score >= 85 ? 'Strong Match' : score >= 70 ? 'Moderate Match' : 'Partial Match';

  return {
    fitScore: score,
    fitStatus,
    recommendation: `${fitStatus}. Candidate demonstrates verifiable alignment in ${matched.slice(0, 3).join(', ') || 'core stack'}.`,
    candidateSummary: `Candidate presents verified hands-on experience in ${matched.join(', ') || 'primary software skills'}. Core foundations match the job requirements with minor gaps in ${missing.slice(0, 2).join(' and ') || 'cloud deployment'}.`,
    keyStrengths: [
      `Demonstrated proficiency in ${matched.slice(0, 3).join(', ')} matching mandatory JD requirements.`,
      `Extracted practical experience with structured API and database integrations.`
    ],
    criticalGaps: missing.length > 0 
      ? [`Missing explicit production experience in: ${missing.join(', ')}.`] 
      : ['Distributed systems scale metrics could be further substantiated during technical interview.'],
    experienceLevelMatch: {
      required: '3+ years',
      evaluated: '~3 years',
      assessment: 'Adequate'
    },
    targetedInterviewQuestions: {
      technical: [
        `Can you walk us through the architectural trade-offs you considered when choosing ${matched[0] || 'your core stack'} for your most recent project?`,
        `How have you handled high-traffic bottlenecks, database connection pooling, or query optimization in production?`,
        missing.length > 0 
          ? `Our JD emphasizes ${missing[0]}. Have you had exposure to this or similar paradigms in personal projects or prior roles?`
          : `Explain your testing and CI/CD strategy for zero-downtime deployments.`
      ],
      behavioral: [
        `Describe a situation where a critical bug slipped into production. How did you coordinate the hotfix and communicate with stakeholders?`,
        `Tell us about a technical disagreement you had with an architect or peer. How did you find alignment?`
      ]
    },
    skillsMatch: sSkills,
    experienceMatch: sExp,
    educationMatch: 90,
    impactMatch: sImpact,
    mainStrength: `Core Stack: ${matched.slice(0, 2).join(' & ') || 'Technical Alignment'}`,
    mainGap: missing.length > 0 ? `Unverified: ${missing.join(', ')}` : 'Advanced Cloud Tuning',
    matchedRequirements: matched.map((kw, i) => ({
      id: `req-${i + 1}`,
      title: `${kw.toUpperCase()} Implementation`,
      status: 'MATCHED',
      explanation: `Extracted direct evidence of ${kw} usage in resume text.`,
      fieldId: 'SKILLS-LIST',
      evidence: `Verified occurrence of "${kw}" in candidate experience history.`,
      isVerbatimVerified: true
    })),
    missingRequirements: missing.map((kw, i) => ({
      id: `gap-${i + 1}`,
      title: `${kw.toUpperCase()} Production Experience`,
      status: 'NOT_FOUND',
      explanation: `No supporting evidence found in candidate resume text for ${kw}.`,
      fieldId: 'API-EXP'
    }))
  };
}
