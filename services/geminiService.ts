import { GoogleGenAI, Type } from "@google/genai";
import { Character, Language, Proficiency, Setting, StoryLog } from "../types";

const API_KEY = process.env.API_KEY || ''; // In a real app, handle missing key gracefully
const ai = new GoogleGenAI({ apiKey: API_KEY });

const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

// --- Helper to convert Base64 to proper Image Part if needed ---
const getBase64FromUrl = (url: string): string => {
  return url.split(',')[1] || '';
};

/**
 * Generates an Anime Character Reference Sheet
 */
export const generateCharacterVisual = async (
  name: string,
  appearance: string,
  style: string = "high-quality anime character design sheet, studio ghibli inspired, clean lines, vibrant colors, neutral background"
): Promise<string> => {
  try {
    const prompt = `Character Name: ${name}. Description: ${appearance}. \n\nStyle: ${style}. \n\nGenerate a character reference sheet.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        safetySettings,
        imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data received");
  } catch (error) {
    console.error("Error generating character visual:", error);
    // Return a placeholder if AI fails to avoid app crash
    return `https://picsum.photos/512/512?grayscale`; 
  }
};

/**
 * Generates an Anime Setting Background
 */
export const generateSettingVisual = async (
  name: string,
  appearance: string,
  atmosphere: string
): Promise<string> => {
  try {
    const prompt = `Anime background art. Location: ${name}. Appearance: ${appearance}. Atmosphere: ${atmosphere}. High quality, makoto shinkai style, detailed background.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        safetySettings,
        imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data received");
  } catch (error) {
    console.error("Error generating setting visual:", error);
    return `https://picsum.photos/800/450?blur=2`;
  }
};

/**
 * Generates a random Anime Character Profile
 */
export const generateRandomCharacter = async (
  language: Language
): Promise<{ name: string; appearance: string }> => {
  try {
    const prompt = `Generate a unique, creative anime protagonist profile appropriate for a story in ${language}. 
    The description should be visually detailed for an image generator.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        safetySettings,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            appearance: { type: Type.STRING, description: "Detailed visual description including hair, eyes, clothing, and distinct features." }
          },
          required: ["name", "appearance"]
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return {
      name: json.name || "Unknown Hero",
      appearance: json.appearance || "A mysterious figure."
    };
  } catch (error) {
    console.error("Error generating random character:", error);
    return { name: "Hiro", appearance: "A generic anime protagonist with spiky hair." };
  }
};

/**
 * Generates a random Anime Setting Profile
 */
export const generateRandomSetting = async (
  language: Language
): Promise<{ name: string; appearance: string; atmosphere: string }> => {
  try {
    const prompt = `Generate a unique, creative anime setting (fantasy, sci-fi, or slice-of-life) appropriate for a story in ${language}. 
    The description should be visually detailed.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        safetySettings,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            appearance: { type: Type.STRING, description: "Detailed visual description of the environment." },
            atmosphere: { type: Type.STRING, description: "Mood keywords (e.g. Eerie, Peaceful, Cyberpunk)" }
          },
          required: ["name", "appearance", "atmosphere"]
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return {
      name: json.name || "Unknown World",
      appearance: json.appearance || "A mysterious land.",
      atmosphere: json.atmosphere || "Mysterious"
    };
  } catch (error) {
    console.error("Error generating random setting:", error);
    return { name: "Tokyo", appearance: "A busy city street.", atmosphere: "Energetic" };
  }
};

/**
 * Generates the next Story Beat (Text + Learning Data)
 */
export const generateNextStorySegment = async (
  language: Language,
  proficiency: Proficiency,
  context: string,
  characters: Character[],
  settings: Setting[]
): Promise<Omit<StoryLog, 'id' | 'isLoading' | 'illustrationUrl'>> => {

  const charContext = characters.map(c => `${c.name} (${c.personality})`).join(', ');
  const settingContext = settings.map(s => s.name).join(', ');

  const systemInstruction = `
    You are an expert language tutor writing an interactive anime story in ${language}.
    Target Proficiency: ${proficiency}.
    Current Plot Context: ${context}
    Characters: ${charContext}
    Settings: ${settingContext}
    
    Task: Write the next short segment of the story (approx 3-5 sentences).
    Output must be strictly valid JSON.
  `;

  const prompt = "Continue the story. Provide the text in target language, translation, 2-3 vocabulary words, and 1 grammar point.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        safetySettings,
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Story segment in target language" },
            translation: { type: Type.STRING, description: "English translation" },
            vocab: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  reading: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                }
              }
            },
            grammar: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                explanation: { type: Type.STRING },
                example: { type: Type.STRING }
              }
            },
            quiz: {
                type: Type.OBJECT,
                description: "Optional comprehension question",
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                }
            }
          },
          required: ["text", "translation", "vocab"]
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    
    // Runtime checks to prevent UI crashes if AI hallucinates schema structure
    return {
        text: json.text || "...",
        translation: json.translation || "...",
        vocab: Array.isArray(json.vocab) ? json.vocab : [],
        grammar: json.grammar,
        quiz: json.quiz
    };

  } catch (error) {
    console.error("Error generating story text:", error);
    throw error;
  }
};

/**
 * Generates the Scene Illustration based on the story text
 */
export const generateSceneIllustration = async (
  storyText: string,
  characters: Character[],
  activeSetting: Setting | null
): Promise<string> => {
  try {
    // Construct a prompt that describes the scene using the visual traits of the characters
    const charVisuals = characters.map(c => `${c.name} looks like: ${c.appearance}`).join('. ');
    const settingVisual = activeSetting ? `Setting: ${activeSetting.appearance}, ${activeSetting.atmosphere}.` : '';

    const prompt = `
      Anime screencap. High production value.
      Scene Action: A visualization of this story moment: "${storyText}"
      
      Visual Consistency Guidelines:
      ${charVisuals}
      ${settingVisual}
      
      Style: Modern anime, cinematic lighting, highly detailed.
    `;

    // Prepare reference images (Max 5 for humans)
    const referenceParts = characters
      .filter(c => c.referenceImageUrl && c.referenceImageUrl.startsWith('data:image'))
      .slice(0, 5) // Limit to 5 human references
      .map(c => ({
        inlineData: {
          mimeType: "image/png", // Assuming PNG as generated by us
          data: getBase64FromUrl(c.referenceImageUrl!)
        }
      }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { 
        parts: [
          { text: prompt },
          ...referenceParts
        ] 
      },
      config: {
        safetySettings,
        imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return `https://picsum.photos/800/450?grayscale`;
  } catch (error) {
    console.error("Error generating scene:", error);
    return `https://picsum.photos/800/450?grayscale`;
  }
};