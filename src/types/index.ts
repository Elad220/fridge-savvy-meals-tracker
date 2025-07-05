export interface User {
  id: string;
  email: string;
  name: string;
}

export type FoodItemLabel = 'cooked meal' | 'raw material';

export interface FoodItem {
  id: string;
  name: string;
  dateCookedStored: Date;
  eatByDate: Date;
  quantity: string;
  storageLocation: string;
  label: FoodItemLabel;
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

// User Action History Types
export type UserActionType = 'add' | 'remove' | 'update' | 'move';
export type EntityType = 'food_item' | 'meal_plan';

export interface UserAction {
  id: string;
  userId: string;
  actionType: UserActionType;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  entityData?: Record<string, any>;
  actionContext?: Record<string, any>;
  createdAt: Date;
}

export interface UserActionStats {
  actionType: UserActionType;
  entityType: EntityType;
  actionCount: number;
  mostRecentAction: Date;
}

export interface UserActionPattern {
  entityName: string;
  actionType: UserActionType;
  actionCount: number;
  avgDaysBetweenActions?: number;
  mostCommonStorageLocation?: string;
  mostCommonLabel?: string;
  avgFreshnessDays?: number;
}