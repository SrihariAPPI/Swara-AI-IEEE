import { initializeDatasets } from '../datasets/loader.js';
import {
  processInput,
  extractClaims,
  retrieveEvidence,
  reasonAboutClaim,
  crossVerify,
  computeConfidence,
  computeWeightedConfidence,
  generateCitations,
} from '../agents/index.js';
import type {
  VerificationInput,
  VerificationResult,
  ProgressStep,
  AgentName,
} from '../types/index.js';

function makeProgress(agent: AgentName, status: 'processing' | 'complete' | 'error', message: string, progress: number): ProgressStep {
  return { agent, status, message, progress };
}

export async function runVerificationPipeline(
  input: VerificationInput,
  userId: string,
  onProgress: (step: ProgressStep) => void
): Promise<VerificationResult> {
  initializeDatasets();

  const startTime = Date.now();

  // Step 1: Input Processing
  onProgress(makeProgress('input', 'processing', 'Processing input...', 0.1));
  const normalized = await processInput(input);
  onProgress(makeProgress('input', 'complete', 'Input processed successfully', 0.2));

  // Step 2: Claim Extraction
  onProgress(makeProgress('claim_extraction', 'processing', 'Extracting claims...', 0.25));
  const claims = await extractClaims(normalized.content);
  onProgress(makeProgress('claim_extraction', 'complete', `Extracted ${claims.length} claims`, 0.35));

  if (claims.length === 0) {
    return {
      id: '',
      userId,
      input,
      claims: [],
      verdict: { label: 'INSUFFICIENT_EVIDENCE', confidence: 0 },
      evidenceUsed: [],
      reasoning: {
        steps: [{ step: 1, description: 'No claims found', detail: 'Could not extract verifiable claims from the input', confidence: 0 }],
        crossVerification: 'N/A',
        alternativeInterpretation: 'Input may contain opinions or rhetorical statements without factual assertions',
      },
      citations: [],
      metrics: { latencyMs: Date.now() - startTime, datasetsSearched: 0, evidenceCount: 0 },
      createdAt: new Date().toISOString(),
    };
  }

  // Step 3: Evidence Retrieval (for each claim)
  onProgress(makeProgress('evidence_retrieval', 'processing', 'Searching IEEE DataPort datasets...', 0.4));
  const allEvidence = await retrieveEvidence(claims.map(c => c.text).join(' '), 10);
  onProgress(makeProgress('evidence_retrieval', 'complete', `Found ${allEvidence.length} relevant evidence pieces across datasets`, 0.55));

  // Step 4: Gemini Reasoning
  onProgress(makeProgress('reasoning', 'processing', 'Analyzing claim vs evidence...', 0.6));
  const mainClaim = claims[0].text;
  const reasoned = await reasonAboutClaim(mainClaim, allEvidence);
  onProgress(makeProgress('reasoning', 'complete', 'Reasoning analysis complete', 0.7));

  // Step 5: Cross-Verification
  onProgress(makeProgress('verification', 'processing', 'Cross-verifying across datasets...', 0.75));
  const crossVerified = await crossVerify(mainClaim, reasoned.evidenceUsed, reasoned.verdict);
  onProgress(makeProgress('verification', 'complete', `Cross-verification: ${crossVerified.crossConsistency} consistency`, 0.8));

  // Adjust verdict based on cross-verification
  const finalVerdictLabel = crossVerified.verdict;
  const baseConfidence = reasoned.confidence;
  const adjustedConfidence = Math.max(0, Math.min(100, baseConfidence + crossVerified.confidenceAdjustment));

  // Step 6: Confidence Scoring
  onProgress(makeProgress('confidence_scoring', 'processing', 'Computing confidence score...', 0.82));
  const confidenceResult = await computeConfidence(
    mainClaim,
    { steps: reasoned.steps },
    allEvidence.map(e => `${e.datasetName}: ${e.evidence.slice(0, 300)}`).join('\n')
  );
  const weightedConfidence = computeWeightedConfidence(confidenceResult.factors);
  onProgress(makeProgress('confidence_scoring', 'complete', `Confidence score: ${weightedConfidence}%`, 0.88));

  // Step 7: Citations
  onProgress(makeProgress('citation', 'processing', 'Generating citations...', 0.9));
  const citations = generateCitations(reasoned.evidenceUsed);
  onProgress(makeProgress('citation', 'complete', `${citations.length} citations generated`, 0.95));

  // Step 8: Report Generation
  onProgress(makeProgress('report_generation', 'processing', 'Generating report...', 0.97));
  onProgress(makeProgress('report_generation', 'complete', 'Report ready', 1));

  const result: VerificationResult = {
    id: '',
    userId,
    input,
    claims,
    verdict: {
      label: finalVerdictLabel,
      confidence: weightedConfidence,
    },
    evidenceUsed: reasoned.evidenceUsed,
    reasoning: {
      steps: reasoned.steps,
      crossVerification: crossVerified.explanation,
      alternativeInterpretation: reasoned.alternativeInterpretation,
    },
    citations,
    metrics: {
      latencyMs: Date.now() - startTime,
      datasetsSearched: 3,
      evidenceCount: reasoned.evidenceUsed.length,
    },
    createdAt: new Date().toISOString(),
  };

  return result;
}
