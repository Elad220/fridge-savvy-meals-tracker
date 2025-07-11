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
  amount: number;
  unit: string;
  storageLocation: string;
  label: FoodItemLabel;
  notes?: string;
  tags?: string[];
  userId: string;
  freshnessDays?: number; // Custom freshness period in days
}

export interface MealPlanIngredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface MealPlan {
  id: string;
  name: string;
  plannedDate?: Date;
  destinationTime?: Date;
  notes?: string;
  ingredients?: MealPlanIngredient[];
  preparationSteps?: string[];
  userId: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  source?: 'manual' | 'generated' | 'imported';
  sourceMetadata?: Record<string, unknown>;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreateRecipeData {
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  source?: 'manual' | 'generated' | 'imported';
  sourceMetadata?: Record<string, unknown>;
}

export type FreshnessStatus = 'fresh' | 'use-soon' | 'use-or-throw' | 'expired';

// Common units for food items
export const FOOD_UNITS = [
  'pcs', 'pieces', 'item', 'items',
  'small container', 'medium container', 'large container',
  'small bowl', 'medium bowl', 'large bowl',
  'small pot', 'medium pot', 'large pot',
  'dozen', 'pack', 'packs', 'packet', 'packets',
  'serving', 'servings', 'portion', 'portions',
  'cup', 'cups', 'tbsp', 'tsp', 'ml', 'l', 'liter', 'liters',
  'g', 'gr', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
  'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds',
  'slice', 'slices', 'half', 'quarter', 'third',
  'bag', 'bags', 'box', 'boxes', 'bottle', 'bottles',
  'can', 'cans', 'jar', 'jars', 'tube', 'tubes'
] as const;