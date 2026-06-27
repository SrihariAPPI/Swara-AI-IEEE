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
  {
    id: 'liar',
    name: 'LIAR (PolitiFact-based Fake News Detection)',
    version: '3.0',
    source: 'https://www.cs.ucsb.edu/~william/data/liar_dataset.zip',
    fields: ['claim', 'label', 'evidence', 'speaker', 'domain', 'party', 'job_title', 'state'],
  },
  {
    id: 'fakenewsnet',
    name: 'FakeNewsNet (BuzzFeed & PolitiFact News Content)',
    version: '1.0',
    source: 'https://github.com/KaiDMML/FakeNewsNet',
    fields: ['claim', 'text', 'label', 'source_url', 'date', 'domain', 'source', 'verdict'],
  },
  {
    id: 'pheme',
    name: 'PHEME (Rumor Detection on Twitter Threads)',
    version: '1.0',
    source: 'https://figshare.com/articles/PHEME_dataset_of_rumours_and_non-rumours/4010619',
    fields: ['claim', 'label', 'evidence', 'source_url', 'domain', 'is_rumour'],
  },
];
