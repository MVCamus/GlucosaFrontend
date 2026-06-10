export interface DogProfile {
  id: string;
  name: string;
  breed: string;
  weightKg: number;
  dateOfBirth: string;
  photoUrl?: string;
  targetLow?: number;
  targetHigh?: number;
}