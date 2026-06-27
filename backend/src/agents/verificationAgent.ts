import type { EvidenceChunk, VerdictLabel } from '../types/index.js';

interface CrossVerificationResult {
  verdict: VerdictLabel;
  confidenceAdjustment: number;
  crossConsistency: 'high' | 'medium' | 'low';
  contradictions: string[];
  explanation: string;
}

export async function crossVerify(
  claim: string,
  evidence: EvidenceChunk[],
  initialVerdict: VerdictLabel
): Promise<CrossVerificationResult> {
  const datasetGroups = new Map<string, EvidenceChunk[]>();

  for (const ev of evidence) {
    const existing = datasetGroups.get(ev.datasetId) || [];
    existing.push(ev);
    datasetGroups.set(ev.datasetId, existing);
  }

  const contradictions: string[] = [];
  let crossConsistency: 'high' | 'medium' | 'low' = 'high';

  const verdictsByDataset = new Map<string, 'SUPPORTS' | 'REFUTES' | 'NOT_ENOUGH_INFO[]'>();
  for (const [dsId, items] of datasetGroups) {
    const supportCount = items.filter(i => i.label === 'SUPPORTS').length;
    const refuteCount = items.filter(i => i.label === 'REFUTES').length;
    if (supportCount > refuteCount) {
      verdictsByDataset.set(dsId, 'SUPPORTS');
    } else if (refuteCount > supportCount) {
      verdictsByDataset.set(dsId, 'NOT_ENOUGH_INFO[]');
    } else {
      verdictsByDataset.set(dsId, 'NOT_ENOUGH_INFO[]');
    }
  }

  const verdictValues = Array.from(verdictsByDataset.values());
  const uniqueVerdicts = new Set(verdictValues);

  if (uniqueVerdicts.size > 1) {
    crossConsistency = 'medium';
    for (const [ds, v] of verdictsByDataset) {
      contradictions.push(`Dataset ${ds} indicates ${v} while others differ`);
    }
  }

  if (uniqueVerdicts.size >= 3) {
    crossConsistency = 'low';
  }

  if (evidence.length === 0 || uniqueVerdicts.size === 0) {
    crossConsistency = 'low';
  }

  let confidenceAdjustment = 0;
  if (crossConsistency === 'high') confidenceAdjustment = 10;
  else if (crossConsistency === 'medium') confidenceAdjustment = -5;
  else confidenceAdjustment = -15;

  let adjustedVerdict: VerdictLabel = initialVerdict;
  if (crossConsistency === 'low' && initialVerdict !== 'INSUFFICIENT_EVIDENCE') {
    adjustedVerdict = 'MISLEADING';
  }

  const explanation = crossConsistency === 'high'
    ? 'Multiple datasets consistently support this verdict'
    : crossConsistency === 'medium'
      ? 'Some cross-dataset inconsistencies found, verdict may need caution'
      : 'Significant cross-dataset contradictions detected';

  return {
    verdict: adjustedVerdict,
    confidenceAdjustment,
    crossConsistency,
    contradictions,
    explanation,
  };
}
