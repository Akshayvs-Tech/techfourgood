export interface ITeam {
  id: string;
  tournamentId: string;
  name: string;
  contactEmail: string;
  rosterStatus: "Pending" | "Approved" | "Denied";
  createdDate: Date;
  updatedDate: Date;
  captainId?: string; // Optional - reference to team captain player
  logoUrl?: string; // Optional - team logo
}
