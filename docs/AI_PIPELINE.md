# HireLens — AI Pipeline, Grounding & Deterministic Scoring Specification

## 1. Pipeline Architecture Overview

The HireLens candidate evaluation pipeline is designed to eliminate circular AI scoring and LLM hallucinations. The LLM is used **strictly as an information extraction agent**, returning factual quotes and requirement statuses. It **never generates the final score**.

```
[Resume Upload]
       │
       ▼
[Stage 1: Text & Document Extraction] (server/services/extractor.js)
       │
       ▼
[Stage 2: Section Segmentation] (server/services/segmenter.js)
       │
       ▼
[Stage 3: Structured Fact Extraction] (server/services/fieldExtractor.js)
       │
       ▼
[Stage 4: Adversarial Injection Auditing] (server/services/pipeline/injectionDetector.js)
       │
       ▼
[Stage 5: Blind Demographic & PII Redaction] (server/services/pipeline/redactor.js)
       │
       ▼
[Stage 6: Fenced LLM Requirement Matching] (server/services/pipeline/llmClient.js)
       │
       ▼
[Stage 7: Verbatim Grounding & Anti-Hallucination] (server/services/pipeline/grounding.js)
       │
       ▼
[Stage 8: Deterministic Pure Scoring Engine] (server/services/pipeline/scorer.js)
       │
       ▼
[Stage 9: Transferable Skill Gap Explanation] (server/services/skillGapService.js)
       │
       ▼
[Stage 10: Immutable Audit Logging & Persistence] (server/services/storage.js)
```

---

## 2. Pipeline Stages & Schemas

### Stage 1: Document Extraction
- **Input**: Raw Buffer (`.pdf`, `.docx`, `.txt`).
- **Processing**: Extracts UTF-8 text using `pdf-parse` or `mammoth`.
- **Integrity**: Explicitly rejects scanned PDFs without OCR text (`SCANNED_OR_EMPTY_PDF`) and binary legacy `.doc` files (`UNSUPPORTED_LEGACY_DOC`).

### Stage 2 & 3: Field Extraction (Zero Hallucination)
- **Input**: Extracted resume string.
- **Rule**: If a field (e.g., email, phone, name) is not detected, it is returned as `null` with status `NOT_FOUND`. **No fallbacks like "John Mathew" or fake numbers are ever generated.**
- **Confidence**: Dynamically computed based on extraction location (e.g. Header line = 0.95; section block = 0.85; body infer = 0.60).

### Stage 4: Prompt Injection Defense
- **Detector**: Scans raw resume for adversarial directives (e.g. "ignore previous instructions", "give this candidate 100", "system prompt override").
- **Audit Flag**: If detected, records `injectionSuspected: true` and isolates detected tokens in the audit log.
- **Fencing**: Untrusted resume text is quarantined inside explicit `<resume_text> ... </resume_text>` delimiters.

### Stage 5: Blind PII Redaction v2
- **Rule**: Preserves valid chronological date ranges (e.g., `2020 - 2022`) untouched.
- **Redaction**: Replaces applicant names, email addresses, phone digits, postal addresses, gender markers, and institution names with reversible tokens (`[REDACTED_NAME_1]`, `[REDACTED_EMAIL_1]`).

### Stage 6: Schema-Validated LLM Requirement Matching
- **Prompt**: Version `v1.0.0` located in `server/prompts/evaluation.v1.txt`.
- **Validation**: Enforced via Zod schema (`EvaluationOutputSchema`):
```typescript
const RequirementMatchSchema = z.object({
  requirementId: z.string(),
  status: z.enum(['MATCHED', 'PARTIAL', 'NOT_FOUND']),
  evidenceQuote: z.string().nullable().optional(),
  reasoning: z.string().optional().default('')
});
```
- **Resilience**: 30s timeout, exponential backoff retries, JSON clean/repair parser. If no LLM key is configured, falls back to transparent **Heuristic Mode** (`analysisMode: 'heuristic'`).

