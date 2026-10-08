import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractCandidateFields } from '../fieldExtractor.js';
import { redactPII } from './redactor.js';
import { detectPromptInjection } from './injectionDetector.js';
import { callLlmEvaluation, PROMPT_VERSION } from './llmClient.js';
import { groundEvidenceRequirements } from './grounding.js';
import { calculateDeterministicScore } from './scorer.js';
import { parseJobDescription, getJobById, saveJobEntity } from './jobService.js';
import { explainSkillGaps } from '../skillGapService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPT_FILE = path.resolve(__dirname, '../../prompts/evaluation.v1.txt');

/**
 * Full End-to-End Evaluation Pipeline:
 * Implements strict factual grounding, prompt injection defense, and deterministic scoring.
 */
export async function runEvaluationPipeline({
  rawResumeText = '',
  fileName = 'Resume.pdf',
  jobDescription = '',
  jobId = null,
  onStage = null
}) {
  const startTime = Date.now();

  // 1. Resolve or Create Job Entity (B9)
  onStage?.('RESOLVING_JOB', { stageName: 'Resolving Job Requirements' });
  let job = jobId ? getJobById(jobId) : null;
  if (!job) {
    job = parseJobDescription(jobDescription);
    saveJobEntity(job);
  }

  // 2. Structured Field Extraction
  onStage?.('EXTRACTING_FIELDS', { stageName: 'Extracting Resume Facts' });
  const fields = extractCandidateFields(rawResumeText, fileName);

  // 3. Prompt Injection Detection (B13)
  onStage?.('DETECTING_INJECTION', { stageName: 'Auditing Adversarial Injection Directives' });
  const injectionResult = detectPromptInjection(rawResumeText);

  // 4. PII Redaction v2 (B6)
  onStage?.('REDACTING_PII', { stageName: 'Applying Blind Demographic Redaction' });
  const { redactedText, tokenMap } = redactPII(rawResumeText, fields);

  // 5. Load Versioned Prompt Template
  let systemPromptTemplate = '';
  try {
    systemPromptTemplate = fs.readFileSync(PROMPT_FILE, 'utf-8');
  } catch (err) {
    systemPromptTemplate = 'You are HireLens AI. Evaluate candidate qualifications objectively.';
  }

  // Format requirement list for LLM
  const reqPrompts = (job.requirements || []).map(r => `- [${r.id}] ${r.title} (${r.isMandatory ? 'Mandatory' : 'Preferred'})`).join('\n');
  const userPrompt = `### Job Title: ${job.title}\n### Job Requirements:\n${reqPrompts}\n\n### Candidate Resume (Sanitized, Untrusted):\n<resume_text>\n${redactedText}\n</resume_text>`;

  // 6. Execute LLM Stage with Schema Validation (B7, B14)
  onStage?.('MATCHING_REQUIREMENTS', { stageName: 'Extracting Verbatim Requirement Quotes' });
  const llmResult = await callLlmEvaluation({
    systemPrompt: systemPromptTemplate,
    userPrompt
  });

  let rawRequirements = [];
  let summary = '';
  let strengths = [];
  let gaps = [];
  let questions = { technical: [], behavioral: [] };
  let detectedYears = 0;

  if (llmResult.success && llmResult.data) {
    const data = llmResult.data;
    summary = data.candidate_summary;
    detectedYears = data.experience_years_detected || 0;
    rawRequirements = data.requirements.map(r => {
      const jobReq = (job.requirements || []).find(jr => jr.id === r.requirementId);
      return {
        ...r,
        title: jobReq ? jobReq.title : r.requirementId,
        isMandatory: jobReq ? jobReq.isMandatory : true
      };
    });
    strengths = data.key_strengths || [];
    gaps = data.critical_gaps || [];
    questions = data.targeted_interview_questions || { technical: [], behavioral: [] };
  } else {
    // Transparent Heuristic Fallback (B5: labelled, no fake evidence strings)
    const heuristicData = generateTransparentHeuristicMatch(rawResumeText, job, fields);
    rawRequirements = heuristicData.requirements;
    summary = heuristicData.summary;
    strengths = heuristicData.strengths;
    gaps = heuristicData.gaps;
    questions = heuristicData.questions;
    detectedYears = heuristicData.detectedYears;
  }

  // 7. Grounding Stage (B4: verbatim verification against original resume with offsets)
  onStage?.('GROUNDING_EVIDENCE', { stageName: 'Verifying Quotes & Hallucination Audit' });
  const { verifiedRequirements, rejectedEvidence, divergences } = groundEvidenceRequirements(
    rawRequirements,
    rawResumeText
  );

  // 8. Deterministic Scoring (B3: pure function, no circular logic)
  onStage?.('CALCULATING_SCORE', { stageName: 'Executing Deterministic Scorer' });
  const scoring = calculateDeterministicScore({
    verifiedRequirements,
    detectedYears,
    requiredYears: job.requiredYears,
    resumeText: rawResumeText,
    hasEducation: Boolean(fields.education),
    weights: job.weights
  });

  const fitStatus = scoring.finalScore >= 85 ? 'Strong Match' : scoring.finalScore >= 70 ? 'Moderate Match' : 'Partial Match';

  // 9. Generate targeted interview questions for unsubstantiated claims
  if (rejectedEvidence.length > 0) {
    rejectedEvidence.forEach(rej => {
      questions.technical.unshift(`The claim "${rej.quote.slice(0, 50)}..." could not be verified in the source text. Could you describe your hands-on work regarding this?`);
    });
  }

  // 10. Assemble Evaluation Audit Log (Phase 3 divergence record)
  onStage?.('AUDIT_LOGGING', { stageName: 'Recording Immutable Audit Ledger' });
  const evaluationId = 'eval_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  const evaluationRecord = {
    id: evaluationId,
    jobId: job.id,
    jobTitle: job.title,
    promptVersion: PROMPT_VERSION,
    model: llmResult.model || 'heuristic-engine',
    provider: llmResult.provider || 'heuristic',
    analysisMode: llmResult.analysisMode,
    fallbackReason: llmResult.fallbackReason || null,
    latencyMs: Date.now() - startTime,
    injectionSuspected: injectionResult.injectionSuspected,
    detectedInjectionPatterns: injectionResult.detectedPatterns,
    scoring,
    fitScore: scoring.finalScore,
    fitStatus,
    recommendation: `${fitStatus}. Evaluated in ${llmResult.analysisMode === 'ai' ? 'AI Grounded' : 'Heuristic'} mode with score ${scoring.finalScore}%.`,
    candidateSummary: summary,
    keyStrengths: strengths,
    criticalGaps: gaps,
    targetedInterviewQuestions: questions,
    verifiedRequirements,
    rejectedEvidence,
    divergences,
    skillGaps: explainSkillGaps(verifiedRequirements, fields.skills),
    tokenMapCount: Object.keys(tokenMap).length,
    timestamp: new Date().toISOString()
  };

  return {
    fields,
    evaluation: evaluationRecord,
    job
  };
}

