export interface IPlayer {
  id: string;
  tournamentId: string;
  teamId?: string;
  profileData: Record<string, unknown>;
  registrationDate: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
  // Add these optional fields
  email?: string;
  name?: string;
  phoneNumber?: string;
}
