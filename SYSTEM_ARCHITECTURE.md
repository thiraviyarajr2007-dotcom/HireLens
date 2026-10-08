# HireLens System Architecture

> For complete Mermaid diagrams, container flows, data pipeline specifications, and deployment topology, please consult the primary architecture specification: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Architecture Truth Table

All features documented here are backed by actual code in this repository:

| Capability | Status | File Implementation |
| :--- | :---: | :--- |
| **Deterministic Grounded Scorer** | `IMPLEMENTED` | [`server/services/pipeline/scorer.js`](server/services/pipeline/scorer.js) |
| **Verbatim Quote Grounding & Offsets** | `IMPLEMENTED` | [`server/services/pipeline/grounding.js`](server/services/pipeline/grounding.js) |
| **PII Blind Redaction v2** | `IMPLEMENTED` | [`server/services/pipeline/redactor.js`](server/services/pipeline/redactor.js) |
| **Prompt Injection Defense** | `IMPLEMENTED` | [`server/services/pipeline/injectionDetector.js`](server/services/pipeline/injectionDetector.js) |
| **Multi-Provider LLM Client** | `IMPLEMENTED` | [`server/services/pipeline/llmClient.js`](server/services/pipeline/llmClient.js) |
| **Counterfactual Bias Testing** | `IMPLEMENTED` | [`server/services/auditService.js`](server/services/auditService.js) |
| **AI Divergence & Interaction Ledger** | `IMPLEMENTED` | [`server/services/pipeline/evaluationEngine.js`](server/services/pipeline/evaluationEngine.js) |
| **Human Recruiter Override Ledger** | `IMPLEMENTED` | [`server/services/auditService.js`](server/services/auditService.js) |
| **Per-User Isolation & Auth Guard** | `IMPLEMENTED` | [`server/middleware/auth.js`](server/middleware/auth.js) |
| **Multi-JD Job Entities** | `IMPLEMENTED` | [`server/services/pipeline/jobService.js`](server/services/pipeline/jobService.js) |
| **Real-time SSE Pipeline Streamer** | `IMPLEMENTED` | [`server/services/runManager.js`](server/services/runManager.js) |
| **Storage Repository (Local/Firestore)**| `IMPLEMENTED` | [`server/services/storage.js`](server/services/storage.js) |
| **Skill-Gap Transferable Explainer** | `IMPLEMENTED` | [`server/services/skillGapService.js`](server/services/skillGapService.js) |
| **Cloud Storage Binary Blobs** | `PLANNED` | Planned for v2.0 object store integration |
| **Enterprise SAML / SSO** | `PLANNED` | Planned for v2.0 enterprise tier |