function generateTransparentHeuristicMatch(resumeText = '', job, fields) {
  const textLower = resumeText.toLowerCase();

  const requirements = (job.requirements || []).map(r => {
    const kw = r.skill ? r.skill.toLowerCase() : r.title.toLowerCase();
    const isPresent = textLower.includes(kw);
    let snippet = null;

    if (isPresent) {
      const lines = resumeText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.toLowerCase().includes(kw)) {
          snippet = line.slice(0, 160);
          break;
        }
      }
    }

    return {
      requirementId: r.id,
      title: r.title,
      isMandatory: r.isMandatory,
      status: isPresent ? 'MATCHED' : 'NOT_FOUND',
      evidenceQuote: snippet,
      reasoning: isPresent ? `Keyword "${r.skill || r.title}" matched in resume text.` : 'No occurrence found in resume text.'
    };
  });

  const matched = requirements.filter(r => r.status === 'MATCHED');
  const missing = requirements.filter(r => r.status === 'NOT_FOUND');

  // Estimate experience from date spans
  const dateMatches = (resumeText || '').match(/\b(20\d{2})\s*[-–—]\s*(20\d{2}|present|current)\b/gi) || [];
  const detectedYears = Math.min(10, Math.max(1, dateMatches.length * 1.5));

  return {
    requirements,
    detectedYears,
    summary: `Heuristic evaluation against ${job.title}. Candidate demonstrates verifiable alignment with ${matched.length} requirements with ${missing.length} unverified gaps.`,
    strengths: matched.slice(0, 3).map(m => `Demonstrated skill: ${m.title}`),
    gaps: missing.slice(0, 3).map(m => `Missing requirement: ${m.title}`),
    questions: {
      technical: missing.slice(0, 2).map(m => `Can you explain your background or project experience with ${m.title}?`),
      behavioral: [
        'How do you manage cross-functional priorities and technical debt under tight deadlines?',
        'Describe a time you resolved an unexpected production incident.'
      ]
    }
  };
}
