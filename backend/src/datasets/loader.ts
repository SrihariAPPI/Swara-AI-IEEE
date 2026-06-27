import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DATASET_REGISTRY } from './schemas.js';

interface RawRecord {
  id: string;
  claim?: string;
  text?: string;
  label: string | boolean;
  evidence?: string;
  [key: string]: unknown;
}

interface IndexEntry {
  record: RawRecord;
  terms: string[];
  datasetId: string;
}

let registry: DatasetState[] = [];
let invertedIndex: Map<string, IndexEntry[]> = new Map();
let allRecords: IndexEntry[] = [];

interface DatasetState {
  id: string;
  name: string;
  version: string;
  source: string;
  fields: string[];
  recordCount: number;
  loaded: boolean;
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function loadDataset(id: string): RawRecord[] {
  const filePath = resolve(import.meta.dirname, `${id}.json`);
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as RawRecord[];
  } catch {
    console.warn(`Dataset file not found: ${id}.json`);
    return [];
  }
}

export function initializeDatasets(): void {
  registry = DATASET_REGISTRY.map(schema => ({
    ...schema,
    recordCount: 0,
    loaded: false,
  }));

  invertedIndex = new Map();
  allRecords = [];

  for (const ds of registry) {
    const records = loadDataset(ds.id);
    ds.recordCount = records.length;
    if (records.length > 0) ds.loaded = true;

    for (const record of records) {
      const searchText = [
        record.claim || record.text || '',
        record.evidence || '',
        record.speaker || record.source || '',
      ].join(' ');

      const terms = [...new Set(tokenize(searchText))];
      const entry: IndexEntry = { record, terms, datasetId: ds.id };
      allRecords.push(entry);

      for (const term of terms) {
        const existing = invertedIndex.get(term) || [];
        existing.push(entry);
        invertedIndex.set(term, existing);
      }
    }

    if (ds.loaded) {
      console.log(`[Dataset] Loaded ${ds.recordCount} records from ${ds.id}`);
    }
  }

  console.log(`[Dataset] Total: ${allRecords.length} records across ${registry.length} datasets`);
}

export function getDatasetRegistry(): DatasetState[] {
  if (registry.length === 0) initializeDatasets();
  return registry;
}

export async function getDatasetStats(id: string) {
  if (registry.length === 0) initializeDatasets();
  const ds = registry.find(d => d.id === id);
  if (!ds) return null;

  const records = allRecords.filter(r => r.datasetId === id);
  const labels = records.reduce<Record<string, number>>((acc, r) => {
    const lbl = String(r.record.label);
    acc[lbl] = (acc[lbl] || 0) + 1;
    return acc;
  }, {});

  return { ...ds, labelDistribution: labels };
}

export function searchDatasets(query: string, topK: number = 10): IndexEntry[] {
  if (registry.length === 0) initializeDatasets();
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const scores = new Map<string, { entry: IndexEntry; score: number }>();

  for (const term of queryTerms) {
    const matches = invertedIndex.get(term) || [];
    for (const match of matches) {
      const key = `${match.datasetId}:${match.record.id}`;
      const existing = scores.get(key);
      const tf = match.terms.filter(t => t === term).length / match.terms.length;
      const idf = Math.log((allRecords.length + 1) / ((invertedIndex.get(term)?.length || 0) + 1)) + 1;
      const contribution = tf * idf;

      if (existing) {
        existing.score += contribution;
      } else {
        scores.set(key, { entry: match, score: contribution });
      }
    }
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.entry);
}