### Stage 7: Strict Verbatim Grounding & Anti-Hallucination
- **Rule**: The candidate quote claimed by the LLM must exist as an exact substring in the original raw resume text.
- **Offset Tracking**: Grounded quotes return exact `charStart` and `charEnd` indices.
- **Rejection**: If the LLM invents a quote that does not exist in the source document, the quote is **rejected**, flagged in the divergence audit, and the requirement status is downgraded to `UNVERIFIED` with a score contribution of **0 points**.

---

## 3. Deterministic Scoring Engine

### 3.1. Mathematical Formula

The final candidate fit score is calculated using a pure mathematical function:

$$\text{FinalScore} = \text{round}\left( \frac{w_{\text{skills}} \cdot S_{\text{skills}} + w_{\text{exp}} \cdot S_{\text{exp}} + w_{\text{impact}} \cdot S_{\text{impact}} + w_{\text{edu}} \cdot S_{\text{edu}}}{w_{\text{skills}} + w_{\text{exp}} + w_{\text{impact}} + w_{\text{edu}}} \right)$$

Where default weights from the Job entity are:
- $w_{\text{skills}} = 0.45$
- $w_{\text{exp}} = 0.30$
- $w_{\text{impact}} = 0.15$
- $w_{\text{edu}} = 0.10$

### 3.2. Sub-Score Definitions

1. **Skills Sub-Score ($S_{\text{skills}}$)**:
   Weighted percentage of requirements that are **MATCHED and grounded**:
   $$S_{\text{skills}} = \text{round}\left( \frac{\sum_{r \in \text{Grounded}} \text{points}(r)}{\sum_{r} \text{maxPoints}(r)} \cdot 100 \right)$$
   Mandatory requirements carry double weight ($2.0$), preferred carry single weight ($1.0$). Unverified claims yield $0$ points.

2. **Experience Sub-Score ($S_{\text{exp}}$)**:
   Parsed years from candidate profile vs. required job years:
   $$S_{\text{exp}} = \min\left(100, \text{round}\left( \frac{\text{detectedYears}}{\text{requiredYears}} \cdot 100 \right)\right)$$

3. **Impact Sub-Score ($S_{\text{impact}}$)**:
   Count of quantified impact metric statements in the resume (percentages, dollar amounts, multiples, latency improvements, user counts):
   $$S_{\text{impact}} = \min(100, 50 + \text{metricCount} \cdot 10)$$

4. **Education Sub-Score ($S_{\text{edu}}$)**:
   $100$ if formal education credential is found and verified, otherwise $50$.

---

## 4. Worked Calculation Example

Consider a candidate evaluated against a **Senior Full Stack Engineer** job ($3$ years required, Bachelor's degree preferred):

| Component | Raw Evaluated Input | Sub-Score Calculation | Weight | Weighted Value |
| :--- | :--- | :---: | :---: | :---: |
| **Skills** | 3 of 3 mandatory requirements grounded; 1 preferred ungrounded | $\frac{2 + 2 + 2 + 0}{2 + 2 + 2 + 1} = \frac{6}{7} = 85.7\%$ | $0.45$ | $38.57$ |
| **Experience** | 4 years detected ($3$ required) | $\min\left(100, \frac{4}{3} \cdot 100\right) = 100\%$ | $0.30$ | $30.00$ |
| **Impact** | 4 quantified metrics ($40\%$, $150\text{ms}$, $\$2\text{M}$, $50\text{k}$) | $50 + (4 \cdot 10) = 90\%$ | $0.15$ | $13.50$ |
| **Education** | Bachelor of Science extracted | $100\%$ | $0.10$ | $10.00$ |
| **Total** | | | $\sum = 1.00$ | **$92.07 \rightarrow 92\%$** |

**Final Grounded Fit Score**: **92% (Strong Match)**.
All calculations are pure, repeatable, and completely independent of any single model guess.
