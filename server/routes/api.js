import express from 'express';
import multer from 'multer';
import { extractTextFromFile } from '../services/extractor.js';
import { matchAndUpdateCandidate } from '../services/profileConsolidator.js';
import { 
  loadStore, 
  saveStore, 
  getCandidates, 
  getCandidateById, 
  saveCandidate, 
  getJobs, 
  getJobById as getJobFromStore, 
  saveJob,
  getEvaluations,
  saveEvaluation,
  getHistory,
  saveHistory
} from '../services/storage.js';
import { runEvaluationPipeline } from '../services/pipeline/evaluationEngine.js';
import { parseJobDescription, saveJobEntity, getJobById, listAllJobs } from '../services/pipeline/jobService.js';
import { 
  runCounterfactualBiasTest, 
  applyHumanOverride, 
  logIdentityReveal, 
  getAggregateFairnessMetrics 
} from '../services/auditService.js';
import { requireAuth } from '../middleware/auth.js';
import { runManager } from '../services/runManager.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper for concurrency-limited execution (B17 fix: 3 parallel max)
async function runWithConcurrency(items, limit, workerFn) {
  const results = [];
  const executing = new Set();
  for (const item of items) {
    const p = Promise.resolve().then(() => workerFn(item));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

// -------------------------------------------------------------
// Public Endpoints
// -------------------------------------------------------------

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'online', service: 'HireLens AI REST API', timestamp: new Date().toISOString() });
});

// GET /api/analyze/:runId/events (Real SSE Stage Streaming, B16 fix)
router.get('/analyze/:runId/events', (req, res) => {
  runManager.addSseClient(req.params.runId, res);
});

// GET /api/analyze/:runId/status (Polling fallback)
router.get('/analyze/:runId/status', (req, res) => {
  const run = runManager.getRun(req.params.runId);
  if (!run) {
    return res.status(404).json({ success: false, error: { code: 'RUN_NOT_FOUND', message: 'No run found with this ID.' } });
  }
  res.json({ success: true, run });
});

// -------------------------------------------------------------
// Protected Routes: Require Firebase ID Token / Owner Isolation
// -------------------------------------------------------------
router.use(requireAuth);

// -------------------------------------------------------------
// Job Endpoints (B9: Job entity for multi-JD evaluation context)
// -------------------------------------------------------------

// GET /api/jobs
router.get('/jobs', (req, res) => {
  const jobs = listAllJobs();
  res.json({ success: true, jobs });
});

// GET /api/jobs/:id
router.get('/jobs/:id', (req, res) => {
  const job = getJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job record not found' } });
  }
  res.json({ success: true, job });
});

// POST /api/jobs (Parse JD into structured requirements)
router.post('/jobs', (req, res) => {
  try {
    const { jobDescription, title, requiredYears, educationReq, mandatorySkills, preferredSkills, weights } = req.body;
    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_JD', message: 'Please provide a job description.' } });
    }

    const job = parseJobDescription(jobDescription, {
      title,
      requiredYears,
      educationReq,
      mandatorySkills,
      preferredSkills,
      weights
    });

    saveJobEntity(job);
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'JOB_PARSE_ERROR', message: err.message } });
  }
});

// -------------------------------------------------------------
// Candidate & Evaluation Endpoints
// -------------------------------------------------------------

// GET /api/candidates
router.get('/candidates', async (req, res) => {
  const candidates = await getCandidates(req.ownerUid);
  const sorted = [...candidates].sort((a, b) => b.fitScore - a.fitScore);
  res.json({ success: true, candidates: sorted });
});

// GET /api/candidates/:id
router.get('/candidates/:id', async (req, res) => {
  const candidate = await getCandidateById(req.params.id, req.ownerUid);
  if (!candidate) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Candidate not found' } });
  }
  res.json({ success: true, candidate });
});

// GET /api/candidates/:id/evidence
router.get('/candidates/:id/evidence', async (req, res) => {
  const candidate = await getCandidateById(req.params.id, req.ownerUid);
  if (!candidate) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Candidate not found' } });
  }
  res.json({ success: true, evidenceFields: candidate.evidenceFields || {} });
});

