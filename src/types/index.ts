export interface User {
  id: string;
  email: string;
  name: string;
}

export interface FoodItem {
  id: string;
  name: string;
  dateCookedStored: Date;
  eatByDate: Date;
  quantity: string;
  storageLocation: string;
  notes?: string;
  userId: string;
  freshnessDays?: number; // Custom freshness period in days
}

export interface MealPlan {
  id: string;
  name: string;
  plannedDate?: Date;
  destinationTime?: Date;
  notes?: string;
  userId: string;
}

export type FreshnessStatus = 'fresh' | 'use-soon' | 'use-or-throw' | 'expired';