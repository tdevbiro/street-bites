
import { GoogleGenAI, Type } from "@google/genai";
import { Business } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateAIReviewResponse(businessName: string, userComment: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the owner of a mobile business named "${businessName}". A customer left this review: "${userComment}". 
      Write a friendly, professional, and short response (max 2 sentences) thanking them or addressing their comment.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
        thinkingConfig: { thinkingBudget: 50 },
      }
    });
    return response.text || "Thank you for visiting us! We hope to see you again soon.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Thank you for the feedback!";
  }
}

export async function getSmartCategorySuggestion(description: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Given the description: "${description}", suggest the most appropriate category from this list: Food Truck, Ice Cream, Coffee, Flower Truck, Fashion Van, Pet Grooming. Output only the category name.`,
      config: {
        temperature: 0.1,
      }
    });
    return response.text.trim();
  } catch (error) {
    return "Food Truck";
  }
}

export async function getAISmartFilter(query: string, businesses: Business[]) {
  try {
    const bizList = businesses.map(b => ({
      id: b.id,
      name: b.name,
      category: b.category,
      tags: b.tags,
      description: b.description,
      rating: b.rating
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User is searching for: "${query}". Based on this list of businesses, return a JSON array of IDs for the businesses that best match the query. 
      Business list: ${JSON.stringify(bizList)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["recommendedIds"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result.recommendedIds as string[];
  } catch (error) {
    console.error("AI Filter Error:", error);
    return [];
  }
}
