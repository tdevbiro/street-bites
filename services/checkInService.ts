import { CheckIn } from '../types';

export const checkInService = {
  async checkIn(userId: string, businessId: string, location: [number, number]): Promise<CheckIn> {
    const checkIn: CheckIn = {
      id: crypto.randomUUID(),
      userId,
      businessId,
      latitude: location[0],
      longitude: location[1],
      checkInTime: Date.now()
    };

    // Save to localStorage (mock)
    const checkIns = JSON.parse(localStorage.getItem('streetbites_checkins') || '[]');
    checkIns.push(checkIn);
    localStorage.setItem('streetbites_checkins', JSON.stringify(checkIns));

    return checkIn;
  },

  async checkOut(checkInId: string): Promise<CheckIn | null> {
    const checkIns: CheckIn[] = JSON.parse(localStorage.getItem('streetbites_checkins') || '[]');
    const checkIn = checkIns.find(c => c.id === checkInId);

    if (checkIn) {
      checkIn.checkOutTime = Date.now();
      localStorage.setItem('streetbites_checkins', JSON.stringify(checkIns));
    }

    return checkIn || null;
  },

  async getActiveCheckIns(userId: string): Promise<CheckIn[]> {
    const checkIns: CheckIn[] = JSON.parse(localStorage.getItem('streetbites_checkins') || '[]');
    return checkIns.filter(c => c.userId === userId && !c.checkOutTime);
  },

  async getAllCheckIns(userId: string): Promise<CheckIn[]> {
    const checkIns: CheckIn[] = JSON.parse(localStorage.getItem('streetbites_checkins') || '[]');
    return checkIns.filter(c => c.userId === userId);
  },

  calculateDurationMinutes(checkIn: CheckIn): number {
    if (!checkIn.checkOutTime) {
      return Math.floor((Date.now() - checkIn.checkInTime) / 60000);
    }
    return Math.floor((checkIn.checkOutTime - checkIn.checkInTime) / 60000);
  }
};
