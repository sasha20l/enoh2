import { GoogleGenAI, Modality, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { StructuredContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  currentMessage: string
): Promise<StructuredContent> => {
  try {
    const model = "gemini-2.5-flash"; 
    
    // Convert history
    const contents = [
      ...history.map(h => ({
        role: h.role,
        parts: h.parts
      })),
      {
        role: "user",
        parts: [{ text: currentMessage }]
      }
    ];

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pastoralResponse: { type: Type.STRING },
            citedVerses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  reference: { type: Type.STRING },
                  text: { type: Type.STRING },
                  book: { type: Type.STRING },
                  chapter: { type: Type.INTEGER },
                  verse: { type: Type.INTEGER },
                  commentaries: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                         author: { type: Type.STRING },
                         summary: { type: Type.STRING },
                         source: { type: Type.STRING },
                         // aiExplanation is intentionally removed from required initial generation
                         aiExplanation: { type: Type.STRING }
                      },
                      required: ["author", "summary"]
                    }
                  }
                },
                required: ["reference", "text", "commentaries"]
              }
            }
          },
          required: ["pastoralResponse", "citedVerses"]
        }
      }
    });

    if (response.text) {
      let cleanText = response.text.trim();
      
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }

      let parsed: any;
      try {
        parsed = JSON.parse(cleanText);
      } catch (e) {
        console.warn("JSON Parse Failed", cleanText);
        // Fallback: use the raw text if it looks like a response, stripping braces roughly
        const fallbackText = cleanText.replace(/^[\s\S]*?"pastoralResponse"\s*:\s*"/, '').split('",')[0].replace(/\\"/g, '"');
        return {
             pastoralResponse: fallbackText.length > 10 ? fallbackText : "Простите, ответ был получен, но я не смог его прочитать. Попробуйте перефразировать вопрос.",
             citedVerses: []
        };
      }

      // Runtime type check
      if (!parsed || typeof parsed !== 'object') {
        return {
          pastoralResponse: "Простите, произошла ошибка обработки данных.",
          citedVerses: []
        };
      }

      const safeContent: StructuredContent = {
        pastoralResponse: parsed.pastoralResponse || "Мир вам.",
        citedVerses: Array.isArray(parsed.citedVerses) ? parsed.citedVerses.map((v: any) => ({
          reference: v.reference || "",
          text: v.text || "",
          book: v.book || "",
          chapter: v.chapter || 0,
          verse: v.verse || 0,
          commentaries: Array.isArray(v.commentaries) ? v.commentaries.map((c: any) => ({
             author: c.author || "Неизвестный автор",
             summary: c.summary || "",
             source: c.source || "",
             aiExplanation: c.aiExplanation || "" 
          })) : []
        })) : [],
      };

      return safeContent;
    }
    
    // Case where response.text is undefined (e.g. Safety filter)
    return {
      pastoralResponse: "Простите, я не могу ответить на этот вопрос из-за ограничений безопасности или этики.",
      citedVerses: []
    };

  } catch (error) {
    console.error("Gemini Text API Error:", error);
    return {
      pastoralResponse: "Простите, произошла ошибка связи. Пожалуйста, попробуйте еще раз.",
      citedVerses: []
    };
  }
};

export const generateCommentaryExplanation = async (
  userQuery: string,
  verseText: string,
  commentarySummary: string
): Promise<string> => {
  try {
    const prompt = `
      Вопрос пользователя: "${userQuery}"
      
      Стих из Писания: "${verseText}"
      
      Толкование Святого Отца: "${commentarySummary}"
      
      ЗАДАЧА:
      От имени Еноха (в спокойном, уважительном, светлом тоне) объясни кратко (2-3 предложения), как именно это толкование отвечает на вопрос пользователя.
      Вскрой духовную логику. Почему это толкование здесь уместно?
      Не используй сложные термины. Пиши просто, для сердца.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.4,
      }
    });

    return response.text || "Простите, не удалось сформировать пояснение.";
  } catch (error) {
    console.error("Explanation Gen Error:", error);
    return "Простите, сейчас я не могу пояснить это толкование.";
  }
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext
): Promise<AudioBuffer> {
  try {
     return await ctx.decodeAudioData(data.buffer.slice(0)); 
  } catch (e) {
      const pcmData = new Int16Array(data.buffer);
      const buffer = ctx.createBuffer(1, pcmData.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < pcmData.length; i++) {
          channelData[i] = pcmData[i] / 32768.0;
      }
      return buffer;
  }
}

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const safeText = text.length > 500 ? text.substring(0, 500) + "..." : text;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: safeText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Gemini TTS API Error:", error);
    return null;
  }
};

export const playAudio = async (base64Audio: string): Promise<void> => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass({ sampleRate: 24000 });
    const bytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(bytes, audioContext);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
};