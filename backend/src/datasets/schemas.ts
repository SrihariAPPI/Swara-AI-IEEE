export interface DatasetSchema {
  id: string;
  name: string;
  version: string;
  source: string;
  fields: string[];
}

export const DATASET_REGISTRY: DatasetSchema[] = [
  {
    id: 'fn-nli',
    name: 'FN-NLI (PolitiFact-based Fake News and Natural Language Inference)',
    version: '1.0',
    source: 'https://ieee-dataport.org/documents/fn-nli',
    fields: ['claim', 'label', 'evidence', 'speaker', 'source_url', 'date', 'domain', 'verdict'],
  },
  {
    id: 'rw-post',
    name: 'RW-Post (Multimodal Fact Checking Dataset with Evidence and Reasoning)',
    version: '1.0',
    source: 'https://ieee-dataport.org/documents/rw-post',
    fields: ['claim', 'label', 'evidence', 'image_url', 'domain', 'language', 'target'],
  },
  {
    id: 'nffn',
    name: 'NFFN (Non-Fakeness of Fake News Dataset)',
    version: '1.0',
    source: 'https://ieee-dataport.org/documents/nffn',
    fields: ['text', 'label', 'source', 'domain', 'features'],
  },
];
