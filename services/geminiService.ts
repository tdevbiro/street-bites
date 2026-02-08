
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Business } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateAIReviewResponse(businessName: string, userComment: string) {
  try {
    const response = await model.generateContent(
      `You are the owner of a mobile business named "${businessName}". A customer left this review: "${userComment}". 
Write a friendly, professional, and short response (max 2 sentences) thanking them or addressing their comment.`
    );
    return response.response.text() || "Thank you for visiting us! We hope to see you again soon.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Thank you for the feedback!";
  }
}

export async function getSmartCategorySuggestion(description: string) {
  try {
    const response = await model.generateContent(
      `Given the description: "${description}", suggest the most appropriate category from this list: Food Truck, Ice Cream, Coffee, Flower Truck, Fashion Van, Pet Grooming. Output only the category name.`
    );
    return response.response.text().trim();
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

    const response = await model.generateContent(
      `User is searching for: "${query}". Based on this list of businesses, return JSON with a key "recommendedIds" that is an array of IDs for the businesses that best match the query.
Business list: ${JSON.stringify(bizList)}`
    );

    const text = response.response.text();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const json = jsonStart !== -1 && jsonEnd !== -1 ? text.slice(jsonStart, jsonEnd + 1) : "{}";
    const result = JSON.parse(json);
    return (result.recommendedIds || []) as string[];
  } catch (error) {
    console.error("AI Filter Error:", error);
    return [];
  }
}
