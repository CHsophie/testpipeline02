import OpenAI from "openai";

export interface SentenceInfo {
  text: string;
  pinyin: string;
  lastSearchedAt: number;
  type: 'sentence';
}

export interface CharacterInfo {
  character: string;
  pinyin: string;
  meaning?: string;
  phrases: string[];
  lastSearchedAt: number;
  reviewCount: number;
  nextReviewAt: number;
  isOffTopic?: boolean;
  type: 'character';
}

export type HistoryItem = CharacterInfo | SentenceInfo;

export async function extractCharacterFromSpeech(speechText: string): Promise<CharacterInfo | null> {
  if (!speechText || speechText.trim().length === 0) {
    return null;
  }

  try {
    console.log("Extracting character from (via Netlify Function):", speechText);
    const response = await fetch("/.netlify/functions/qwen-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ speechText, mode: 'character' }),
    });

    const responseText = await response.text();
    if (!responseText) {
      throw new Error("服务器返回内容为空，请检查 API Key 配置。");
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", responseText);
      throw new Error("服务器返回格式错误，请稍后再试。");
    }

    if (!response.ok) {
      throw new Error(result.error || "Failed to call Netlify Function.");
    }

    if (result.isOffTopic) {
      return { 
        character: "", 
        pinyin: "", 
        phrases: [], 
        isOffTopic: true,
        lastSearchedAt: 0, 
        reviewCount: 0, 
        nextReviewAt: 0,
        type: 'character'
      };
    }

    if (result.character && typeof result.character === 'string') {
      const char = result.character.trim().charAt(0);
      if (char) {
        return {
          character: char,
          pinyin: result.pinyin || "",
          phrases: Array.isArray(result.phrases) ? result.phrases : [],
          isOffTopic: false,
          lastSearchedAt: Date.now(),
          reviewCount: 0,
          nextReviewAt: 0,
          type: 'character'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Extraction error:", error);
    throw error;
  }
}

export async function extractSentenceFromSpeech(speechText: string): Promise<SentenceInfo | null> {
  if (!speechText || speechText.trim().length === 0) {
    return null;
  }

  try {
    console.log("Annotating sentence (via Netlify Function):", speechText);
    const response = await fetch("/.netlify/functions/qwen-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ speechText, mode: 'sentence' }),
    });

    const responseText = await response.text();
    if (!responseText) {
      throw new Error("服务器返回内容为空，请检查 API Key 配置。");
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", responseText);
      throw new Error("服务器返回格式错误，请稍后再试。");
    }

    if (!response.ok) {
      throw new Error(result.error || "Failed to call Netlify Function.");
    }

    return {
      text: result.text || speechText,
      pinyin: result.pinyin || "",
      lastSearchedAt: Date.now(),
      type: 'sentence'
    };
  } catch (error) {
    console.error("Sentence extraction error:", error);
    throw error;
  }
}
