import type { Citation, EvidenceChunk } from '../types/index.js';

export function generateCitations(evidence: EvidenceChunk[]): Citation[] {
  return evidence.map((ev, i) => {
    const datasetId = ev.datasetId.toUpperCase();
    const recordId = ev.id.split(':')[1] || ev.id;
    const format = `[${i + 1}] ${ev.datasetName}, Record "${recordId}", IEEE DataPort. Available: https://ieee-dataport.org/documents/${ev.datasetId}`;

    return {
      dataset: ev.datasetName,
      record: recordId,
      evidence: ev.evidence.slice(0, 300),
      format,
    };
  });
}
