import { GoogleGenAI, Type } from "@google/genai";

declare const process: any;

// Initialize Gemini Client
// WARNING: In a production app, never expose API keys on the client side.
// This is for demonstration using the user's local environment key.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const enhancePrompt = async (currentPrompt: string, referenceImageBase64?: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");
  if (!currentPrompt.trim() && !referenceImageBase64) return "";

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

    return response.text?.trim() || currentPrompt;
  } catch (error) {
    console.error("Enhancement failed:", error);
    throw error;
  }
};

export const generateImagePreview = async (prompt: string, referenceImageBase64?: string, seed?: number): Promise<string> => {
    if (!apiKey) throw new Error("API Key is missing");
    
    try {
        const parts: any[] = [];

        // If we have a reference image, include it for image-to-image or multimodal editing
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

        // Using gemini-2.5-flash-image for fast previews as requested by guidelines for "general image generation"
        // unless high quality is specifically requested, but for a "preview" feature in a manager, speed is key.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: parts
            },
            config: config
        });

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
    if (!apiKey) throw new Error("API Key is missing");
    
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
  
        return JSON.parse(response.text || '[]');
    } catch (e) {
        console.error("Analysis failed", e);
        throw e;
    }
  }