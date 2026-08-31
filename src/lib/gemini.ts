import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: GEMINI_API_KEY is not defined in production environment variables.');
}

/**
 * Singleton Google Gen AI client wrapper.
 * For use in AI analytics, generation, and natural-language query parsing.
 */
export const ai = new GoogleGenAI({ apiKey });

/**
 * Standard model definition for Gemini API requests.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
