import { GoogleGenAI } from "@google/genai";
import { TEST_CASE_SYSTEM_PROMPT, DOCUMENTATION_SYSTEM_PROMPT } from '../constants';
import { GenerationMode } from '../types';

// Helper to format timestamp
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const generateContent = async (
  apiKey: string,
  frames: { data: string; mimeType: string; timestamp: number }[],
  mode: GenerationMode,
  customInstructions?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = mode === GenerationMode.TEST_CASES 
    ? TEST_CASE_SYSTEM_PROMPT 
    : DOCUMENTATION_SYSTEM_PROMPT;

  const userPrompt = customInstructions 
    ? `Additional Instructions: ${customInstructions}\n\nAnalyze the provided video frames.`
    : "Analyze the provided video frames and generate the output.";

  // Construct parts: Interleave text timestamp with image data
  const parts: any[] = [];
  
  frames.forEach(frame => {
    // We add a text label before the image so the model knows the timestamp of the following frame
    parts.push({ 
        text: `[Video Timestamp: ${formatTime(frame.timestamp)}]` 
    });
    parts.push({
      inlineData: {
        mimeType: frame.mimeType,
        data: frame.data
      }
    });
  });

  parts.push({ text: userPrompt });

  try {
    // Using Gemini 3 Pro with high thinking budget for complex analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: {
          thinkingBudget: 32768 // Maximum budget for high-level reasoning
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text generated from Gemini");
    return text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};