// GET /api/history
router.get('/history', async (req, res) => {
  const history = await getHistory(req.ownerUid);
  res.json({ success: true, history });
});

// GET /api/evaluations/:id
router.get('/evaluations/:id', async (req, res) => {
  const evals = await getEvaluations(req.ownerUid);
  const evaluation = evals.find(e => e.id === req.params.id);
  if (!evaluation) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Evaluation audit not found' } });
  }
  res.json({ success: true, evaluation });
});

// POST /api/audit/counterfactual/:evaluationId
router.post('/audit/counterfactual/:evaluationId', async (req, res) => {
  try {
    const evals = await getEvaluations(req.ownerUid);
    const evaluation = evals.find(e => e.id === req.params.evaluationId);
    if (!evaluation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Evaluation not found' } });
    }

    const candidates = await getCandidates(req.ownerUid);
    const candidate = candidates.find(c => c.id === req.body.candidateId || c.evaluationId === evaluation.id);
    const resumeText = candidate?.resumeText || req.body.resumeText;
    if (!resumeText) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_TEXT', message: 'Resume text is required for counterfactual audit.' } });
    }

    const job = getJobById(evaluation.jobId);
    const report = await runCounterfactualBiasTest({
      evaluationId: evaluation.id,
      rawResumeText: resumeText,
      jobDescription: job?.rawText || req.body.jobDescription || '',
      threshold: req.body.threshold || 5
    });

    res.json({ success: true, report });
  } catch (err) {
    console.error('Counterfactual test error:', err);
    res.status(500).json({ success: false, error: { code: 'AUDIT_ERROR', message: err.message } });
  }
});

// POST /api/audit/override/:evaluationId
router.post('/audit/override/:evaluationId', (req, res) => {
  try {
    const { requirementId, newStatus, reason, reviewerId } = req.body;
    const result = applyHumanOverride({
      evaluationId: req.params.evaluationId,
      requirementId,
      newStatus,
      reason,
      reviewerId: reviewerId || req.user?.email || req.ownerUid || 'recruiter-admin'
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'OVERRIDE_FAILED', message: err.message } });
  }
});

// POST /api/audit/reveal/:evaluationId
router.post('/audit/reveal/:evaluationId', (req, res) => {
  try {
    const { candidateId, reviewerId, reason } = req.body;
    const log = logIdentityReveal({
      evaluationId: req.params.evaluationId,
      candidateId,
      reviewerId: reviewerId || req.user?.email || req.ownerUid || 'recruiter-admin',
      reason
    });
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'REVEAL_LOG_FAILED', message: err.message } });
  }
});

// GET /api/audit/aggregate
router.get('/audit/aggregate', (req, res) => {
  try {
    const metrics = getAggregateFairnessMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'METRICS_FAILED', message: err.message } });
  }
});

