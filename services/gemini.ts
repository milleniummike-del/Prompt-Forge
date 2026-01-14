import { GoogleGenAI, Type } from "@google/genai";
import { incrementTokenUsage } from "./storage";

// ==========================================
// GEMINI API CONFIGURATION
// ==========================================
// 'DIRECT' - Use GoogleGenAI SDK in browser (requires API Key in frontend)
// 'PROXY'  - Use PHP Backend Broker (api/index.php?endpoint=gemini)
// Toggle via environment variable
export const GEMINI_MODE: 'DIRECT' | 'PROXY' = (process.env.GEMINI_MODE === 'PROXY') ? 'PROXY' : 'DIRECT';

const PROXY_URL = 'https://artificialfiretiger.com/promptforgeapi?endpoint=gemini';

// Initialize Gemini Client (Only needed for DIRECT mode)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper for Proxy Calls ---
const callProxy = async (action: string, payload: any) => {
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Proxy Error: ${errText}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // Track tokens from proxy response
        if (data.usage) {
            incrementTokenUsage(data.usage.promptTokenCount || 0, data.usage.candidatesTokenCount || 0);
        }

        return data;
    } catch (e) {
        console.error("Gemini Proxy Call Failed:", e);
        throw e;
    }
};

export const enhancePrompt = async (currentPrompt: string, referenceImageBase64?: string): Promise<string> => {
  if (!currentPrompt.trim() && !referenceImageBase64) return "";

  // --- PROXY MODE ---
  if (GEMINI_MODE === 'PROXY') {
      const data = await callProxy('enhance', {
          prompt: currentPrompt,
          image: referenceImageBase64
      });
      return data.text || currentPrompt;
  }

  // --- DIRECT MODE ---
  if (!process.env.API_KEY) throw new Error("API Key is missing");

  try {
    const parts: any[] = [];

    if (referenceImageBase64) {
      const match = referenceImageBase64.match(/^data:(.*?);base64,(.*)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    const instructions = `You are an expert AI art prompt engineer. Optimize the following prompt for a high-quality image generation model (like Midjourney, Stable Diffusion, or Imagen). 
      Make it descriptive, adding details about lighting, composition, texture, and mood if missing. 
      ${referenceImageBase64 ? "Take the provided image into account as a visual reference or style guide if relevant." : ""}
      Keep it comma-separated or fluid natural language. 
      RETURN ONLY THE ENHANCED PROMPT TEXT. NO EXPLANATIONS.
      
      Original Prompt: "${currentPrompt}"`;

    parts.push({ text: instructions });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        temperature: 0.7,
      }
    });

    if (response.usageMetadata) {
        incrementTokenUsage(response.usageMetadata.promptTokenCount || 0, response.usageMetadata.candidatesTokenCount || 0);
    }

    return response.text?.trim() || currentPrompt;
  } catch (error) {
    console.error("Enhancement failed:", error);
    throw error;
  }
};

export const generateImagePreview = async (prompt: string, referenceImageBase64?: string, seed?: number): Promise<string> => {
    
    // --- PROXY MODE ---
    if (GEMINI_MODE === 'PROXY') {
        const data = await callProxy('generate', {
            prompt,
            image: referenceImageBase64,
            seed
        });
        return data.url;
    }

    // --- DIRECT MODE ---
    if (!process.env.API_KEY) throw new Error("API Key is missing");
    
    try {
        const parts: any[] = [];

        if (referenceImageBase64) {
            const match = referenceImageBase64.match(/^data:(.*?);base64,(.*)$/);
            if (match) {
                parts.push({
                    inlineData: {
                        mimeType: match[1],
                        data: match[2]
                    }
                });
            }
        }

        parts.push({ text: prompt });

        const config: any = {};
        if (seed !== undefined) {
            config.seed = seed;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: parts
            },
            config: config
        });

        if (response.usageMetadata) {
            incrementTokenUsage(response.usageMetadata.promptTokenCount || 0, response.usageMetadata.candidatesTokenCount || 0);
        }

        // Extract image
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image data returned");

    } catch (error) {
        console.error("Image generation failed:", error);
        throw error;
    }
}

export const analyzePromptForBlocks = async (prompt: string): Promise<any[]> => {
    
    // --- PROXY MODE ---
    if (GEMINI_MODE === 'PROXY') {
        const data = await callProxy('analyze', { prompt });
        try {
            return JSON.parse(data.json);
        } catch (e) {
            console.error("Failed to parse analysis JSON from proxy", e);
            return [];
        }
    }

    // --- DIRECT MODE ---
    if (!process.env.API_KEY) throw new Error("API Key is missing");
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the art prompt below. Break it down into reusable modular blocks.
            Focus on extracting:
            1. Art Styles (e.g., "Cyberpunk", "Oil Painting")
            2. Lighting/Atmosphere (e.g., "Cinematic lighting", "Dark and moody")
            3. Camera/Technical (e.g., "8k resolution", "Macro shot")
            4. Artist references
            5. Specific descriptive components
            
            For each block:
            - title: A short, clear name for the block.
            - content: The exact text segment from the prompt (or slightly cleaned up).
            - tag: A main category (e.g., "Style", "Lighting", "Camera", "Subject").
            - subTag: specific nuance (optional).
  
            Prompt: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            tag: { type: Type.STRING },
                            subTag: { type: Type.STRING }
                        },
                        required: ["title", "content", "tag"]
                    }
                }
            }
        });

        if (response.usageMetadata) {
            incrementTokenUsage(response.usageMetadata.promptTokenCount || 0, response.usageMetadata.candidatesTokenCount || 0);
        }
  
        return JSON.parse(response.text || '[]');
    } catch (e) {
        console.error("Analysis failed", e);
        throw e;
    }
}