export interface FoodRecord {
  id: string;
  timestamp: string;
  foodType: FoodType;
  quantity: string;
  caregiverId: string;
  caregiverName: string;
  notes?: string;
  synced?: boolean;
}

export type FoodType = "pellet" | "casera" | "mix";