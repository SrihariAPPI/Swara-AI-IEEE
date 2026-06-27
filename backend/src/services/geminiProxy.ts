import { GoogleGenAI } from '@google/genai';
import { appConfig } from '../config.js';

let ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!ai) {
    if (!appConfig.geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for LLM operations');
    }
    ai = new GoogleGenAI({ apiKey: appConfig.geminiApiKey });
  }
  return ai;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  responseSchema?: Record<string, unknown>;
}

export async function generateChat(
  prompt: string,
  options: ChatOptions = {}
): Promise<string> {
  const client = getClient();
  const {
    model = 'gemini-3.1-flash-preview',
    temperature = 0.2,
    maxOutputTokens = 4096,
    systemInstruction,
    responseSchema,
  } = options;

  const config: Record<string, unknown> = {
    temperature,
    maxOutputTokens,
  };

  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  if (responseSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = responseSchema;
  }

  const response = await client.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  });

  if (typeof response.text === 'string') {
    return response.text;
  }
  return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function generateChatWithHistory(
  messages: { role: 'user' | 'model'; text: string }[],
  options: ChatOptions = {}
): Promise<string> {
  const client = getClient();
  const {
    model = 'gemini-3.1-flash-preview',
    temperature = 0.2,
    maxOutputTokens = 4096,
    systemInstruction,
    responseSchema,
  } = options;

  const config: Record<string, unknown> = { temperature, maxOutputTokens };
  if (systemInstruction) config.systemInstruction = systemInstruction;
  if (responseSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = responseSchema;
  }

  const chat = client.chats.create({
    model,
    config,
    history: messages.slice(0, -1).map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
  });

  const lastMsg = messages[messages.length - 1];
  const response = await chat.sendMessage({ message: lastMsg.text });

  if (typeof response.text === 'string') return response.text;
  return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
