export interface Caregiver {
  id: string;
  name: string;
  role: "owner" | "family" | "veterinarian" | "admin";
  password?: string;
  petId?: string;
}
