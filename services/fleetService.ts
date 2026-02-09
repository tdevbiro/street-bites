import { DriverInvitation, FleetVehicle, DriverProfile } from '../types';

export const fleetService = {
  async inviteDriver(companyId: string, email: string): Promise<DriverInvitation> {
    const inviteToken = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const invitation: DriverInvitation = {
      id: crypto.randomUUID(),
      companyId,
      email,
      inviteToken,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt
    };

    // Save to localStorage (mock)
    const invitations = JSON.parse(localStorage.getItem('streetbites_invitations') || '[]');
    invitations.push(invitation);
    localStorage.setItem('streetbites_invitations', JSON.stringify(invitations));

    // In real app, send email with invite link
    console.log(`📧 Email meghívás elküldve: ${email}`);
    console.log(`🔗 Invite token: ${inviteToken}`);

    return invitation;
  },

  async acceptInvitation(inviteToken: string, driverId: string): Promise<DriverInvitation | null> {
    const invitations: DriverInvitation[] = JSON.parse(
      localStorage.getItem('streetbites_invitations') || '[]'
    );

    const invitation = invitations.find(i => i.inviteToken === inviteToken);
    if (invitation && invitation.status === 'pending') {
      invitation.status = 'accepted';
      invitation.acceptedAt = Date.now();
      localStorage.setItem('streetbites_invitations', JSON.stringify(invitations));

      // Update driver profile
      const drivers: DriverProfile[] = JSON.parse(localStorage.getItem('streetbites_drivers') || '[]');
      const driver = drivers.find(d => d.id === driverId);
      if (driver) {
        driver.isAcceptedInvite = true;
        driver.companyId = invitation.id;
        localStorage.setItem('streetbites_drivers', JSON.stringify(drivers));
      }

      return invitation;
    }

    return null;
  },

  async createVehicle(
    companyId: string,
    licensePlate: string,
    vehicleModel?: string,
    vehicleColor?: string
  ): Promise<FleetVehicle> {
    const vehicle: FleetVehicle = {
      id: crypto.randomUUID(),
      companyId,
      licensePlate,
      vehicleModel,
      vehicleColor,
      status: 'inactive',
      gpsEnabled: true
    };

    const vehicles = JSON.parse(localStorage.getItem('streetbites_vehicles') || '[]');
    vehicles.push(vehicle);
    localStorage.setItem('streetbites_vehicles', JSON.stringify(vehicles));

    return vehicle;
  },

  async assignDriverToVehicle(vehicleId: string, driverId: string): Promise<void> {
    const vehicles: FleetVehicle[] = JSON.parse(
      localStorage.getItem('streetbites_vehicles') || '[]'
    );

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.driverId = driverId;
      localStorage.setItem('streetbites_vehicles', JSON.stringify(vehicles));
    }
  },

  async updateVehicleStatus(vehicleId: string, status: 'active' | 'inactive' | 'maintenance'): Promise<void> {
    const vehicles: FleetVehicle[] = JSON.parse(
      localStorage.getItem('streetbites_vehicles') || '[]'
    );

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.status = status;
      localStorage.setItem('streetbites_vehicles', JSON.stringify(vehicles));
    }
  },

  async getCompanyVehicles(companyId: string): Promise<FleetVehicle[]> {
    const vehicles: FleetVehicle[] = JSON.parse(
      localStorage.getItem('streetbites_vehicles') || '[]'
    );
    return vehicles.filter(v => v.companyId === companyId);
  },

  async getPendingInvitations(companyId: string): Promise<DriverInvitation[]> {
    const invitations: DriverInvitation[] = JSON.parse(
      localStorage.getItem('streetbites_invitations') || '[]'
    );
    return invitations.filter(i => i.companyId === companyId && i.status === 'pending');
  }
};
