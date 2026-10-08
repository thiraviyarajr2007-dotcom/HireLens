# HireLens — Changelog & Bug Fix Ledger

All notable changes and architectural improvements across the codebase are recorded in this document, referencing each resolved issue by its Bug ID (**B1** through **B19**).

---

## [1.0.0] — 2026-10-08

### Data Integrity & Correctness Fixes
- **B1 Fixed** (`server/services/fieldExtractor.js`):
  - Completely rewrote field extraction engine.
  - Eliminated all fabricated defaults (e.g. "John Mathew", fake phone numbers, fake emails, guessed Stanford degrees, fake skills).
  - Missing fields now strictly return `value: null` with status `NOT_FOUND` and display "Not found in resume" in the UI.
  - Replaced hardcoded 96/100 confidence factors with dynamically computed confidence scores based on text positioning and section hierarchy.
- **B2 Fixed** (`server/routes/api.js`):
  - Removed hardcoded `role: 'Senior Software Engineer'`, `location: 'San Francisco, CA'`, and uncredited Unsplash avatar image.
  - Candidate role is now derived dynamically from the Job Description or resume; location is extracted from resume or set to `null`; avatar renders initials fallback when absent.
- **B3 Fixed** (`server/services/pipeline/scorer.js`):
  - Eliminated circular LLM scoring where sub-scores were artificially offset from a single model guess.
  - Implemented pure deterministic mathematical scoring formula combining grounded skills, pro-rated experience years, quantified impact bullet metrics, and education.
  - Handled edge case where candidates with legitimate score of 0 are preserved rather than defaulted to 70.
- **B4 Fixed** (`server/services/pipeline/grounding.js`):
  - Replaced 30-character prefix check with full-quote verbatim substring verification against raw resume text.
  - Computes exact character offsets (`charStart`, `charEnd`) for highlighted evidence spans.
  - Hallucinated quotes claimed by LLMs are rejected, flagged in the AI Divergence audit, and downgraded to `UNVERIFIED` with 0 score points.
- **B5 Fixed** (`server/services/pipeline/evaluationEngine.js`):
  - Renamed offline fallback to transparent **"Heuristic mode (no LLM)"**.
  - Appends visible UI badge indicating heuristic execution.
  - Removed all fabricated occurrence evidence strings in heuristic evaluations.
- **B6 Fixed** (`server/services/pipeline/redactor.js`):
  - Rewrote phone number regex with negative lookarounds to protect chronological date ranges (`2020 - 2022`) from text corruption.
  - Implemented reversible token map (`[REDACTED_NAME_1]`, `[REDACTED_EMAIL_1]`) redacting names, emails, phones, addresses, and gender pronouns before sending to LLM.
- **B7 Fixed** (`server/services/pipeline/llmClient.js`):
  - Fixed endpoint routing for Google Gemini to target native `generativelanguage.googleapis.com` with JSON generation mode.
  - Supports Gemini-only, OpenAI, Groq, and Ollama setups without 401 fallback failure.
- **B8 Fixed** (`server/services/profileConsolidator.js`):
  - Re-evaluating an existing candidate now synchronizes all candidate fields (`candidateSummary`, `keyStrengths`, `criticalGaps`, `experienceLevelMatch`, `targetedInterviewQuestions`, `extractedProfile`).
  - Replaced loose 6-character name matching with strict candidate identity verification to prevent false merges.
- **B9 Fixed** (`server/services/pipeline/jobService.js`):
  - Created first-class `Job` entity parsing job descriptions into structured mandatory and preferred requirements.
  - Evaluations belong to `(candidateId, jobId)` pairs, preventing score overwrites when evaluating candidates against multiple roles.
- **B10 Fixed** (`server/routes/api.js` & `src/services/apiClient.js`):
  - Deleted dead code `server/services/jdAnalyzer.js`.
  - Deleted mock client-side fallback `src/services/analysisEngine.js` that evaluated fake template strings.
  - Replaced with real error state in UI when backend service is unavailable.
- **B11 Fixed** (`server/services/segmenter.js`):
  - Fixed section header detection to require short, standalone lines ($\le 35$ characters).
  - Dropped inline terms `tools`, `languages`, `degree`, `university`, `college` from triggering false section splits.
- **B19 Fixed** (`server/services/extractor.js`):
  - Added explicit rejection and clear guidance for binary legacy `.doc` files (`UNSUPPORTED_LEGACY_DOC`).
  - Added detection and actionable error message for scanned image-only PDFs lacking text streams (`SCANNED_OR_EMPTY_PDF`).

### Security & Architectural Fixes
- **B12 Fixed** (`server/middleware/auth.js` & `src/App.jsx`):
  - Implemented Firebase ID token verification middleware on all protected API routes.
  - Enforced per-user multi-tenant data isolation (`req.ownerUid` on all collections).
  - Restricted CORS origins to environment-configured whitelist.
  - Added client-side route guard in `src/App.jsx` redirecting unauthenticated visitors to `/login`.
  - Gated Demo Login behind `VITE_DEMO_MODE=true` and labelled demo session as a sandbox recruiter.
- **B13 Fixed** (`server/services/pipeline/injectionDetector.js`):
  - Wrapped untrusted resume content inside `<resume_text>` delimiters with system prompt isolation.
  - Added heuristic detector flagging adversarial directives ("ignore previous instructions", "score 100") with audit flag `injectionSuspected: true`.
- **B14 Fixed** (`server/services/pipeline/llmClient.js`):
  - Added strict Zod schema validation (`EvaluationOutputSchema`) on all LLM responses.
  - Added 30-second execution timeout, exponential backoff retries, and automated JSON repair parser.
- **B15 Fixed** (`server/services/storage.js` & `src/services/apiClient.js`):
  - Built storage repository pattern supporting atomic file writes with a mutex in local mode and Cloud Firestore in production.
  - Configured `VITE_API_URL` dynamic API host and updated `firebase.json` with Cloud Run `/api` rewrites.
- **B16 Fixed** (`src/pages/ProcessingPage.jsx` & `server/services/runManager.js`):
  - Replaced fake 450ms timer with real Server-Sent Events (SSE) broadcasting actual backend pipeline stages.
  - UI renders live stage progress and displays exact failure points on errors.
- **B17 Fixed** (`server/routes/api.js` & `src/pages/RankingsPage.jsx`):
  - Concurrency limited bulk resume analysis to maximum 3 parallel evaluations.
  - Added per-file status tracking (`DONE` vs `FAILED` with reason) and partial-success summaries.
  - Added downloadable CSV export of candidate rankings.
- **B18 Fixed** (Repo Hygiene):
  - Removed tracked `dist/` from git cache and un-commented `.gitignore`.
  - Removed duplicate 1.5MB `.mp4` video files, preserving one master teaser in `src/assets/`.
  - Created `.env.example` documenting all configuration keys.
  - Configured GitHub Actions CI pipeline in `.github/workflows/ci.yml`.
