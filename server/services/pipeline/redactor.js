/**
 * PII Redaction Engine v2:
 * Anonymizes candidate identification markers to prevent baseline human and algorithmic bias.
 * Preserves date ranges (e.g., 2020 - 2022) without corruption.
 * Generates an isolated reversible token map for authorized server-side identity restoration.
 */

export function redactPII(rawText = '', extractedFields = {}) {
  if (!rawText) return { redactedText: '', tokenMap: {} };

  const tokenMap = {};
  let counter = 1;
  let text = rawText;

  function recordToken(prefix, originalVal) {
    const key = `[${prefix}_${counter++}]`;
    tokenMap[key] = originalVal;
    return key;
  }

  // 1. Redact Candidate Name if provided from extraction
  if (extractedFields.fullName) {
    const nameRegex = new RegExp(`\\b${extractedFields.fullName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    text = text.replace(nameRegex, (match) => recordToken('NAME', match));

    // Also redact single name tokens if > 2 chars
    const parts = extractedFields.fullName.split(/\s+/).filter(p => p.length > 2);
    for (const part of parts) {
      const partRegex = new RegExp(`\\b${part.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
      text = text.replace(partRegex, (match) => recordToken('NAME_PART', match));
    }
  }

  // 2. Redact Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  text = text.replace(emailRegex, (match) => recordToken('EMAIL', match));

  // 3. Redact Social & Profile URLs
  text = text.replace(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi, (m) => recordToken('LINKEDIN', m));
  text = text.replace(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/gi, (m) => recordToken('GITHUB', m));

  // 4. Redact Phone numbers strictly (NEVER match date ranges like 2020 - 2022)
  // Ensures candidate match has standard phone structure and is not surrounded by date separators
  const phoneRegex = /(?<!\b(?:19|20)\d{2}\s*[-–—]\s*)(?<!\b(?:19|20)\d{2}\s*)(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}(?!\s*[-–—]\s*(?:19|20)\d{2}\b)(?!\s*[-–—]\s*Present\b)/gi;
  text = text.replace(phoneRegex, (match) => {
    // Double check that match does not contain date range
    if (/\b(?:19|20)\d{2}\b/.test(match)) return match;
    return recordToken('PHONE', match.trim());
  });

  // 5. Redact Physical Street Addresses
  const addressRegex = /\b\d{1,5}\s+[A-Za-z0-9\s.,]{3,30}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Suite|Apt)\b/gi;
  text = text.replace(addressRegex, (m) => recordToken('ADDRESS', m.trim()));

  // 6. Redact Demographic / Gender / Pronouns markers
  const demographicPatterns = [
    /\b(he\/him|she\/her|they\/them)\b/gi,
    /\b(?:gender|sex):\s*(?:male|female|non-binary|other)\b/gi,
    /\b(?:marital status|marital):\s*(?:married|single|divorced)\b/gi,
    /\b(?:date of birth|dob|birth date):\s*[^\n,]+\b/gi,
    /\b(?:nationality|citizenship):\s*[A-Za-z\s]{3,20}\b/gi,
    /\b(?:photo|headshot)\s*(?:attached|included)\b/gi
  ];

  for (const pattern of demographicPatterns) {
    text = text.replace(pattern, (match) => recordToken('DEMOGRAPHIC', match.trim()));
  }

  return {
    redactedText: text,
    tokenMap
  };
}

/**
 * Reverses redaction using token map (server-side audit & deanonymization)
 */
export function restorePII(text = '', tokenMap = {}) {
  let restored = text;
  for (const [token, originalVal] of Object.entries(tokenMap)) {
    restored = restored.split(token).join(originalVal);
  }
  return restored;
}
