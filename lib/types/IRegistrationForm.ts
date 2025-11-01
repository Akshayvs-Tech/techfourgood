export interface IFormField {
  id: string;
  label: string;
  type: "text" | "email" | "number" | "tel" | "date" | "select" | "textarea";
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface IRegistrationForm {
  tournamentId: string;
  playerFields: IFormField[];
  teamFields: IFormField[];
}
