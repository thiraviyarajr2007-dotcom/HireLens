import { z } from 'zod';

export const PROMPT_VERSION = 'v1.0.0';

export const RequirementMatchSchema = z.object({
  requirementId: z.string(),
  status: z.enum(['MATCHED', 'PARTIAL', 'NOT_FOUND']),
  evidenceQuote: z.string().nullable().optional(),
  reasoning: z.string().optional().default('')
});

export const EvaluationOutputSchema = z.object({
  candidate_summary: z.string(),
  experience_years_detected: z.union([z.number(), z.string()]).transform(v => Number(v) || 0),
  requirements: z.array(RequirementMatchSchema),
  key_strengths: z.array(z.string()).default([]),
  critical_gaps: z.array(z.string()).default([]),
  targeted_interview_questions: z.object({
    technical: z.array(z.string()).default([]),
    behavioral: z.array(z.string()).default([])
  }).default({ technical: [], behavioral: [] })
});

/**
 * Call LLM with timeout, retry backoff, and zod validation
 */
export async function callLlmEvaluation({ systemPrompt, userPrompt }) {
  const provider = resolveProvider();
  
  if (!provider.apiKey && provider.type !== 'ollama') {
    return {
      success: false,
      analysisMode: 'heuristic',
      fallbackReason: 'NO_API_KEY_CONFIGURED: Missing LLM API key. Running in transparent Heuristic Mode.'
    };
  }

  const startTime = Date.now();
  let lastError = null;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const rawText = await executeProviderCall(provider, systemPrompt, userPrompt);
      const cleaned = cleanJsonResponse(rawText);
      
      let parsedJson;
      try {
        parsedJson = JSON.parse(cleaned);
      } catch (parseErr) {
        // Attempt one repair parse
        const repaired = attemptJsonRepair(cleaned);
        parsedJson = JSON.parse(repaired);
      }

      // Zod schema validation (B14)
      const validated = EvaluationOutputSchema.parse(parsedJson);

      return {
        success: true,
        analysisMode: 'ai',
        provider: provider.type,
        model: provider.model,
        promptVersion: PROMPT_VERSION,
        latencyMs: Date.now() - startTime,
        data: validated,
        rawOutput: rawText
      };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  return {
    success: false,
    analysisMode: 'heuristic',
    fallbackReason: `LLM_INVOCATION_FAILED: ${lastError?.message || 'Network error'}`,
    promptVersion: PROMPT_VERSION,
    latencyMs: Date.now() - startTime
  };
}

function resolveProvider() {
  const envProvider = (process.env.LLM_PROVIDER || '').toLowerCase();
  
  if (envProvider === 'gemini' || (!envProvider && process.env.GEMINI_API_KEY)) {
    return {
      type: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.LLM_MODEL || 'gemini-1.5-flash',
      endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${process.env.LLM_MODEL || 'gemini-1.5-flash'}:generateContent?key=${process.env.GEMINI_API_KEY}`
    };
  }

  if (envProvider === 'groq' || (!envProvider && process.env.GROQ_API_KEY)) {
    return {
      type: 'groq',
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions'
    };
  }

  if (envProvider === 'ollama') {
    return {
      type: 'ollama',
      apiKey: null,
      model: process.env.LLM_MODEL || 'llama3',
      endpoint: process.env.LLM_BASE_URL || 'http://localhost:11434/api/chat'
    };
  }

  return {
    type: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    endpoint: process.env.LLM_BASE_URL ? `${process.env.LLM_BASE_URL}/chat/completions` : 'https://api.openai.com/v1/chat/completions'
  };
}

async function executeProviderCall(provider, systemPrompt, userPrompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    if (provider.type === 'gemini') {
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
      }

      const json = await response.json();
      return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    if (provider.type === 'ollama') {
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama Error (${response.status}): ${await response.text()}`);
      }

      const json = await response.json();
      return json.message?.content || '';
    }

    // OpenAI and Groq compatible chat/completions
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM Error (${response.status}): ${errText}`);
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timeoutId);
  }
}

function cleanJsonResponse(str = '') {
  return str
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
}

function attemptJsonRepair(brokenJson = '') {
  // Simple repair for common trailing commas or truncations
  let repaired = brokenJson.replace(/,\s*([}\]])/g, '$1');
  if (!repaired.endsWith('}') && repaired.includes('{')) {
    repaired += '}';
  }
  return repaired;
}
