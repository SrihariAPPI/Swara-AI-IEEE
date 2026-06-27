import { generateChat } from '../services/geminiProxy.js';
import { CLAIM_EXTRACTION_PROMPT, CLAIM_EXTRACTION_SCHEMA } from '../prompts/index.js';
import type { ExtractedClaim } from '../types/index.js';

export async function extractClaims(input: string): Promise<ExtractedClaim[]> {
  const prompt = CLAIM_EXTRACTION_PROMPT.replace('{input}', input.slice(0, 8000));

  const raw = await generateChat(prompt, {
    model: 'gemini-3.1-flash-lite-preview',
    temperature: 0.1,
    maxOutputTokens: 2048,
    responseSchema: CLAIM_EXTRACTION_SCHEMA as Record<string, unknown>,
  });

  try {
    const parsed = JSON.parse(raw);
    const claims: ExtractedClaim[] = (parsed.claims || []).map((c: any, i: number) => ({
      id: `claim-${i + 1}`,
      text: c.text,
      domain: c.domain || 'other',
      entities: c.entities || [],
      claimType: c.claimType || 'event',
    }));
    return claims;
  } catch {
    return [{
      id: 'claim-1',
      text: input.slice(0, 500),
      domain: 'other',
      entities: [],
      claimType: 'event',
    }];
  }
}
