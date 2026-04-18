import { GoogleGenAI } from '@google/genai';
import { env } from '@/config/env';

export const getGenAIClient = () => {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing. Set it in your environment.');
  }
  return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
};