// POST /api/analyze (Single Resume with full pipeline and real SSE events)
router.post('/analyze', upload.single('resume'), async (req, res) => {
  const runId = req.headers['x-run-id'] || req.body.runId || `run_${Date.now()}`;
  try {
    const jobDescription = req.body.jobDescription || '';
    const jobId = req.body.jobId || null;

    if (!jobDescription.trim() && !jobId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_JD', message: 'Please provide a job description or select an existing job.' }
      });
    }

    let rawText = '';
    let fileName = 'Uploaded_Resume.pdf';

    if (req.file) {
      fileName = req.file.originalname;
      rawText = await extractTextFromFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    } else if (req.body.resumeText) {
      rawText = req.body.resumeText;
    } else {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FILE', message: 'Please upload a resume file.' }
      });
    }

    // Run Full Multi-Stage Grounded Pipeline with real stage emission (B16 fix)
    const { fields, evaluation, job } = await runEvaluationPipeline({
      rawResumeText: rawText,
      fileName,
      jobDescription,
      jobId,
      onStage: (stage, meta) => {
        runManager.emitStage(runId, stage, meta);
      }
    });

    // Assemble Candidate Model (Zero fabricated defaults, B2)
    const candidateData = {
      id: 'c_' + Date.now(),
      ownerUid: req.ownerUid,
      jobId: job.id,
      evaluationId: evaluation.id,
      name: fields.fullName || 'Candidate',
      role: job.title || 'Applicant',
      location: fields.location || null,
      email: fields.email || null,
      phone: fields.phone || null,
      linkedin: fields.linkedin || null,
      avatar: null,
      fitScore: evaluation.fitScore,
      fitStatus: evaluation.fitStatus,
      recommendation: evaluation.recommendation,
      candidateSummary: evaluation.candidateSummary,
      keyStrengths: evaluation.keyStrengths,
      criticalGaps: evaluation.criticalGaps,
      experienceLevelMatch: {
        required: `${job.requiredYears}+ years`,
        evaluated: `${evaluation.scoring?.subScores?.experience || 0}% match`,
        assessment: evaluation.fitStatus
      },
      targetedInterviewQuestions: evaluation.targetedInterviewQuestions,
      skillsMatch: evaluation.scoring?.subScores?.skills || 0,
      experienceMatch: evaluation.scoring?.subScores?.experience || 0,
      educationMatch: evaluation.scoring?.subScores?.education || 0,
      mainStrength: evaluation.keyStrengths[0] || 'Technical Profile Grounded',
      mainGap: evaluation.criticalGaps[0] || 'None identified',
      extractedProfile: fields.extractedProfile,
      matchedRequirements: evaluation.verifiedRequirements.filter(r => r.finalStatus === 'MATCHED'),
      missingRequirements: evaluation.verifiedRequirements.filter(r => r.finalStatus !== 'MATCHED'),
      evidenceFields: fields.evidenceFields,
      analysisMode: evaluation.analysisMode,
      scoringDetails: evaluation.scoring,
      evaluations: [evaluation],
      documents: [{ name: fileName, date: new Date().toISOString().split('T')[0] }],
      resumeText: rawText
    };

    // Profile Consolidation & Per-user Persistence
    await saveEvaluation({ ...evaluation, ownerUid: req.ownerUid }, req.ownerUid);

    const existingCandidates = await getCandidates(req.ownerUid);
    const { candidate, isExisting } = matchAndUpdateCandidate(candidateData, existingCandidates);
    await saveCandidate(candidate, req.ownerUid);

    // History Log
    const historyItem = {
      id: 'hist_' + Date.now(),
      ownerUid: req.ownerUid,
      candidateId: candidate.id,
      candidateName: candidate.name,
      role: candidate.role,
      fitScore: candidate.fitScore,
      date: new Date().toISOString().split('T')[0],
      status: isExisting ? 'Profile Updated' : 'Completed'
    };
    await saveHistory(historyItem, req.ownerUid);

    runManager.completeRun(runId, { candidate, evaluation, isExisting });

    res.json({
      success: true,
      runId,
      candidate,
      isExisting,
      evaluation,
      job,
      evidence: Object.values(candidate.evidenceFields || {})
    });
  } catch (err) {
    console.error('API Error in /api/analyze:', err);
    runManager.failRun(runId, err);
    res.status(500).json({
      success: false,
      runId,
      error: { code: 'SERVER_ERROR', message: err.message || 'Unable to process resume analysis.' }
    });
  }
});

