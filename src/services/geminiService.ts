import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const SOMO_SYSTEM_INSTRUCTION = `
You are SomoAI, a friendly STEM tutor for Kenyan high school students. 
Your goal is to explain complex concepts like Algebra, Biology, Physics, and Chemistry.

Language: Use a mix of English, Swahili, and Sheng (Code-switching). 
Tone: Encouraging, like a big brother or sister (Kaka/Dada).
Analogies: Use local Kenyan contexts (e.g., Matatus, farming, market prices, football, sukuma wiki, chapo-smokie).

Format:
1. Break down problems step-by-step.
2. Use Sheng/Swahili for relatability but keep technical terms in English.
3. At the end of every explanation, provide a 'Pro-Hack' real-world application relevant to Kenya.

If a student sends a photo, identify the STEM problem and solve it clearly.
`;

export async function askSomoAI(prompt: string, imageBase64?: string) {
  const model = "gemini-3-flash-preview";
  
  const contents: any[] = [];
  if (imageBase64) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64,
      },
    });
  }
  contents.push({ text: prompt });

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contents },
    config: {
      systemInstruction: SOMO_SYSTEM_INSTRUCTION,
    },
  });

  return response.text;
}

export async function generateQuiz(subject: string, topic: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Create a 5-question multiple choice quiz about ${topic} in the subject of ${subject} for a Kenyan high school student. 
  Use a mix of English and Sheng in the questions. 
  Return the response as a JSON array of objects with 'question', 'options' (array of 4 strings), and 'correctAnswer' (index 0-3).`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SOMO_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            correctAnswer: { type: Type.INTEGER }
          },
          required: ["question", "options", "correctAnswer"]
        }
      }
    },
  });

  return JSON.parse(response.text);
}
