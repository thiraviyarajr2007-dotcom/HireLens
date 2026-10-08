# HireLens — REST API Contract Documentation

Base URL: `http://localhost:5000/api` (configurable via `VITE_API_URL`)

All endpoints (except `/api/health` and `/api/analyze/:runId/events`) require authentication via standard HTTP Bearer token:
`Authorization: Bearer <FIREBASE_ID_TOKEN>`

---

## 1. Authentication & Security

- **Mechanism**: Firebase ID Token verified using `firebase-admin` authentication middleware.
- **Data Isolation**: All resources are strictly isolated by `req.ownerUid`. Users can only query and mutate records they own.
- **Sandbox Demo Token**: When `VITE_DEMO_MODE=true` is enabled in `.env`, the token `Bearer demo-token-recruiter` is accepted for testing without Firebase setup.
- **Rate Limiting**: `/api/analyze` and `/api/analyze-bulk` are limited to 60 requests per 15-minute window per IP. Exceeding requests respond with `429 Too Many Requests`.

---

## 2. API Endpoints

### 2.1. `GET /api/health`
Public liveness and health check endpoint.

**Response `200 OK`**:
```json
{
  "status": "online",
  "service": "HireLens AI REST API",
  "timestamp": "2026-10-08T12:00:00.000Z"
}
```

---

### 2.2. `POST /api/analyze`
Executes the full end-to-end multi-stage grounded candidate evaluation pipeline.

**Headers**:
- `Authorization: Bearer <TOKEN>`
- `Content-Type: multipart/form-data`
- `x-run-id: run_1728388481_abc1` *(Optional: custom run ID for SSE tracking)*

**Request Parameters**:
- `resume`: Binary file (PDF, DOCX, TXT; max 10MB).
- `jobDescription`: String job requirements text.
- `jobId`: String ID of existing parsed job *(optional)*.

**Response `200 OK`**:
```json
{
  "success": true,
  "runId": "run_1728388481_abc1",
  "candidate": {
    "id": "c_1728388482001",
    "name": "Sarah Connor",
    "role": "Senior Full Stack Engineer",
    "location": "Austin, TX",
    "email": "s.connor@cyberdyne.dev",
    "phone": "+1 (512) 555-0199",
    "fitScore": 88,
    "fitStatus": "Strong Match",
    "analysisMode": "ai",
    "skillsMatch": 92,
    "experienceMatch": 85,
    "educationMatch": 80,
    "mainStrength": "Production React & TypeScript Systems",
    "mainGap": "No Kubernetes experience mentioned",
    "matchedRequirements": [
      {
        "id": "req_1",
        "title": "3+ years React and TypeScript",
        "finalStatus": "MATCHED",
        "evidenceQuote": "Led development of scalable web interfaces using React 18, TypeScript, and Tailwind.",
        "charStart": 240,
        "charEnd": 328
      }
    ],
    "evidenceFields": {
      "name": {
        "value": "Sarah Connor",
        "status": "FOUND",
        "confidence": 0.95
      }
    }
  },
  "isExisting": false,
  "evaluation": {
    "id": "eval_1728388482001_xy7z",
    "fitScore": 88,
    "promptVersion": "v1.0.0",
    "model": "gemini-1.5-flash",
    "provider": "gemini"
  }
}
```

---

### 2.3. `GET /api/analyze/:runId/events`
Server-Sent Events (SSE) stream broadcasting real pipeline progression stages in real-time.

**Stream Event Types**:
1. `init`: Initial stage status snapshot `{ runId, status, stages }`.
2. `stage`: Pipeline stage entry `{ stage, timestamp, meta }`.
   - `RESOLVING_JOB`
   - `EXTRACTING_FIELDS`
   - `DETECTING_INJECTION`
   - `REDACTING_PII`
   - `MATCHING_REQUIREMENTS`
   - `GROUNDING_EVIDENCE`
   - `CALCULATING_SCORE`
   - `AUDIT_LOGGING`
3. `complete`: Analysis finalized `{ status: "DONE", result }`.
4. `error`: Analysis failed with failure details `{ status: "FAILED", error }`.

---

### 2.4. `POST /api/analyze/bulk`
Processes multiple resumes concurrently with a hard concurrency limit of **3 parallel evaluations** to preserve system stability.

**Request Parameters**:
- `resumes`: Array of binary files.
- `jobDescription`: String job requirements text.

**Response `200 OK`**:
```json
{
  "success": true,
  "processedCount": 10,
  "failedCount": 0,
  "fileStatuses": [
    { "name": "alice_resume.pdf", "status": "DONE", "candidateId": "c_1" },
    { "name": "bob_resume.pdf", "status": "DONE", "candidateId": "c_2" }
  ],
  "candidates": [ ... ],
  "rankings": [ ... ]
}
```

---

### 2.5. `POST /api/audit/counterfactual/:evaluationId`
Re-runs candidate evaluation against 3 counterfactual permutations to audit demographic & prestige bias.

**Request Body**:
```json
{
  "threshold": 5
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "report": {
    "evaluationId": "eval_1728388482001_xy7z",
    "threshold": 5,
    "isFlagged": false,
    "maxDelta": 0,
    "baselineScore": 88,
    "variations": {
      "nameGenderSwap": { "score": 88, "delta": 0, "flagged": false },
      "institutionMasking": { "score": 88, "delta": 0, "flagged": false },
      "blindRedaction": { "score": 88, "delta": 0, "flagged": false }
    },
    "fairnessAssessment": "FAIRNESS CONFIRMED: Deterministic pipeline maintained score invariance within 5% across all demographic permutations."
  }
}
```

---

### 2.6. `POST /api/audit/override/:evaluationId`
Allows a recruiter to record a manual override on a requirement evaluation decision. Overrides require a mandatory human rationale.

**Request Body**:
```json
{
  "requirementId": "req_cloud",
  "newStatus": "MATCHED",
  "reason": "Candidate provided GitHub repository demonstrating AWS ECS deployment architecture in interview."
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "previousScore": 82,
  "newScore": 88,
  "overrideLog": {
    "id": "ovr_1728388500",
    "requirementId": "req_cloud",
    "newStatus": "MATCHED",
    "reason": "Candidate provided GitHub repository demonstrating AWS ECS deployment architecture in interview.",
    "reviewerId": "recruiter@hirelens.ai",
    "timestamp": "2026-10-08T12:05:00.000Z"
  }
}
```

---

### 2.7. `GET /api/audit/aggregate`
Returns platform-wide aggregate fairness metrics across all analyzed candidates.

**Response `200 OK`**:
```json
{
  "success": true,
  "metrics": {
    "totalEvaluations": 14,
    "meanDemographicDelta": 0.0,
    "totalGrounded": 62,
    "totalRejectedEvidence": 0,
    "totalHumanOverrides": 2
  }
}
```

---

## 3. Error Codes & Format

All error responses return structured JSON:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Missing Bearer token in Authorization header."
  }
}
```

| HTTP Status | Code | Description |
| :---: | :--- | :--- |
| `400` | `MISSING_JD` | Job description text was not provided. |
| `400` | `MISSING_FILE` | No resume file or text was submitted. |
| `400` | `OVERRIDE_FAILED` | Missing mandatory rationale for recruiter override. |
| `401` | `UNAUTHORIZED` | Missing, malformed, or expired Firebase ID token. |
| `404` | `NOT_FOUND` | Candidate, job, or evaluation ID does not exist. |
| `429` | `TOO_MANY_REQUESTS`| Analysis rate limit exceeded (max 60 per 15 min). |
| `500` | `SERVER_ERROR` | Internal server or unhandled pipeline error. |
