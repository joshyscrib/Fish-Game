import { GoogleGenAI } from "@google/genai";
import { Fish } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateLore = async (fish: Fish): Promise<string> => {
  const client = getClient();
  if (!client) return "The river holds many secrets...";

  try {
    const prompt = `
      Describe a mythical or legendary ${fish.rarity} ${fish.type} caught in a pixel art river.
      It weighs ${fish.weight.toFixed(1)} lbs.
      One short sentence, poetic and mysterious.
    `;
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || "A legendary catch!";
  } catch (e) {
    console.error(e);
    return "The scales shimmer with an unknown energy.";
  }
};

export const shopkeeperChat = async (history: string[]): Promise<string> => {
    const client = getClient();
    if(!client) return "..."

    try {
        const prompt = `
            You are a mysterious shopkeeper by a pixelated river.
            You sell fishing gear to an old man.
            User conversation history: ${JSON.stringify(history)}
            Respond to the last message in character. Keep it brief (max 15 words).
        `;
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text?.trim() || "Take a look at my wares.";
    } catch (e) {
        return "Not much biting today, eh?";
    }
}
