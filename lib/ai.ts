import { GoogleGenAI } from '@google/genai';

let currentKeyIndex = 0;

/**
 * Retrieves an array of all available API keys from environment variables.
 * Checks GEMINI_API_KEYS (comma-separated) and statically checks GEMINI_API_KEY_1 through GEMINI_API_KEY_10.
 * (Note: Next.js statically replaces process.env at build time, so Object.entries(process.env) doesn't work reliably).
 */
export function getApiKeys(): string[] {
  const keys: Set<string> = new Set();

  // 1. Check for comma-separated list
  if (process.env.GEMINI_API_KEYS) {
    process.env.GEMINI_API_KEYS.split(',').forEach(k => {
      const trimmed = k.trim();
      if (trimmed) keys.add(trimmed);
    });
  }

  // 2. Statically check numbered keys to ensure Next.js bundler includes them
  const envVars = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7,
    process.env.GEMINI_API_KEY_8,
    process.env.GEMINI_API_KEY_9,
    process.env.GEMINI_API_KEY_10,
  ];

  for (const val of envVars) {
    if (val && typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.length > 0) {
        keys.add(trimmed);
      }
    }
  }

  return Array.from(keys);
}

/**
 * Executes a Gemini API call using key rotation.
 * If a rate limit (429) or overload (503) occurs, it automatically switches to the next available key and retries.
 * It will retry up to a defined maximum number of attempts before throwing an error.
 * 
 * @param action - A callback that receives the instantiated `GoogleGenAI` client and executes the request.
 * @param operationName - Optional string for logging purposes.
 */
export async function executeWithRotation<T>(
  action: (ai: GoogleGenAI) => Promise<T>,
  operationName: string = 'Gemini API'
): Promise<T> {
  const keys = getApiKeys();
  
  if (keys.length === 0) {
    throw new Error('No API keys configured. Please set GEMINI_API_KEYS or GEMINI_API_KEY.');
  }

  // We will allow attempting each key up to 2 times across the rotation
  const maxAttempts = Math.max(5, keys.length * 2);
  let attempts = 0;

  while (attempts < maxAttempts) {
    const activeKey = keys[currentKeyIndex % keys.length];
    const ai = new GoogleGenAI({ apiKey: activeKey });

    try {
      return await action(ai);
    } catch (error: any) {
      attempts++;
      
      const isRateLimitOrOverload = 
        error?.status === 429 || 
        error?.status === 503 || 
        error?.message?.includes('429') || 
        error?.message?.includes('503') || 
        error?.message?.includes('quota') || 
        error?.message?.includes('demand');
      
      if (isRateLimitOrOverload) {
        console.warn(`[${operationName}] Key index ${currentKeyIndex % keys.length} hit rate limit/overload. Rotating key... (Attempt ${attempts}/${maxAttempts})`);
        
        // Move to the next key
        currentKeyIndex++;
        
        if (attempts < maxAttempts) {
          // If we've rotated through all keys, add a larger backoff to give APIs time to breathe
          if (attempts % keys.length === 0) {
            console.warn(`[${operationName}] All keys cycled. Waiting 5 seconds before retrying...`);
            await new Promise(r => setTimeout(r, 5000));
          } else {
            // Small wait before jumping to the next key
            await new Promise(r => setTimeout(r, 500));
          }
          continue;
        }
      }
      
      // If it's not a rate limit, or if we've exhausted all attempts, throw the error
      throw error;
    }
  }

  throw new Error(`[${operationName}] Rate limits exceeded across all keys after ${maxAttempts} attempts.`);
}
