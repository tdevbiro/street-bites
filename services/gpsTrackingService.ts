import { supabase } from '../lib/supabase';
import { Business } from '../types';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

interface GPSTrackingOptions {
  enableHighAccuracy?: boolean;
  updateInterval?: number;
  onUpdate?: (position: GPSPosition) => void;
  onError?: (error: GeolocationPositionError) => void;
}

class GPSTrackingService {
  private watchId: number | null = null;
  private businessId: string | null = null;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 30000; // 30 seconds default
  private isTracking: boolean = false;

  /**
   * Start tracking GPS location for a business
   */
  startTracking(businessId: string, options: GPSTrackingOptions = {}) {
    if (this.isTracking) {
      console.warn('GPS tracking already active');
      return;
    }

    this.businessId = businessId;
    this.updateInterval = options.updateInterval || 30000;
    this.isTracking = true;

    const gpsOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: 10000,
      maximumAge: 0
    };

    // Watch position continuously
    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        
        // Throttle updates based on interval
        if (now - this.lastUpdateTime < this.updateInterval) {
          return;
        }

        this.lastUpdateTime = now;

        const gpsData: GPSPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined
        };

        // Call update callback
        if (options.onUpdate) {
          options.onUpdate(gpsData);
        }

        // Save to Supabase
        await this.saveLocationToDatabase(businessId, gpsData);
      },
      (error) => {
        console.error('GPS Error:', error);
        if (options.onError) {
          options.onError(error);
        }
      },
      gpsOptions
    );

    console.log(`GPS tracking started for business ${businessId}`);
  }

  /**
   * Stop tracking GPS location
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.isTracking = false;
    this.businessId = null;
    console.log('GPS tracking stopped');
  }

  /**
   * Save location data to Supabase
   */
  private async saveLocationToDatabase(businessId: string, position: GPSPosition) {
    try {
      const { error } = await supabase
        .from('locations')
        .insert({
          business_id: businessId,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          heading: position.heading,
          speed: position.speed
        });

      if (error) {
        console.error('Failed to save location:', error);
        throw error;
      }

      console.log('Location saved:', position);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }

  /**
   * Get current location once (without tracking)
   */
  async getCurrentLocation(): Promise<GPSPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Get location history for a business
   */
  async getLocationHistory(businessId: string, limit: number = 100) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('business_id', businessId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching location history:', error);
      return [];
    }
  }

  /**
   * Get latest location for a business
   */
  async getLatestLocation(businessId: string): Promise<GPSPosition | null> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('business_id', businessId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      
      return data ? {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy ?? undefined,
        heading: data.heading ?? undefined,
        speed: data.speed ?? undefined
      } : null;
    } catch (error) {
      console.error('Error fetching latest location:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time location updates for a business
   */
  subscribeToLocationUpdates(
    businessId: string,
    callback: (position: GPSPosition) => void
  ) {
    const channel = supabase
      .channel(`locations:${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          const location = payload.new;
          callback({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy ?? undefined,
            heading: location.heading ?? undefined,
            speed: location.speed ?? undefined
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Get nearby businesses based on current location
   */
  async getNearbyBusinesses(
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000
  ): Promise<Business[]> {
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

  /**
   * Calculate distance between two points (in meters)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if tracking is currently active
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }
}

// Export singleton instance
export const gpsTrackingService = new GPSTrackingService();
