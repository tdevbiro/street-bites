import { supabase } from '../lib/supabase';
import { Business, Review, Message, BusinessPost, Product } from '../types';

/**
 * Service for managing business data with Supabase
 */
class BusinessService {
  /**
   * Fetch all active businesses
   */
  async getBusinesses(): Promise<Business[]> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          products(*),
          reviews(*),
          messages(*),
          posts(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get latest location for each business
      const businessesWithLocations = await Promise.all(
        (data || []).map(async (biz) => {
          const { data: location } = await supabase
            .from('locations')
            .select('latitude, longitude')
            .eq('business_id', biz.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

          return {
            ...biz,
            location: location ? [location.latitude, location.longitude] : [0, 0]
          } as Business;
        })
      );

      return businessesWithLocations;
    } catch (error) {
      console.error('Error fetching businesses:', error);
      return [];
    }
  }

  /**
   * Get a single business by ID
   */
  async getBusiness(id: string): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          products(*),
          reviews(*),
          messages(*),
          posts(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get latest location
      const { data: location } = await supabase
        .from('locations')
        .select('latitude, longitude')
        .eq('business_id', id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      return {
        ...data,
        location: location ? [location.latitude, location.longitude] : [0, 0]
      } as Business;
    } catch (error) {
      console.error('Error fetching business:', error);
      return null;
    }
  }

  /**
   * Create a new business
   */
  async createBusiness(businessData: Partial<Business>): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          name: businessData.name,
          category: businessData.category,
          description: businessData.description,
          image_url: businessData.imageUrl,
          status: 'offline',
          owner_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial location if provided
      if (businessData.location && data) {
        await supabase.from('locations').insert({
          business_id: data.id,
          latitude: businessData.location[0],
          longitude: businessData.location[1]
        });
      }

      return data as Business;
    } catch (error) {
      console.error('Error creating business:', error);
      return null;
    }
  }

  /**
   * Update business status
   */
  async updateBusinessStatus(businessId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ status })
        .eq('id', businessId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating business status:', error);
    }
  }

  /**
   * Subscribe to real-time business updates
   */
  subscribeToBusinessUpdates(callback: (business: Business) => void) {
    const channel = supabase
      .channel('businesses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'businesses'
        },
        async (payload) => {
          if (payload.new) {
            const business = await this.getBusiness(payload.new.id);
            if (business) {
              callback(business);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Add a review to a business
   */
  async addReview(businessId: string, rating: number, comment: string): Promise<Review | null> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          business_id: businessId,
          user_id: user.id,
          user_name: profile?.name || 'Anonymous',
          rating,
          comment
        })
        .select()
        .single();

      if (error) throw error;
      return data as Review;
    } catch (error) {
      console.error('Error adding review:', error);
      return null;
    }
  }

  /**
   * Add a message to business chat
   */
  async addMessage(businessId: string, text: string): Promise<Message | null> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, subscription_tier')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('messages')
        .insert({
          business_id: businessId,
          user_id: user.id,
          user_name: profile?.name || 'Anonymous',
          text,
          is_plus: profile?.subscription_tier !== 'free'
        })
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  /**
   * Create a business post
   */
  async createPost(businessId: string, content: string, isImportant: boolean = false): Promise<BusinessPost | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          business_id: businessId,
          content,
          is_important: isImportant,
          type: 'announcement'
        })
        .select()
        .single();

      if (error) throw error;
      return data as BusinessPost;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  }

  /**
   * Check in to a business
   */
  async checkIn(businessId: string): Promise<void> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const { data: business } = await supabase
        .from('businesses')
        .select('checked_in_users, current_visitors')
        .eq('id', businessId)
        .single();

      if (!business) return;

      const checkedInUsers = business.checked_in_users || [];
      if (!checkedInUsers.includes(user.id)) {
        checkedInUsers.push(user.id);

        await supabase
          .from('businesses')
          .update({
            checked_in_users: checkedInUsers,
            current_visitors: business.current_visitors + 1
          })
          .eq('id', businessId);
      }
    } catch (error) {
      console.error('Error checking in:', error);
    }
  }

  /**
   * Get nearby businesses
   */
  async getNearbyBusinesses(latitude: number, longitude: number, radiusMeters: number = 5000): Promise<Business[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_nearby_businesses', {
          lat: latitude,
          lng: longitude,
          radius_meters: radiusMeters
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching nearby businesses:', error);
      return [];
    }
  }
}

export const businessService = new BusinessService();
