import { searchDatasets } from '../datasets/loader.js';
import type { EvidenceChunk } from '../types/index.js';

const DATASET_NAMES: Record<string, string> = {
  'fn-nli': 'FN-NLI (PolitiFact-based Fake News)',
  'rw-post': 'RW-Post (Multimodal Fact Checking)',
  'nffn': 'NFFN (Non-Fakeness of Fake News)',
};

export async function retrieveEvidence(claim: string, topK: number = 10): Promise<EvidenceChunk[]> {
  const results = searchDatasets(claim, topK);

  const evidence: EvidenceChunk[] = results.map((match, idx) => {
    const record = match.record;
    const labelRaw = record.label;
    let normalizedLabel: 'SUPPORTS' | 'REFUTES' | 'NOT_ENOUGH_INFO' = 'NOT_ENOUGH_INFO';

    if (labelRaw === true || labelRaw === 'true' || labelRaw === 'SUPPORTS') {
      normalizedLabel = 'SUPPORTS';
    } else if (labelRaw === false || labelRaw === 'false' || labelRaw === 'REFUTES') {
      normalizedLabel = 'REFUTES';
    }

    return {
      id: `${match.datasetId}:${record.id}`,
      datasetId: match.datasetId,
      datasetName: DATASET_NAMES[match.datasetId] || match.datasetId,
      claim: (record.claim || record.text || '').slice(0, 500),
      label: normalizedLabel,
      evidence: (record.evidence || '').slice(0, 2000),
      source: String(record.source_url || record.source || `Dataset:${match.datasetId}`),
      relevanceScore: Math.max(0, Math.min(1, 1 - (idx * 0.1))),
    };
  });

  return evidence;
}
