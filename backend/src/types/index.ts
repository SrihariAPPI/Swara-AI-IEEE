export type VerdictLabel = 'TRUE' | 'FALSE' | 'MISLEADING' | 'PARTIALLY_TRUE' | 'INSUFFICIENT_EVIDENCE';

export type InputType = 'text' | 'url' | 'pdf' | 'image';

export type AgentName =
  | 'input'
  | 'claim_extraction'
  | 'evidence_retrieval'
  | 'reasoning'
  | 'verification'
  | 'confidence_scoring'
  | 'report_generation'
  | 'citation';

export interface ProgressStep {
  agent: AgentName;
  status: 'processing' | 'complete' | 'error';
  message: string;
  progress: number;
}

export interface VerificationInput {
  type: InputType;
  content: string;
  originalName?: string;
  metadata?: Record<string, string>;
}

export interface ExtractedClaim {
  id: string;
  text: string;
  domain: string;
  entities: string[];
  claimType: 'numeric' | 'statistical' | 'event' | 'quote' | 'policy';
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

export interface ReasoningStep {
  step: number;
  description: string;
  detail: string;
  confidence: number;
}

export interface Citation {
  dataset: string;
  record: string;
  evidence: string;
  format: string;
}

export interface VerificationResult {
  id: string;
  userId: string;
  input: VerificationInput;
  claims: ExtractedClaim[];
  verdict: {
    label: VerdictLabel;
    confidence: number;
  };
  evidenceUsed: EvidenceChunk[];
  reasoning: {
    steps: ReasoningStep[];
    crossVerification: string;
    alternativeInterpretation: string | null;
  };
  citations: Citation[];
  metrics: {
    latencyMs: number;
    datasetsSearched: number;
    evidenceCount: number;
  };
  createdAt: string;
}

export interface ConfidenceFactor {
  name: string;
  weight: number;
  score: number;
  explanation: string;
}

export interface ConfidenceResult {
  confidence: number;
  factors: ConfidenceFactor[];
  explanation: string;
}

export interface DatasetInfo {
  id: string;
  name: string;
  version: string;
  source: string;
  recordCount: number;
  loaded: boolean;
  fields: string[];
}

export interface AnalyticsSummary {
  totalVerifications: number;
  verdictDistribution: Record<VerdictLabel, number>;
  averageConfidence: number;
  datasetUsage: Record<string, number>;
  averageLatencyMs: number;
  mostCommonDomain: string;
}
