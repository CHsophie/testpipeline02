import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface CharacterInfo {
  character: string;
  pinyin: string;
  meaning?: string;
  phrases: string[];
  lastSearchedAt: number;
  reviewCount: number;
  nextReviewAt: number;
  isOffTopic?: boolean;
}

export async function extractCharacterFromSpeech(speechText: string): Promise<CharacterInfo | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个汉字学习助手。
从这段话中提取出用户想要查询的那个汉字。
用户输入: "${speechText}"

规则:
1. 如果用户是在询问某个汉字怎么写、读音、或者关于某个汉字的学习，提取该汉字。
2. 如果用户的输入与学习汉字无关（例如：闲聊、问天气、讲故事、数学题等），请将 isOffTopic 设置为 true。
3. 如果是查询汉字，请返回该汉字、其拼音，以及3-5个适合小朋友学习的常用词组。

例如: "老虎的虎怎么写" -> { "character": "虎", "pinyin": "hǔ", "phrases": ["老虎", "小虎", "爬山虎"], "isOffTopic": false }
例如: "你好呀" -> { "character": "", "pinyin": "", "phrases": [], "isOffTopic": true }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            character: { type: Type.STRING, description: "提取出的单个汉字" },
            pinyin: { type: Type.STRING, description: "该汉字的拼音" },
            phrases: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "与该汉字相关的3-5个常用词组" 
            },
            isOffTopic: { type: Type.BOOLEAN, description: "是否为非汉字查询的闲聊或无关内容" }
          },
          required: ["character", "pinyin", "phrases", "isOffTopic"],
        },
      },
    });

    const result = JSON.parse(response.text);
    if (result.isOffTopic) {
      return { ...result, character: "", pinyin: "", phrases: [], lastSearchedAt: 0, reviewCount: 0, nextReviewAt: 0 };
    }
    if (result.character && result.character.length === 1) {
      return result;
    }
    return null;
  } catch (error) {
    console.error("Gemini extraction error:", error);
    return null;
  }
}
