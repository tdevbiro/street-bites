import { StreetPassportStamp } from '../types';

export const passportService = {
  async addStamp(
    userId: string,
    businessId: string,
    businessName: string,
    businessLogo: string
  ): Promise<StreetPassportStamp> {
    const stamps: StreetPassportStamp[] = JSON.parse(
      localStorage.getItem(`streetbites_passport_${userId}`) || '[]'
    );

    const existingStamp = stamps.find(s => s.businessId === businessId);

    if (existingStamp) {
      existingStamp.visitCount += 1;
      existingStamp.lastVisited = Date.now();
    } else {
      stamps.push({
        id: crypto.randomUUID(),
        userId,
        businessId,
        businessName,
        businessLogo,
        visitCount: 1,
        rating: 0,
        lastVisited: Date.now()
      });
    }

    localStorage.setItem(`streetbites_passport_${userId}`, JSON.stringify(stamps));
    return existingStamp || stamps[stamps.length - 1];
  },

  async updateStampRating(userId: string, businessId: string, rating: number): Promise<void> {
    const stamps: StreetPassportStamp[] = JSON.parse(
      localStorage.getItem(`streetbites_passport_${userId}`) || '[]'
    );

    const stamp = stamps.find(s => s.businessId === businessId);
    if (stamp) {
      // Average with previous rating
      stamp.rating = (stamp.rating + rating) / 2;
      localStorage.setItem(`streetbites_passport_${userId}`, JSON.stringify(stamps));
    }
  },

  async getStamps(userId: string): Promise<StreetPassportStamp[]> {
    const stamps: StreetPassportStamp[] = JSON.parse(
      localStorage.getItem(`streetbites_passport_${userId}`) || '[]'
    );
    return stamps.sort((a, b) => b.lastVisited - a.lastVisited);
  },

  async getStampCount(userId: string): Promise<number> {
    const stamps: StreetPassportStamp[] = JSON.parse(
      localStorage.getItem(`streetbites_passport_${userId}`) || '[]'
    );
    return stamps.length;
  },

  async getTotalVisits(userId: string): Promise<number> {
    const stamps: StreetPassportStamp[] = JSON.parse(
      localStorage.getItem(`streetbites_passport_${userId}`) || '[]'
    );
    return stamps.reduce((total, stamp) => total + stamp.visitCount, 0);
  }
};
