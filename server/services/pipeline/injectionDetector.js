/**
 * Prompt Injection Defence & Untrusted Text Fencing:
 * Analyzes resume content for adversarial injection vectors, jailbreak attempts,
 * or instructions trying to manipulate the LLM evaluation.
 */

const ADVERSARIAL_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+(?:instructions|prompts|rules)/i,
  /disregard\s+(?:all\s+)?prior\s+(?:instructions|directives)/i,
  /give\s+(?:this\s+)?candidate\s+(?:a\s+score\s+of\s+)?(?:100|perfect)/i,
  /score\s+(?:this\s+candidate\s+)?100/i,
  /system\s+override/i,
  /you\s+are\s+now\s+(?:an?\s+)?unrestricted/i,
  /output\s+(?:only\s+)?(?:the\s+following|a\s+fake)/i,
  /override\s+system\s+prompt/i,
  /bypass\s+safety/i,
  /recommend\s+as\s+strong\s+hire/i,
  /forget\s+all\s+(?:previous\s+)?instructions/i,
  /new\s+instruction:/i,
  /<system>/i,
  /<\/system>/i
];

export function detectPromptInjection(resumeText = '') {
  if (!resumeText) {
    return { injectionSuspected: false, detectedPatterns: [], sanitizedText: '' };
  }

  const detectedPatterns = [];
  for (const pattern of ADVERSARIAL_PATTERNS) {
    const match = resumeText.match(pattern);
    if (match) {
      detectedPatterns.push(match[0]);
    }
  }

  const injectionSuspected = detectedPatterns.length > 0;

  // Sanitize instruction-like tags to prevent delimiter confusion
  let sanitizedText = resumeText
    .replace(/<\/?(?:system|resume_text|prompt|context)>/gi, '')
    .trim();

  return {
    injectionSuspected,
    detectedPatterns,
    fencedPayload: `<resume_text>\n${sanitizedText}\n</resume_text>`
  };
}
