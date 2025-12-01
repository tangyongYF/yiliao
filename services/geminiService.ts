import { GoogleGenAI } from "@google/genai";
import { GEMINI_SYSTEM_PROMPT, TERM_EXPLANATION_PROMPT } from "../constants";
import { AnalysisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMedicalReport = async (base64DataUrl: string): Promise<AnalysisResult> => {
  try {
    // Extract MIME type and clean base64 data from Data URL
    // Format: data:[<mediatype>][;base64],<data>
    const matches = base64DataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    
    let mimeType = "image/jpeg"; // Default fallback
    let cleanBase64 = base64DataUrl;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      cleanBase64 = matches[2];
    } else {
      // Fallback if raw base64 or different format, try to split by comma
      const split = base64DataUrl.split(',');
      if (split.length === 2) {
         cleanBase64 = split[1];
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using Flash for speed as per PRD requirements
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: "Analyze this medical report (image or PDF) based on the system instructions provided."
          }
        ]
      },
      config: {
        systemInstruction: GEMINI_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.4, // Lower temperature for more consistent medical facts
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result: AnalysisResult = JSON.parse(text);
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("无法读取报告，请确保文件清晰或稍后重试。");
  }
};

export const explainMedicalTerm = async (term: string): Promise<string> => {
  try {
    const prompt = TERM_EXPLANATION_PROMPT.replace('{term}', term);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7, // Slightly higher for more creative metaphors
      }
    });

    return response.text || "抱歉，我暂时无法解释这个词，请换个词试试。";
  } catch (error) {
    console.error("Term explanation error:", error);
    throw new Error("解释服务暂时不可用，请稍后再试。");
  }
};

// New function for TTS
export const generateMedicalAudio = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["AUDIO"], // Using string literal as Modality enum might differ in build
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Warm female voice
          },
        },
      },
    });

    // Extract base64 PCM data
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    
    return base64Audio;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    throw new Error("语音生成失败");
  }
};