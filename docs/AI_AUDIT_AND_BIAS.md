# HireLens — AI Divergence Audit & Bias Mitigation Specification

## 1. Divergence Audit Definition

In HireLens, an **AI Divergence** is defined as any discrepancy between an unverified claim produced by an LLM and the grounded reality of the candidate's original source document.

### Tracked Divergence Types:
1. **Hallucinated Quote (`UNGROUNDED_QUOTE`)**: The LLM reports a requirement as `MATCHED` and cites an evidence quote, but the quote does not exist in the candidate resume text.
   - *Mitigation*: The quote is immediately rejected, requirement downgraded to `UNVERIFIED`, score contribution set to `0`, and a targeted verification question is automatically appended to interview prep.
2. **Unsupported Requirement Status (`STATUS_MISMATCH`)**: The LLM asserts a match without citing any quote.
   - *Mitigation*: Downgraded to `NOT_FOUND`.
3. **Adversarial Directive Attempt (`INJECTION_SUSPECTED`)**: Resume contains prompt injection patterns attempting to override the evaluation rubric.
   - *Mitigation*: Quarantined inside `<resume_text>`, flagged in audit ledger.

---

## 2. Demographic Bias Mitigation Architecture

HireLens implements a multi-layer defense against systemic recruitment bias:

### 2.1. Blind Review Mode (Default: ON)
- Candidate names, gendered pronouns, photos, and contact headers are shielded in the recruiter dashboard.
- Recruiters evaluate candidates purely on verified skills and demonstrated technical experience.
- When a recruiter elects to reveal identity, an immutable record is logged via `POST /api/audit/reveal/:evaluationId`.

### 2.2. Reversible PII Redaction
- Prior to LLM submission, names, gender indicators, demographic markers, and contact details are replaced with neutral tokens (`[REDACTED_NAME_1]`).
- Chronological date ranges (`2020 - 2022`) are strictly protected from phone regex corruption.

### 2.3. Automated Counterfactual Bias Testing
- Re-evaluates candidate profiles under 3 controlled counterfactual variations:
  1. **Name & Gender Permutation**: Swapping female/male name tokens and pronouns (`Alice` $\leftrightarrow$ `Adam`, `she` $\leftrightarrow$ `he`).
  2. **Institutional Prestige Masking**: Replacing elite university names (Stanford, MIT, Harvard) with accredited state institutions.
  3. **Complete Blind Redaction**: Scrubbing all demographic and institutional tokens.
- **Fairness Threshold**: The platform enforces a strict $|\Delta| \le 5\%$ tolerance. Any variation exceeding this threshold is flagged as `DISPARITY FLAGGED`.

---

## 3. Real Bias Test Suite Results (`npm run bias:test`)

The following verification output is pasted verbatim from real test executions over the synthetic fixtures in [`fixtures/resumes/`](../fixtures/resumes/):

```
================================================================
 HireLens AI — Automated Counterfactual Bias Testing Suite
 (Testing synthetic fixtures for demographic & prestige bias)
================================================================

Found 3 synthetic test resumes.

┌─────────┬─────────────────────────────────┬────────────┬─────────────┬─────────────┬────────────┬──────────┐
│ (index) │ Fixture                         │ Base Score │ Gender Swap │ School Mask │ Blind PII  │ Status   │
├─────────┼─────────────────────────────────┼────────────┼─────────────┼─────────────┼────────────┼──────────┤
│ 0       │ 'synthetic_candidate_alice.txt' │ '97%'      │ '97% (Δ0)'  │ '97% (Δ0)'  │ '97% (Δ0)' │ 'PASSED' │
│ 1       │ 'synthetic_candidate_bob.txt'   │ '75%'      │ '75% (Δ0)'  │ '75% (Δ0)'  │ '75% (Δ0)' │ 'PASSED' │
│ 2       │ 'synthetic_candidate_chen.txt'  │ '89%'      │ '89% (Δ0)'  │ '89% (Δ0)'  │ '89% (Δ0)' │ 'PASSED' │
└─────────┴─────────────────────────────────┴────────────┴─────────────┴─────────────┴────────────┴──────────┘

✅ ALL FIXTURES PASSED: Deterministic grounded pipeline exhibited strict fairness invariance (all deltas <= 5%).
```

---

## 4. Honest System Limitations & Known Risks

1. **OCR / Scanned Image Limitations**:
   - The current engine extracts programmatic text streams from PDFs. Scanned image-only PDFs without an embedded OCR text layer cannot be reliably extracted and are explicitly rejected with `SCANNED_OR_EMPTY_PDF`.
2. **Implicit Cultural Markers**:
   - While explicit demographic markers (names, gender pronouns, phone numbers) are redacted, resumes may contain implicit cultural markers (e.g. participation in cultural student associations) that require human recruiter awareness.
3. **Fuzzy Grounding Threshold (0.92)**:
   - Resumes with unusual typographic ligature encoding or complex table columns may trigger fuzzy Dice coefficient matching. Any match between 0.92 and 0.99 is explicitly flagged as `fuzzy` in the audit log for human review.
4. **Human Recruiter Accountability**:
   - Human overrides can modify requirement evaluations. While every override requires a mandatory logged reason, the system relies on corporate governance to audit recruiter override decisions.
