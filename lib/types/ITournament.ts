export interface ITournament {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  rules: string;
  status: 'Setup' | 'Active' | 'Complete';
}