// POST /api/analyze/bulk (Multiple Resumes with 3-parallel Concurrency Limiting, B17 fix)
router.post('/analyze/bulk', upload.array('resumes'), async (req, res) => {
  try {
    const jobDescription = req.body.jobDescription || '';
    const jobId = req.body.jobId || null;

    if (!jobDescription.trim() && !jobId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_JD', message: 'Please provide a job description or select an existing job.' }
      });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FILES', message: 'Please upload at least one resume file.' }
      });
    }

    let existingCandidates = await getCandidates(req.ownerUid);
    const processedCandidates = [];
    const fileStatuses = [];

    // Concurrency limit: maximum 3 files evaluated simultaneously (B17 fix)
    await runWithConcurrency(files, 3, async (file) => {
      try {
        const rawText = await extractTextFromFile(file.buffer, file.originalname, file.mimetype);
        const { fields, evaluation, job } = await runEvaluationPipeline({
          rawResumeText: rawText,
          fileName: file.originalname,
          jobDescription,
          jobId
        });

        await saveEvaluation({ ...evaluation, ownerUid: req.ownerUid }, req.ownerUid);

        const candidateData = {
          id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          ownerUid: req.ownerUid,
          jobId: job.id,
          evaluationId: evaluation.id,
          name: fields.fullName || 'Candidate',
          role: job.title || 'Applicant',
          location: fields.location || null,
          email: fields.email || null,
          phone: fields.phone || null,
          linkedin: fields.linkedin || null,
          avatar: null,
          fitScore: evaluation.fitScore,
          fitStatus: evaluation.fitStatus,
          recommendation: evaluation.recommendation,
          candidateSummary: evaluation.candidateSummary,
          keyStrengths: evaluation.keyStrengths,
          criticalGaps: evaluation.criticalGaps,
          experienceLevelMatch: {
            required: `${job.requiredYears}+ years`,
            evaluated: `${evaluation.scoring?.subScores?.experience || 0}% match`,
            assessment: evaluation.fitStatus
          },
          targetedInterviewQuestions: evaluation.targetedInterviewQuestions,
          skillsMatch: evaluation.scoring?.subScores?.skills || 0,
          experienceMatch: evaluation.scoring?.subScores?.experience || 0,
          educationMatch: evaluation.scoring?.subScores?.education || 0,
          mainStrength: evaluation.keyStrengths[0] || 'Technical Profile Grounded',
          mainGap: evaluation.criticalGaps[0] || 'None identified',
          extractedProfile: fields.extractedProfile,
          matchedRequirements: evaluation.verifiedRequirements.filter(r => r.finalStatus === 'MATCHED'),
          missingRequirements: evaluation.verifiedRequirements.filter(r => r.finalStatus !== 'MATCHED'),
          evidenceFields: fields.evidenceFields,
          analysisMode: evaluation.analysisMode,
          scoringDetails: evaluation.scoring,
          evaluations: [evaluation],
          documents: [{ name: file.originalname, date: new Date().toISOString().split('T')[0] }],
          resumeText: rawText
        };

        const { candidate, isExisting } = matchAndUpdateCandidate(candidateData, existingCandidates);
        await saveCandidate(candidate, req.ownerUid);
        existingCandidates = await getCandidates(req.ownerUid);

        processedCandidates.push(candidate);
        fileStatuses.push({ name: file.originalname, status: 'DONE', candidateId: candidate.id });

        await saveHistory({
          id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          ownerUid: req.ownerUid,
          candidateId: candidate.id,
          candidateName: candidate.name,
          role: candidate.role,
          fitScore: candidate.fitScore,
          date: new Date().toISOString().split('T')[0],
          status: isExisting ? 'Profile Updated' : 'Completed'
        }, req.ownerUid);
      } catch (err) {
        console.error(`Error processing file ${file.originalname}:`, err);
        fileStatuses.push({ name: file.originalname, status: 'FAILED', reason: err.message });
      }
    });

    const currentCandidates = await getCandidates(req.ownerUid);
    const sortedRankings = [...currentCandidates].sort((a, b) => b.fitScore - a.fitScore);

    res.json({
      success: true,
      processedCount: processedCandidates.length,
      failedCount: fileStatuses.filter(f => f.status === 'FAILED').length,
      fileStatuses,
      candidates: sortedRankings,
      rankings: sortedRankings
    });
  } catch (err) {
    console.error('API Error in /api/analyze/bulk:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Unable to process bulk analysis.' }
    });
  }
});

export default router;
