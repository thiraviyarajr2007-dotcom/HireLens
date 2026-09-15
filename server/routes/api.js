import express from 'express';
import multer from 'multer';
import { extractTextFromFile } from '../services/extractor.js';
import { extractCandidateFields } from '../services/fieldExtractor.js';
import { analyzeJobFit } from '../services/jdAnalyzer.js';
import { evaluateCandidateWithAI } from '../services/aiService.js';
import { matchAndUpdateCandidate } from '../services/profileConsolidator.js';
import { loadStore, saveStore } from '../services/storage.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'online', service: 'HireLens AI REST API', timestamp: new Date().toISOString() });
});

// GET /api/candidates
router.get('/candidates', (req, res) => {
  const store = loadStore();
  const sorted = [...store.candidates].sort((a, b) => b.fitScore - a.fitScore);
  res.json({ success: true, candidates: sorted });
});

// GET /api/candidates/:id
router.get('/candidates/:id', (req, res) => {
  const store = loadStore();
  const candidate = store.candidates.find(c => c.id === req.params.id);
  if (!candidate) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Candidate not found' } });
  }
  res.json({ success: true, candidate });
});

// GET /api/candidates/:id/evidence
router.get('/candidates/:id/evidence', (req, res) => {
  const store = loadStore();
  const candidate = store.candidates.find(c => c.id === req.params.id);
  if (!candidate) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Candidate not found' } });
  }
  res.json({ success: true, evidenceFields: candidate.evidenceFields || {} });
});

// GET /api/history
router.get('/history', (req, res) => {
  const store = loadStore();
  res.json({ success: true, history: store.history });
});

// POST /api/analyze (Single Resume)
router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    const jobDescription = req.body.jobDescription || '';
    if (!jobDescription.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_JD', message: 'Please provide a job description.' }
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

    // 1. Structured Field Extraction
    const fields = extractCandidateFields(rawText, fileName);

    // 2. Job Fit Analysis (AI Evaluator with graceful fallback)
    const fit = await evaluateCandidateWithAI(rawText, jobDescription, fields);

    // Assemble Candidate Model
    const candidateData = {
      id: 'c_' + Date.now(),
      name: fields.fullName,
      role: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      email: fields.email,
      phone: fields.phone,
      linkedin: fields.linkedin,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      fitScore: fit.fitScore,
      fitStatus: fit.fitStatus,
      recommendation: fit.recommendation,
      candidateSummary: fit.candidateSummary,
      keyStrengths: fit.keyStrengths,
      criticalGaps: fit.criticalGaps,
      experienceLevelMatch: fit.experienceLevelMatch,
      targetedInterviewQuestions: fit.targetedInterviewQuestions,
      skillsMatch: fit.skillsMatch,
      experienceMatch: fit.experienceMatch,
      educationMatch: fit.educationMatch,
      mainStrength: fit.mainStrength,
      mainGap: fit.mainGap,
      extractedProfile: fields.extractedProfile,
      matchedRequirements: fit.matchedRequirements,
      missingRequirements: fit.missingRequirements,
      evidenceFields: fields.evidenceFields,
      documents: [{ name: fileName, date: new Date().toISOString().split('T')[0] }],
      resumeText: rawText
    };

    // 3. Profile Consolidation & Persistence
    const store = loadStore();
    const { candidate, isExisting } = matchAndUpdateCandidate(candidateData, store.candidates);

    if (isExisting) {
      store.candidates = store.candidates.map(c => c.id === candidate.id ? candidate : c);
    } else {
      store.candidates = [candidate, ...store.candidates];
    }

    // History Log
    const historyItem = {
      id: 'hist_' + Date.now(),
      candidateId: candidate.id,
      candidateName: candidate.name,
      role: candidate.role,
      fitScore: candidate.fitScore,
      date: new Date().toISOString().split('T')[0],
      status: isExisting ? 'Profile Updated' : 'Completed'
    };
    store.history = [historyItem, ...store.history];

    saveStore(store);

    res.json({
      success: true,
      candidate,
      isExisting,
      evidence: Object.values(candidate.evidenceFields || {}),
      fitAnalysis: fit
    });
  } catch (err) {
    console.error('API Error in /api/analyze:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Unable to process resume analysis.' }
    });
  }
});

// POST /api/analyze/bulk (Multiple Resumes)
router.post('/analyze/bulk', upload.array('resumes'), async (req, res) => {
  try {
    const jobDescription = req.body.jobDescription || '';
    if (!jobDescription.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_JD', message: 'Please provide a job description.' }
      });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FILES', message: 'Please upload at least one resume file.' }
      });
    }

    const store = loadStore();
    let currentCandidates = [...store.candidates];
    const processedCandidates = [];

    for (const file of files) {
      try {
        const rawText = await extractTextFromFile(file.buffer, file.originalname, file.mimetype);
        const fields = extractCandidateFields(rawText, file.originalname);
        const fit = await evaluateCandidateWithAI(rawText, jobDescription, fields);

        const candidateData = {
          id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: fields.fullName,
          role: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          email: fields.email,
          phone: fields.phone,
          linkedin: fields.linkedin,
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          fitScore: fit.fitScore,
          fitStatus: fit.fitStatus,
          recommendation: fit.recommendation,
          candidateSummary: fit.candidateSummary,
          keyStrengths: fit.keyStrengths,
          criticalGaps: fit.criticalGaps,
          experienceLevelMatch: fit.experienceLevelMatch,
          targetedInterviewQuestions: fit.targetedInterviewQuestions,
          skillsMatch: fit.skillsMatch,
          experienceMatch: fit.experienceMatch,
          educationMatch: fit.educationMatch,
          mainStrength: fit.mainStrength,
          mainGap: fit.mainGap,
          extractedProfile: fields.extractedProfile,
          matchedRequirements: fit.matchedRequirements,
          missingRequirements: fit.missingRequirements,
          evidenceFields: fields.evidenceFields,
          documents: [{ name: file.originalname, date: new Date().toISOString().split('T')[0] }],
          resumeText: rawText
        };

        const { candidate, isExisting } = matchAndUpdateCandidate(candidateData, currentCandidates);
        if (isExisting) {
          currentCandidates = currentCandidates.map(c => c.id === candidate.id ? candidate : c);
        } else {
          currentCandidates = [candidate, ...currentCandidates];
        }

        processedCandidates.push(candidate);

        // Record History
        store.history.unshift({
          id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          candidateId: candidate.id,
          candidateName: candidate.name,
          role: candidate.role,
          fitScore: candidate.fitScore,
          date: new Date().toISOString().split('T')[0],
          status: isExisting ? 'Profile Updated' : 'Completed'
        });
      } catch (err) {
        console.error(`Error processing file ${file.originalname}:`, err);
        // Individual file error doesn't break batch
      }
    }

    store.candidates = currentCandidates;
    saveStore(store);

    const sortedRankings = [...store.candidates].sort((a, b) => b.fitScore - a.fitScore);

    res.json({
      success: true,
      processedCount: processedCandidates.length,
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
