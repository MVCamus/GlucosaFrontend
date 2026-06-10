export interface FoodRecord {
  id: string;
  timestamp: string;
  foodType: FoodType;
  quantity: string;
  caregiverId: string;
  caregiverName: string;
  notes?: string;
}

export type FoodType = "pellet" | "casera" | "mix";