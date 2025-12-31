import { Language, VoiceGender } from "../types";

const API_KEY = process.env.API_KEY || '';
const TTS_ENDPOINT = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

const LANGUAGE_CODES: Record<Language, string> = {
  [Language.CN]: 'cmn-CN',
  [Language.JP]: 'ja-JP',
  [Language.KR]: 'ko-KR',
};

export const playTextToSpeech = async (
  text: string,
  language: Language,
  gender: VoiceGender
): Promise<void> => {
  try {
    const langCode = LANGUAGE_CODES[language];
    if (!langCode) throw new Error(`Unsupported language: ${language}`);

    const response = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: langCode,
          ssmlGender: gender
        },
        audioConfig: {
          audioEncoding: 'MP3'
        }
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'TTS request failed');
    }

    const data = await response.json();
    if (data.audioContent) {
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      await audio.play();
    }
  } catch (error) {
    console.error("TTS Error:", error);
    // Silent fail or alert? For now silent, maybe log.
  }
};