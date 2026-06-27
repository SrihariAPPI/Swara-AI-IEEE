import { generateChat } from '../services/geminiProxy.js';
import { REPORT_GENERATION_PROMPT } from '../prompts/index.js';
import type { VerificationResult } from '../types/index.js';

export async function generateReport(result: VerificationResult): Promise<string> {
  const prompt = REPORT_GENERATION_PROMPT.replace(
    '{verification_data}',
    JSON.stringify(result, null, 2)
  );

  const raw = await generateChat(prompt, {
    model: 'gemini-3.1-flash-lite-preview',
    temperature: 0.3,
    maxOutputTokens: 4096,
  });

  if (raw.startsWith('```')) {
    const match = raw.match(/```(?:markdown)?\n([\s\S]*?)\n```/);
    return match?.[1]?.trim() || raw;
  }

  return raw;
}

export function generatePlainTextReport(result: VerificationResult): string {
  const lines: string[] = [];
  lines.push('='.repeat(60));
  lines.push('SWARA AI - VERIFICATION REPORT');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Verdict: ${result.verdict.label}`);
  lines.push(`Confidence: ${result.verdict.confidence}%`);
  lines.push('');
  lines.push('--- Claims Analyzed ---');
  for (const claim of result.claims) {
    lines.push(`  • ${claim.text} (${claim.domain})`);
  }
  lines.push('');
  lines.push('--- Evidence Used ---');
  for (const ev of result.evidenceUsed) {
    lines.push(`  • [${ev.datasetName}] ${ev.evidence.slice(0, 200)}...`);
  }
  lines.push('');
  lines.push('--- Reasoning ---');
  for (const step of result.reasoning.steps) {
    lines.push(`  ${step.step}. ${step.description}`);
  }
  lines.push('');
  lines.push('--- Citations ---');
  for (const cit of result.citations) {
    lines.push(`  • ${cit.format}`);
  }
  lines.push('');
  lines.push('='.repeat(60));
  return lines.join('\n');
}
