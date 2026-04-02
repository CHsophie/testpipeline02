
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
  if (!speechText || speechText.trim().length === 0) {
    console.warn("Empty speech text received");
    return null;
  }

  try {
    console.log("Extracting character from (via backend):", speechText);
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ speechText }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to call backend API.");
    }

    const result = await response.json();
    console.log("Backend result:", result);

    if (result.isOffTopic) {
      return { 
        character: "", 
        pinyin: "", 
        phrases: [], 
        isOffTopic: true,
        lastSearchedAt: 0, 
        reviewCount: 0, 
        nextReviewAt: 0 
      };
    }

    // Ensure character is a single character
    if (result.character && typeof result.character === 'string') {
      const char = result.character.trim().charAt(0);
      if (char) {
        return {
          character: char,
          pinyin: result.pinyin || "",
          phrases: Array.isArray(result.phrases) ? result.phrases : [],
          isOffTopic: false,
          lastSearchedAt: 0,
          reviewCount: 0,
          nextReviewAt: 0
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Extraction error:", error);
    throw error; // Rethrow to let the UI handle it
  }
}
