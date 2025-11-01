export interface ISpiritConfig {
  tournamentId: string;
  categories: [string, string, string, string, string];
  realtimeDisplay: boolean;
  submissionWindowHours: number;
}