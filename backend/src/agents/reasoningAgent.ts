import { generateChat } from '../services/geminiProxy.js';
import { FACT_VERIFICATION_PROMPT } from '../prompts/index.js';
import type { EvidenceChunk, ReasoningStep, VerdictLabel } from '../types/index.js';

interface FactVerificationOutput {
  verdict: VerdictLabel;
  confidence: number;
  reasoning_steps: { description: string; detail: string }[];
  evidence_used: { id: string; text: string; supports_verdict: boolean }[];
  alternative_interpretation: string | null;
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: {
      type: 'string',
      enum: ['TRUE', 'FALSE', 'MISLEADING', 'PARTIALLY_TRUE', 'INSUFFICIENT_EVIDENCE'],
    },
    confidence: { type: 'number' },
    reasoning_steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['description', 'detail'],
      },
    },
    evidence_used: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          text: { type: 'string' },
          supports_verdict: { type: 'boolean' },
        },
        required: ['id', 'text', 'supports_verdict'],
      },
    },
    alternative_interpretation: { type: 'string', nullable: true },
  },
  required: ['verdict', 'confidence', 'reasoning_steps', 'evidence_used'],
};

export async function reasonAboutClaim(
  claim: string,
  evidence: EvidenceChunk[]
): Promise<{
  verdict: VerdictLabel;
  confidence: number;
  steps: ReasoningStep[];
  evidenceUsed: EvidenceChunk[];
  alternativeInterpretation: string | null;
}> {
  const evidenceStr = evidence.map((e, i) =>
    `[${i + 1}] Dataset: ${e.datasetName} (${e.datasetId})\n` +
    `Label: ${e.label}\n` +
    `Evidence: ${e.evidence.slice(0, 1000)}\n` +
    `Relevance: ${(e.relevanceScore * 100).toFixed(0)}%`
  ).join('\n\n');

  const prompt = FACT_VERIFICATION_PROMPT
    .replace('{claim}', claim)
    .replace('{evidence}', evidenceStr);

  const raw = await generateChat(prompt, {
    model: 'gemini-3.1-pro-preview',
    temperature: 0.15,
    maxOutputTokens: 4096,
    responseSchema: VERDICT_SCHEMA as Record<string, unknown>,
  });

  let parsed: FactVerificationOutput;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {
      verdict: 'INSUFFICIENT_EVIDENCE',
      confidence: 0,
      reasoning_steps: [{ description: 'Failed to parse Gemini response', detail: raw.slice(0, 500) }],
      evidence_used: [],
      alternative_interpretation: 'Parsing error occurred during reasoning',
    };
  }

  const steps: ReasoningStep[] = parsed.reasoning_steps.map((s, i) => ({
    step: i + 1,
    description: s.description,
    detail: s.detail,
    confidence: Math.round(parsed.confidence / parsed.reasoning_steps.length),
  }));

  const usedEvidenceIds = new Set(parsed.evidence_used.map(e => e.id));
  const evidenceUsed = evidence.filter(e => usedEvidenceIds.has(e.id));

  return {
    verdict: parsed.verdict,
    confidence: parsed.confidence,
    steps,
    evidenceUsed: evidenceUsed.length > 0 ? evidenceUsed : evidence.slice(0, 2),
    alternativeInterpretation: parsed.alternative_interpretation || null,
  };
}
