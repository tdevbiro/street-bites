import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../lib/supabase";
import { Business } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

interface LocationPrediction {
  latitude: number;
  longitude: number;
  locationName?: string;
  predictedTime: Date;
  confidenceScore: number;
  dayOfWeek: number;
  hourOfDay: number;
}

interface RoutePattern {
  locationName: string;
  latitude: number;
  longitude: number;
  averageArrivalTime: string;
  frequency: number;
  dayOfWeek: number;
}

/**
 * AI-powered prediction service using Gemini
 */
class AIPredictionService {
  /**
   * Generate AI review response (existing)
   */
  async generateAIReviewResponse(businessName: string, userComment: string): Promise<string> {
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

  /**
   * Suggest business category based on description
   */
  async getSmartCategorySuggestion(description: string): Promise<string> {
    try {
      const response = await model.generateContent(
        `Given the description: "${description}", suggest the most appropriate category from this list: 
Food Truck, Ice Cream, Coffee, Flower Truck, Fashion Van, Pet Grooming, Juice Bar, BBQ Truck, Bakery Van, 
Craft Beer Truck, Burger Van, Pizza Truck, Smoothie Bar, Donut Truck, Taco Truck, Sushi Van, 
Mobile Salon, Mobile Spa, Mobile Car Wash, Mobile Repair Shop, Mobile Bookstore, Mobile Gym.
Output only the category name.`
      );
      return response.response.text().trim();
    } catch (error) {
      return "Food Truck";
    }
  }

  /**
   * AI-powered smart search filter
   */
  async getAISmartFilter(query: string, businesses: Business[]): Promise<string[]> {
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

  /**
   * Analyze location history and predict future locations using AI
   */
  async predictFutureLocations(businessId: string): Promise<LocationPrediction[]> {
    try {
      // Fetch historical location data
      const { data: locationHistory, error } = await supabase
        .from('locations')
        .select('*')
        .eq('business_id', businessId)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;
      if (!locationHistory || locationHistory.length < 10) {
        console.warn('Insufficient location history for predictions');
        return [];
      }

      // Group locations by day of week and hour
      const patterns = this.analyzeLocationPatterns(locationHistory);

      // Use AI to generate predictions
      const response = await model.generateContent(
        `Analyze these location patterns for a mobile business and predict likely future locations.

Historical patterns (location clusters by day/hour):
${JSON.stringify(patterns, null, 2)}

Return predictions for the next 7 days in JSON format with these fields:
- latitude: predicted latitude
- longitude: predicted longitude
- predictedTime: ISO timestamp
- confidenceScore: 0-1 confidence level
- dayOfWeek: 0-6 (Sunday-Saturday)
- hourOfDay: 0-23

Consider:
1. Recurring patterns (same location, same day/time)
2. Popular spots with high frequency
3. Recent changes in behavior
4. Typical business hours

Return JSON with a key "predictions" containing an array.`
      );

      const text = response.response.text();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      const json = jsonStart !== -1 && jsonEnd !== -1 ? text.slice(jsonStart, jsonEnd + 1) : "{}";
      const result = JSON.parse(json);
      const predictions: LocationPrediction[] = result.predictions.map((p: any) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        predictedTime: new Date(p.predictedTime),
        confidenceScore: p.confidenceScore,
        dayOfWeek: p.dayOfWeek,
        hourOfDay: p.hourOfDay
      }));

      // Save predictions to database
      await this.savePredictions(businessId, predictions);

      return predictions;
    } catch (error) {
      console.error('Prediction error:', error);
      return [];
    }
  }

