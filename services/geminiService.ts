import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Character, Language, Proficiency, Setting, StoryLog, Item } from "../types";

const API_KEY = process.env.API_KEY || ''; // In a real app, handle missing key gracefully
const ai = new GoogleGenAI({
  apiKey: API_KEY,
  apiVersion: "v1alpha"
});

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// --- Helper to convert Base64 to proper Image Part if needed ---
const getBase64FromUrl = async (url: string): Promise<{ data: string, mimeType: string } | null> => {
  if (url.startsWith('data:image')) {
    const parts = url.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    return { data: parts[1], mimeType: mime };
  }
  // If it's a remote URL (Firebase Storage), fetch it
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ data: base64, mimeType: blob.type });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to fetch reference image:", url, e);
    return null;
  }
};

/**
 * Enhances or generates text for specific builder fields
 */
export const magicWand = async (
  fieldType: 'name' | 'appearance' | 'settingName' | 'settingDesc' | 'atmosphere' | 'itemName' | 'itemDesc',
  currentValue: string,
  language: Language
): Promise<string> => {
  try {
    const isEnhancing = currentValue.trim().length > 0;

    const fieldLabels: Record<string, string> = {
        name: 'character name',
        appearance: 'character appearance and outfit',
        settingName: 'location name',
        settingDesc: 'scenery and visual environment description',
        atmosphere: 'atmospheric mood and tone',
        itemName: 'object or equipment name',
        itemDesc: 'physical description of the item'
    };

    const label = fieldLabels[fieldType] || fieldType;

    const prompt = isEnhancing
      ? `Enhance and refine this anime ${label} for a story in ${language}. Keep it creative and evocative.
         Current value: "${currentValue}"
         Return only the improved text.`
      : `Generate a creative, unique anime ${label} for a story in ${language}.
         Return only the generated text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ text: prompt }],
      config: {
        safetySettings,
        responseMimeType: "text/plain",
      }
    });

    return response.text?.trim() || currentValue;
  } catch (error) {
    console.error("Magic wand error:", error);
    return currentValue;
  }
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
    const prompt = `Character Name: ${name}. Description: ${appearance}. 

Style: ${style}. 

Generate a character reference sheet.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [{ text: prompt }],
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
      contents: [{ text: prompt }],
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
  language: Language,
  gender?: string
): Promise<{ name: string; appearance: string }> => {
  try {
    const prompt = `Generate a unique, creative anime ${gender ? gender + ' ' : ''}protagonist profile appropriate for a story in ${language}.
    The description should be visually detailed for an image generator.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ text: prompt }],
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
      contents: [{ text: prompt }],
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
  settings: Setting[],
  previousActivities: { type: string, question: string }[] = []
): Promise<Omit<StoryLog, 'id' | 'isLoading' | 'illustrationUrl'>> => {

  const charContext = characters.map(c => `${c.name} (${c.personality})`).join(', ');
  const settingContext = settings.map(s => s.name).join(', ');
  
  const activityHistory = previousActivities.map(a => `- [${a.type}] ${a.question}`).join('\n');

  const systemInstruction = `
    You are an expert language tutor writing an interactive anime story in ${language}.
    Target Proficiency: ${proficiency}.
    Current Plot Context: ${context}
    Characters: ${charContext}
    Settings: ${settingContext}

    Task: Write the next short segment of the story (approx 3-5 sentences).
    You MUST also include a randomly selected language learning activity.

    CRITICAL INSTRUCTION: DO NOT REPEAT RECENT ACTIVITIES.
    Here are the last few activities used (AVOID THESE QUESTIONS):
    ${activityHistory}
    
    LANGUAGE-SPECIFIC RULES:
    - Draw primarily from the full list of 16 activity types to ensure maximum variety and engagement.
    - OCCASIONALLY (e.g. 20% of the time) insert a specialized drill relevant to the language:
      * Japanese/Korean: 'HONORIFICS', 'PARTICLE', 'CONJUGATION'
      * Chinese: 'HANZI_RADICAL', 'CLASSIFIER', 'WRITING' (focus on tones/pinyin)
    - Ensure the activity fits the story context pragmatically (e.g. if a character bows, use HONORIFICS; if buying items, use CLASSIFIER).

    ACTIVITY TYPES:
    1. MULTIPLE_CHOICE: standard 4-option comprehension.
    2. TRANSLATION_MATCH: provide 'pairs' of word and translation.
    3. WRITING: provide 'question' and 'correctText' (the exact sentence/pinyin).
    4. SIMILAR_PHRASE: compare two phrases, provide 'question' and 'correctText' (Yes/No).
    5. SENTENCE_ORDER: provide 'scrambledWords' to form a sentence. MUST provide 'correctText'.
    6. CLOZE: fill in the blank, provide 'options'.
    7. READING: identify correct reading (Pinyin/Romaji/Hangul), provide 'options'.
    8. PARTICLE: pick the correct grammar particle (e.g. wa/ga, eun/neun, le/de), provide 'options'.      
    9. CONJUGATION: pick correct verb form (e.g. past, polite, humble), provide 'options'.
    10. SYNONYM: find the word with closest meaning, provide 'options'.
    11. HONORIFICS: choose appropriate politeness level for the social context, provide 'options'.        
    12. TRUE_FALSE: a fact-check about the story, provide 'options' (True, False).
    13. LISTENING: transcription challenge, provide 'question' asking what was said.
    14. ERROR_FIX: identify the mistake in a sentence, provide 'options'.
    15. CLASSIFIER: pick the correct counter/classifier word (e.g. hon, gae, ge), provide 'options'.      
    16. HANZI_RADICAL: identify character radicals or component meanings, provide 'options'.

    Output must be strictly valid JSON.
  `;

  const prompt = "Continue the story. Provide text, translation, mood, vocab, grammar, and a random learning activity.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ text: prompt }],
      config: {
        safetySettings,
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Story segment in target language" },
            translation: { type: Type.STRING, description: "English translation" },
            mood: { type: Type.STRING, description: "One-word mood keyword (e.g. Melancholic, Heroic, Tense, Peaceful)" },
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
            activity: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "One of the 16 ActivityType strings" },       
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER },
                    pairs: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { item: { type: Type.STRING }, match: { type: Type.STRING } }     
                        }
                    },
                    scrambledWords: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctText: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["type", "question", "explanation"]
            }
          },
          required: ["text", "translation", "vocab", "activity"]
        }
      }
    });

    // Log the raw text for debugging
    console.log("Raw Story Response:", response.text);

    const json = JSON.parse(response.text || "{}");

    // Runtime checks to prevent UI crashes if AI hallucinates schema structure
    return {
        text: json.text || "...",
        translation: json.translation || "...",
        mood: json.mood || "Peaceful",
        vocab: Array.isArray(json.vocab) ? json.vocab : [],
        grammar: json.grammar,
        activity: json.activity
    };

  } catch (error) {
    console.error("Error generating story text:", error);
    throw error;
  }
};

/**
 * Explains a specific text selection
 */
export const explainText = async (
  text: string,
  language: Language,
  context: string
): Promise<string> => {
  try {
    const prompt = `Explain the following text in the context of learning ${language}.
    Text: "${text}"
    Context: "${context}"

    Provide a concise explanation covering meaning, nuance, and any relevant grammar points. Keep it under 100 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ text: prompt }],
      config: {
        safetySettings,
        responseMimeType: "text/plain",
      }
    });

    return response.text || "Could not generate explanation.";
  } catch (error) {
    console.error("Error explaining text:", error);
    return "Failed to get explanation from AI.";
  }
};

