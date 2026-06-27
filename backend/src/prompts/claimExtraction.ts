export const CLAIM_EXTRACTION_PROMPT = `You are a professional claim extraction system. Analyze the given input and extract all factual claims that can be verified.

Rules:
- Extract only verifiable factual assertions
- Ignore opinions, rhetorical questions, emotional statements
- For URLs: extract claims from the visible text content
- For each claim, identify: domain, named entities, claim type
- Return as JSON array

Claim types: numeric, statistical, event, quote, policy

Input: {input}`;

export const CLAIM_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          domain: { type: 'string', enum: ['health', 'politics', 'science', 'technology', 'environment', 'economy', 'education', 'sports', 'entertainment', 'other'] },
          entities: { type: 'array', items: { type: 'string' } },
          claimType: { type: 'string', enum: ['numeric', 'statistical', 'event', 'quote', 'policy'] },
        },
        required: ['text', 'domain', 'entities', 'claimType'],
      },
    },
  },
  required: ['claims'],
};
