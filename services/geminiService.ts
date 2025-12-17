import { GoogleGenAI, Modality, Type } from "@google/genai";
import { BASE_SYSTEM_INSTRUCTION } from "../constants";
import { StructuredContent } from "../types";
import { StorageService } from "./storageService";
import { RagService } from "./ragService";

export const generateResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  currentMessage: string,
  modeSystemPrompt: string
): Promise<StructuredContent> => {
  const config = StorageService.getConfig();
  const apiKey = config.aiApiKey || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  try {
    const model = config.aiModel || "gemini-2.5-flash"; 
    
    // --- RAG PIPELINE START ---
    let retrievedContextString = "";
    
    // 1. Search DB (Mock or Real)
    // Only if useMockDb is on (or we had a real backend connection)
    if (config.useMockDb) {
        console.log("RAG: Searching DB for:", currentMessage);
        const verses = await RagService.searchVerses(currentMessage);
        
        if (verses.length > 0) {
            const verseIds = verses.map(v => v.id);
            const commentaries = await RagService.getCommentariesForVerses(verseIds);
            
            retrievedContextString = `
            [[CONTEXT FROM DATABASE - USE THIS AS PRIMARY TRUTH]]
            
            FOUND VERSES:
            ${verses.map(v => `ID:${v.id} | ${v.book_name} ${v.chapter}:${v.verse} | "${v.text}" | URL: ${v.azbyka_url || v.azbyka_url2}`).join('\n')}
            
            FOUND COMMENTARIES:
            ${commentaries.map(c => `VerseID:${c.verse_id} | Author: ${c.author} | Source: ${c.source_title} | Text: "${c.text_plain}" | URL: ${c.azbyka_url || c.source_url}`).join('\n\n')}
            
            INSTRUCTIONS FOR CONTEXT:
            1. If "FOUND VERSES" contains relevant answers, cite them in 'citedVerses' and set "dataSource": "db" and "azbykaUrl": [URL from context].
            2. If you use "FOUND COMMENTARIES", summarize them and set "dataSource": "db", "sourceUrl": [URL from context].
            3. Only search external knowledge if Database Context is insufficient.
            `;
        } else {
            console.log("RAG: No results found in DB");
        }
    }
    // --- RAG PIPELINE END ---

    // Combine Base Dogma + Specific Mode Instructions + RAG Context
    const fullSystemInstruction = `${BASE_SYSTEM_INSTRUCTION}\n\n${modeSystemPrompt}\n\n${retrievedContextString}`;

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
        systemInstruction: fullSystemInstruction,
        temperature: 0.3,
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
                  dataSource: { type: Type.STRING, enum: ['db', 'ai'] },
                  azbykaUrl: { type: Type.STRING },
                  commentaries: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                         author: { type: Type.STRING },
                         summary: { type: Type.STRING },
                         source: { type: Type.STRING },
                         sourceUrl: { type: Type.STRING },
                         aiExplanation: { type: Type.STRING },
                         dataSource: { type: Type.STRING, enum: ['db', 'ai'] }
                      },
                      required: ["author", "summary", "source", "dataSource"]
                    }
                  }
                },
                required: ["reference", "text", "commentaries", "dataSource"]
              }
            }
          },
          required: ["pastoralResponse", "citedVerses"]
        }
      }
    });

    if (response.text) {
      let cleanText = response.text.trim();
      if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');

      const parsed = JSON.parse(cleanText);

      const safeContent: StructuredContent = {
        pastoralResponse: parsed.pastoralResponse || "Мир вам.",
        citedVerses: Array.isArray(parsed.citedVerses) ? parsed.citedVerses.map((v: any) => ({
          reference: v.reference || "",
          text: v.text || "",
          book: v.book || "",
          chapter: v.chapter || 0,
          verse: v.verse || 0,
          dataSource: v.dataSource === 'db' ? 'db' : 'ai',
          azbykaUrl: v.azbykaUrl || undefined,
          commentaries: Array.isArray(v.commentaries) ? v.commentaries.map((c: any) => ({
             author: c.author || "Неизвестный автор",
             summary: c.summary || "",
             source: c.source || "Обобщение",
             sourceUrl: c.sourceUrl || undefined,
             aiExplanation: c.aiExplanation || "",
             dataSource: c.dataSource === 'db' ? 'db' : 'ai'
          })) : []
        })) : [],
      };

      return safeContent;
    }
    
    return {
      pastoralResponse: "Простите, я не могу ответить на этот вопрос.",
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

// ... explanation and speech functions remain similar but should use StorageService.getConfig() for API keys if needed
export const generateCommentaryExplanation = async (
  userQuery: string,
  verseText: string,
  commentarySummary: string
): Promise<string> => {
    const config = StorageService.getConfig();
    const apiKey = config.aiApiKey || process.env.API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });
    
    try {
    const prompt = `
      ${BASE_SYSTEM_INSTRUCTION}
      КОНТЕКСТ:
      Вопрос пользователя: "${userQuery}"
      Стих из Писания: "${verseText}"
      Толкование Святого Отца: "${commentarySummary}"
      ЗАДАЧА:
      Объясни кратко (2-3 предложения), как именно это толкование отвечает на вопрос пользователя.
    `;

    const response = await ai.models.generateContent({
      model: config.aiModel || "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: { temperature: 0.4 }
    });

    return response.text || "Простите, не удалось сформировать пояснение.";
  } catch (error) {
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

export const generateSpeech = async (text: string, voiceName: string = 'Fenrir'): Promise<string | null> => {
  const config = StorageService.getConfig();
  const apiKey = config.aiApiKey || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const safeText = text.length > 500 ? text.substring(0, 500) + "..." : text;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: safeText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
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