/**
 * Generates the Scene Illustration based on the story text
 */
export const generateSceneIllustration = async (
  storyText: string,
  characters: Character[],
  activeSetting: Setting | null,
  items: Item[] = []
): Promise<string> => {
  try {
    // Construct a prompt that describes the scene using the visual traits of the characters
    const charVisuals = characters.map(c => `${c.name} looks like: ${c.appearance}`).join('. ');
    const itemVisuals = items.map(i => `${i.name} looks like: ${i.description}`).join('. ');
    const settingVisual = activeSetting ? `Setting: ${activeSetting.appearance}, ${activeSetting.atmosphere}.` : '';

    const prompt = `
      Anime screencap. High production value.
      Scene Action: A visualization of this story moment: "${storyText}"

      Visual Consistency Guidelines:
      Characters Present: ${characters.map(c => c.name).join(', ')}.
      ${charVisuals}

      Objects Present: ${items.map(i => i.name).join(', ')}.
      ${itemVisuals}

      ${settingVisual}

      Style: Modern anime, cinematic lighting, highly detailed.
    `;

    // Prepare human reference images (Max 5)
    const humanParts = await Promise.all(characters
      .filter(c => c.referenceImageUrl) // Allow all URLs
      .slice(0, 5)
      .map(async c => {
        const result = await getBase64FromUrl(c.referenceImageUrl!);
        if (!result) return null;
        return {
            inlineData: {
            mimeType: result.mimeType,
            data: result.data
            }
        };
      }));

    // Prepare object reference images (Max 9)
    const objectParts = await Promise.all(items
      .filter(i => i.referenceImageUrl)
      .slice(0, 9)
      .map(async i => {
        const result = await getBase64FromUrl(i.referenceImageUrl!);
        if (!result) return null;
        return {
            inlineData: {
            mimeType: result.mimeType,
            data: result.data
            }
        };
      }));

    // Filter out failed conversions
    const validHumanParts = humanParts.filter(p => p !== null);
    const validObjectParts = objectParts.filter(p => p !== null);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        { text: prompt },
        ...validHumanParts,
        ...validObjectParts
      ],
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
