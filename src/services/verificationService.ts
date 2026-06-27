const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface VerificationInput {
  type: 'text' | 'url' | 'pdf' | 'image';
  content: string;
  originalName?: string;
}

export interface ExtractedClaim {
  id: string;
  text: string;
  domain: string;
  entities: string[];
  claimType: string;
}

export interface EvidenceChunk {
  id: string;
  datasetId: string;
  datasetName: string;
  claim: string;
  label: 'SUPPORTS' | 'REFUTES' | 'NOT_ENOUGH_INFO';
  evidence: string;
  source: string;
  relevanceScore: number;
}

export interface VerificationResult {
  id: string;
  userId: string;
  input: VerificationInput;
  claims: ExtractedClaim[];
  verdict: {
    label: 'TRUE' | 'FALSE' | 'MISLEADING' | 'PARTIALLY_TRUE' | 'INSUFFICIENT_EVIDENCE';
    confidence: number;
  };
  evidenceUsed: EvidenceChunk[];
  reasoning: {
    steps: { step: number; description: string; detail: string; confidence: number }[];
    crossVerification: string;
    alternativeInterpretation: string | null;
  };
  citations: { dataset: string; record: string; evidence: string; format: string }[];
  metrics: { latencyMs: number; datasetsSearched: number; evidenceCount: number };
  createdAt: string;
  status?: string;
  progress?: { agent: string; status: string; message: string; progress: number }[];
}

async function getAuthToken(): Promise<string | null> {
  const { auth } = await import('../lib/firebase');
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken();
    } catch {
      return null;
    }
  }
  const customToken = localStorage.getItem('swara_verification_token');
  return customToken;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function submitVerification(input: VerificationInput): Promise<{ jobId: string }> {
  return apiFetch('/verify', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getVerificationResult(jobId: string): Promise<VerificationResult> {
  return apiFetch(`/verify/${jobId}`);
}

export function streamVerificationProgress(
  jobId: string,
  onProgress: (step: any) => void,
  onComplete: (result: VerificationResult) => void,
  onError: (err: Error) => void
): () => void {
  const token = localStorage.getItem('swara_verification_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const eventSource = new EventSource(`${API_BASE}/verify/${jobId}/stream`);

  eventSource.addEventListener('progress', (event) => {
    try {
      onProgress(JSON.parse(event.data));
    } catch {}
  });

  eventSource.addEventListener('complete', (event) => {
    try {
      onComplete(JSON.parse(event.data));
    } catch (e) {
      onError(new Error('Failed to parse complete event'));
    }
    eventSource.close();
  });

  eventSource.addEventListener('error', (event) => {
    onError(new Error('Stream connection failed'));
    eventSource.close();
  });

  return () => eventSource.close();
}

export async function getHistory(limit = 20, startAfter?: string): Promise<{ items: VerificationResult[]; hasMore: boolean; lastId: string | null }> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (startAfter) params.set('startAfter', startAfter);
  return apiFetch(`/history?${params}`);
}

export async function getAnalyticsSummary(): Promise<{
  totalVerifications: number;
  verdictDistribution: Record<string, number>;
  averageConfidence: number;
  datasetUsage: Record<string, number>;
  averageLatencyMs: number;
  mostCommonDomain: string;
}> {
  return apiFetch('/analytics/summary');
}

export async function getConfidenceDistribution(): Promise<{
  buckets: { range: string; min: number; max: number; count: number }[];
}> {
  return apiFetch('/analytics/confidence-distribution');
}
