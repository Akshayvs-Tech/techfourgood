export interface IRoster {
  id: string;
  teamId: string;
  tournamentId: string;
  playerIds: string[];
  submissionDate: Date;
  approvalDate?: Date;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  rejectionReason?: string;
  minPlayers?: number;
  maxPlayers?: number;
}
