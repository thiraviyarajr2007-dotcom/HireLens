# Project Better Tomorrow — Evaluation & Alignment Matrix

> **NOTE FOR REVIEWERS & MAINTAINERS**:
> Please paste the exact Pathway A / Pathway B rubric requirements below where indicated. Until the human evaluator provides the final criteria specifications, this document tracks the concrete technical evidence built into the HireLens codebase versus the human research evidence required from user interviews.

---

## 1. Project Better Tomorrow Pathway Alignment

### Specific Pathway Requirements
`TODO (Human maintainer: please paste exact Pathway A or Pathway B rubric requirements here)`

---

## 2. Evidence Mapping: Codebase Evidence vs. Human Research Requirements

| Pathway Criterion Dimension | Status | Concrete Codebase Evidence (Truth-Backed) | Human Data Requirement (TODO) |
| :--- | :---: | :--- | :--- |
| **1. AI Transparency & Anti-Hallucination** | `EVIDENCED IN CODE` | • Strict verbatim quote substring verification with char offsets (`server/services/pipeline/grounding.js`).<br>• Rejection of hallucinated claims down to `UNVERIFIED` with 0 score points.<br>• Automated adversarial prompt injection detection (`server/services/pipeline/injectionDetector.js`). | None needed — fully evidenced by code and automated unit tests (`npm test`). |
| **2. Algorithmic Fairness & Bias Mitigation** | `EVIDENCED IN CODE` | • Default Blind Review Mode with recruiter identity shielding (`src/pages/CandidateAnalysisPage.jsx`).<br>• Automated counterfactual testing testing gender/prestige deltas (`npm run bias:test`).<br>• Reversible demographic and contact PII redaction (`server/services/pipeline/redactor.js`). | None needed — fully evidenced by automated bias testing suite over synthetic fixtures. |
| **3. Recruiter Human Agency & Accountability** | `EVIDENCED IN CODE` | • Recruiter manual override ledger with mandatory written rationale (`POST /api/audit/override/:evaluationId`).<br>• Interactive deterministic weight sliders allowing recruiters to adjust criteria importance (`src/pages/RankingsPage.jsx`).<br>• Dedicated AI Divergence Audit dashboard (`src/pages/AiAuditPage.jsx`). | None needed — fully evidenced in application workflow. |
| **4. User Empathy & Discovery Research** | `PENDING HUMAN SESSIONS` | • Standardized interview protocols prepared in [`docs/USER_RESEARCH/discovery-interview-template.md`](USER_RESEARCH/discovery-interview-template.md). | **TODO (real data required)**: Human researcher must conduct real recruiter interviews and populate session notes without fabrication. |
| **5. Prototype Testing & Usability Validation** | `PENDING HUMAN SESSIONS` | • Usability and time-to-decision measurement protocol prepared in [`docs/USER_RESEARCH/prototype-test-protocol.md`](USER_RESEARCH/prototype-test-protocol.md). | **TODO (real data required)**: Human researcher must time real participants before and after HireLens and record durations in [`docs/USER_RESEARCH/feedback-log.md`](USER_RESEARCH/feedback-log.md). |

---

## 3. Reviewer Verification Steps

Reviewers can verify every technical claim locally on their machine:

1. **Verify Verbatim Grounding & Scoring Formula**:
   ```bash
   npm test
   ```
2. **Verify Demographic Invariance & Counterfactual Fairness**:
   ```bash
   npm run bias:test
   ```
3. **Verify Production Bundle**:
   ```bash
   npm run build
   ```
4. **Inspect Immutable Audit Ledger**:
   Navigate to `/candidate/:id/audit` in the running web interface.
