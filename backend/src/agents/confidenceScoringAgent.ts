import { generateChat } from '../services/geminiProxy.js';
import { CONFIDENCE_SCORING_PROMPT } from '../prompts/index.js';
import type { ConfidenceFactor, ConfidenceResult } from '../types/index.js';

export async function computeConfidence(
  claim: string,
  reasoning: { steps: { description: string; detail: string }[] },
  evidenceSummary: string
): Promise<ConfidenceResult> {
  const prompt = CONFIDENCE_SCORING_PROMPT
    .replace('{claim}', claim)
    .replace('{evidence_summary}', evidenceSummary)
    .replace('{reasoning}', JSON.stringify(reasoning.steps));

  const raw = await generateChat(prompt, {
    model: 'gemini-3.1-flash-preview',
    temperature: 0.1,
    maxOutputTokens: 1024,
    responseSchema: {
      type: 'object',
      properties: {
        confidence: { type: 'number' },
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              weight: { type: 'number' },
              score: { type: 'number' },
              explanation: { type: 'string' },
            },
            required: ['name', 'weight', 'score', 'explanation'],
          },
        },
        explanation: { type: 'string' },
      },
      required: ['confidence', 'factors', 'explanation'],
    } as Record<string, unknown>,
  });

  try {
    return JSON.parse(raw);
  } catch {
    return {
      confidence: 50,
      factors: [
        { name: 'Evidence Quality', weight: 0.35, score: 50, explanation: 'Unable to compute via Gemini, using default' },
        { name: 'Evidence Count', weight: 0.2, score: 50, explanation: 'Default score' },
        { name: 'Cross-Dataset Consistency', weight: 0.25, score: 50, explanation: 'Default score' },
        { name: 'Contradiction Absence', weight: 0.2, score: 50, explanation: 'Default score' },
      ],
      explanation: 'Confidence could not be computed precisely',
    };
  }
}

export function computeWeightedConfidence(factors: ConfidenceFactor[]): number {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weighted = factors.reduce((sum, f) => sum + (f.score * f.weight), 0);
  if (totalWeight === 0) return 50;
  return Math.round(Math.max(0, Math.min(100, weighted / totalWeight)));
}
