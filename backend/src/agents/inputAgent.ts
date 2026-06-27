import type { VerificationInput, InputType } from '../types/index.js';

export interface NormalizedInput {
  type: InputType;
  content: string;
  originalName?: string;
  metadata?: Record<string, string>;
}

export async function processInput(input: VerificationInput): Promise<NormalizedInput> {
  let content = input.content.trim();

  if (input.type === 'url') {
    content = await extractFromUrl(input.content);
  }

  if (input.type === 'image') {
    content = await extractImageText(input.content);
  }

  return {
    type: input.type,
    content,
    originalName: input.originalName,
    metadata: {
      ...input.metadata,
      charLength: content.length.toString(),
      wordCount: content.split(/\s+/).length.toString(),
    },
  };
}

async function extractFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SwaraVerification/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await response.text();
    const textMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (textMatch) {
      return textMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[^;]+;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 10000);
    }
    return `[Content extracted from ${url}]`;
  } catch {
    return `[Unable to fetch content from ${url}]`;
  }
}

async function extractImageText(_base64: string): Promise<string> {
  return '[Image submitted for analysis]';
}