  /**
   * Analyze location patterns from history
   */
  private analyzeLocationPatterns(locations: any[]): RoutePattern[] {
    const clusters: Map<string, { count: number; latSum: number; lngSum: number; times: Date[] }> = new Map();

    locations.forEach(loc => {
      const date = new Date(loc.timestamp);
      const dayOfWeek = date.getDay();
      const hourOfDay = date.getHours();
      
      // Create cluster key based on approximate location (rounded to 3 decimals ~100m accuracy)
      const latRounded = Math.round(loc.latitude * 1000) / 1000;
      const lngRounded = Math.round(loc.longitude * 1000) / 1000;
      const key = `${dayOfWeek}-${hourOfDay}-${latRounded}-${lngRounded}`;

      if (!clusters.has(key)) {
        clusters.set(key, { count: 0, latSum: 0, lngSum: 0, times: [] });
      }

      const cluster = clusters.get(key)!;
      cluster.count++;
      cluster.latSum += loc.latitude;
      cluster.lngSum += loc.longitude;
      cluster.times.push(date);
    });

    // Convert clusters to patterns
    const patterns: RoutePattern[] = [];
    clusters.forEach((cluster, key) => {
      const [dayStr] = key.split('-');
      const avgLat = cluster.latSum / cluster.count;
      const avgLng = cluster.lngSum / cluster.count;
      const avgTime = new Date(cluster.times.reduce((sum, t) => sum + t.getTime(), 0) / cluster.times.length);

      patterns.push({
        locationName: `Location ${patterns.length + 1}`,
        latitude: avgLat,
        longitude: avgLng,
        averageArrivalTime: avgTime.toISOString(),
        frequency: cluster.count,
        dayOfWeek: parseInt(dayStr)
      });
    });

    // Sort by frequency (most common first)
    return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 20);
  }

  /**
   * Save predictions to database
   */
  private async savePredictions(businessId: string, predictions: LocationPrediction[]) {
    try {
      const records = predictions.map(p => ({
        business_id: businessId,
        latitude: p.latitude,
        longitude: p.longitude,
        predicted_time: p.predictedTime.toISOString(),
        confidence_score: p.confidenceScore,
        day_of_week: p.dayOfWeek,
        hour_of_day: p.hourOfDay
      }));

      const { error } = await supabase
        .from('predictions')
        .insert(records as any);

      if (error) throw error;
      console.log(`Saved ${records.length} predictions for business ${businessId}`);
    } catch (error) {
      console.error('Error saving predictions:', error);
    }
  }

  /**
   * Get AI predictions for a business
   */
  async getPredictions(businessId: string): Promise<LocationPrediction[]> {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('business_id', businessId)
        .gte('predicted_time', new Date().toISOString())
        .order('predicted_time', { ascending: true });

      if (error) throw error;

      const rows = (data as any[]) || [];
      return rows.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
        predictedTime: new Date(p.predicted_time),
        confidenceScore: p.confidence_score,
        dayOfWeek: p.day_of_week,
        hourOfDay: p.hour_of_day
      }));
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
  }

  /**
   * Generate AI-powered route suggestions based on demand and trends
   */
  async suggestOptimalRoutes(businessId: string): Promise<RoutePattern[]> {
    try {
      // Get historical data
      const { data: checkIns } = await supabase
        .from('businesses')
        .select('checked_in_users')
        .eq('id', businessId);

      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId);

      // Use AI to analyze and suggest
      const response = await model.generateContent(
        `As a mobile business route optimizer, suggest optimal locations and times based on:
- Historical check-ins: ${checkIns?.length || 0}
- Customer reviews: ${reviews?.length || 0}

Suggest 5-7 high-potential routes considering:
1. High foot traffic areas
2. Complementary nearby businesses
3. Time of day demand patterns
4. Competition levels
5. Seasonal factors

Return structured route suggestions with coordinates and timing.`
      );

      console.log('AI Route Suggestions:', response.response.text());
      return [];
    } catch (error) {
      console.error('Route suggestion error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const aiPredictionService = new AIPredictionService();

// Legacy exports for compatibility
export const generateAIReviewResponse = (businessName: string, userComment: string) =>
  aiPredictionService.generateAIReviewResponse(businessName, userComment);

export const getSmartCategorySuggestion = (description: string) =>
  aiPredictionService.getSmartCategorySuggestion(description);

export const getAISmartFilter = (query: string, businesses: Business[]) =>
  aiPredictionService.getAISmartFilter(query, businesses);
