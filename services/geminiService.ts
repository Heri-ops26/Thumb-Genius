
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratorConfig, GeneratedResult } from "../types";

export const generateThumbnailInsights = async (config: GeneratorConfig): Promise<GeneratedResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    As a world-class YouTube thumbnail expert and professional AI prompt engineer, generate a highly detailed image generation prompt for a thumbnail based on these parameters:
    - Niche: ${config.niche}
    - Video Topic: ${config.topic}
    - Visual Style: ${config.style}
    - Emotional Vibe: ${config.vibe}
    - Desired Color Palette: Primary Color (${config.primaryColor}), Accent Color (${config.accentColor})

    Requirements:
    1. Create a "Master Prompt" optimized for tools like Midjourney, DALL-E 3, or Gemini. Include lighting details, camera angles, color palette based on provided colors, and character expressions.
    2. Provide a brief explanation of WHY this prompt will get a high CTR (Click-Through Rate).
    3. Ensure the prompt describes a 16:9 aspect ratio scene.
    4. Crucially: Do NOT include any text or words in the prompt description itself. The user will overlay text later.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING, description: "The detailed image generation prompt focusing on visual elements only." },
            explanation: { type: Type.STRING, description: "Why this design works for CTR." }
          },
          required: ["prompt", "explanation"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Error generating text prompt:", error);
    throw error;
  }
};

export const generateThumbnailImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Create a high-quality YouTube thumbnail image for this prompt: ${prompt}. Focus on a 16:9 cinematic shot. NO TEXT ON IMAGE. Ensure the lighting and colors are vibrant and saturated.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
