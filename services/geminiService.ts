import { GoogleGenAI, Type } from "@google/genai";
import { SceneAnalysis } from "../types";

// Note: In a real production app, you should not expose the API key on the client side directly
// without safeguards. For this demo architecture, we use process.env.
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const analyzeVideoScenes = async (base64Data: string, mimeType: string): Promise<SceneAnalysis[]> => {
  try {
    // User requested Gemini 3 for better complex analysis
    const model = 'gemini-3-pro-preview';

    const prompt = `
      As a professional film editor and cinematographer, analyze this video.
      Your task is to identify **complete, continuous shots (Long Takes)** and break the video down accordingly.
      
      Guidelines:
      1. **Identify Long Takes**: Prioritize keeping continuous shots intact. Do not split a continuous visual flow unless there is a definitive hard cut, dissolve, or wipe. The user wants to see the logic of the "Long Take" (长镜头).
      2. **Editing Points**: Only mark a new scene when there is a clear editing transition (obvious cut point).
      3. **Detailed Prompts**: For each identified shot, write a **comprehensive, high-fidelity image prompt**. This prompt should capture the entire essence of the long shot, including specific lighting, color grading, subject movement, and camera trajectory.
      
      For each shot, provide:
      1. Precise start and end time in seconds.
      2. A detailed visual description of what happens.
      3. The shot type (e.g., Close-up, Wide shot, Medium shot).
      4. Camera movement (e.g., Static, Pan, Dolly, Handheld, Tracking Shot).
      5. The mood or atmosphere.
      6. A highly descriptive image prompt suitable for AI image generation (Midjourney/Flux style).

      The output MUST be in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTimeSeconds: { type: Type.NUMBER, description: "Start time of the shot in seconds" },
              endTimeSeconds: { type: Type.NUMBER, description: "End time of the shot in seconds" },
              startTimeFormatted: { type: Type.STRING, description: "Start time formatted as MM:SS" },
              description: { type: Type.STRING, description: "Detailed description of the action and content" },
              shotType: { type: Type.STRING, description: "Cinematic shot type (e.g. Medium Shot, Close Up)" },
              cameraMovement: { type: Type.STRING, description: "Camera movement technique" },
              mood: { type: Type.STRING, description: "The emotional tone or atmosphere" },
              imagePrompt: { type: Type.STRING, description: "A detailed prompt for generating a similar image" }
            },
            required: ["startTimeSeconds", "endTimeSeconds", "description", "shotType", "cameraMovement", "mood", "imagePrompt"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response from Gemini");
    }

    const data: SceneAnalysis[] = JSON.parse(jsonText);
    return data;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};