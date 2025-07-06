import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/types';
import { ActionHistoryItem } from './useActionHistory';
import { useToast } from './use-toast';

export interface ItemRecommendation {
  name: string;
  quantity: number;
  unit: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MealRecommendation {
  name: string;
  ingredients: string[];
  prepTime: string;
  lastMade?: Date;
  frequency: number;
}

export interface LowStockAlert {
  itemName: string;
  currentAmount: number;
  unit: string;
  recommendedAmount: number;
  daysUntilOut: number;
}

interface AIRecommendations {
  shopping: ItemRecommendation[];
  meals: MealRecommendation[];
  lowStock: LowStockAlert[];
  generatedAt: Date;
}

export const useAIRecommendations = (
  userId: string | undefined,
  foodItems: FoodItem[],
  actionHistory: ActionHistoryItem[]
) => {
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Analyze consumption patterns
  const analyzeConsumptionPatterns = () => {
    const patterns: Map<string, { count: number; dates: Date[] }> = new Map();
    
    // Analyze removed items from history
    actionHistory
      .filter(action => action.actionType === 'remove')
      .forEach(action => {
        const itemName = action.itemName.toLowerCase();
        const existing = patterns.get(itemName) || { count: 0, dates: [] };
        patterns.set(itemName, {
          count: existing.count + 1,
          dates: [...existing.dates, action.createdAt]
        });
      });

    return patterns;
  };

  // Check for low stock items
  const checkLowStock = (): LowStockAlert[] => {
    const lowStockAlerts: LowStockAlert[] = [];
    const consumptionPatterns = analyzeConsumptionPatterns();

    // Group items by name
    const itemGroups = new Map<string, FoodItem[]>();
    foodItems
      .filter(item => item.label === 'raw material')
      .forEach(item => {
        const key = item.name.toLowerCase();
        const existing = itemGroups.get(key) || [];
        itemGroups.set(key, [...existing, item]);
      });

    // Check each item type
    itemGroups.forEach((items, itemName) => {
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      const pattern = consumptionPatterns.get(itemName);
      
      if (pattern && pattern.count >= 2) {
        // Calculate consumption rate
        const dates = pattern.dates.sort((a, b) => a.getTime() - b.getTime());
        const daysBetweenConsumption = dates.length > 1 
          ? (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24) / (dates.length - 1)
          : 7; // Default to weekly if not enough data
        
        const consumptionRate = pattern.count / (daysBetweenConsumption || 7);
        const daysUntilOut = totalAmount / consumptionRate;
        
        // Alert if less than 3 days of stock
        if (daysUntilOut < 3 && totalAmount > 0) {
          lowStockAlerts.push({
            itemName: items[0].name,
            currentAmount: totalAmount,
            unit: items[0].unit,
            recommendedAmount: Math.ceil(consumptionRate * 7), // Week's worth
            daysUntilOut: Math.round(daysUntilOut)
          });
        }
      }
    });

    return lowStockAlerts;
  };

  // Generate shopping recommendations
  const generateShoppingRecommendations = (): ItemRecommendation[] => {
    const recommendations: ItemRecommendation[] = [];
    const consumptionPatterns = analyzeConsumptionPatterns();
    
    // Analyze frequently consumed items
    consumptionPatterns.forEach((pattern, itemName) => {
      if (pattern.count >= 3) { // Item consumed at least 3 times
        const currentStock = foodItems
          .filter(item => item.name.toLowerCase() === itemName && item.label === 'raw material')
          .reduce((sum, item) => sum + item.amount, 0);
        
        if (currentStock === 0) {
          recommendations.push({
            name: itemName,
            quantity: Math.ceil(pattern.count / 2), // Suggest half of historical consumption
            unit: 'items',
            reason: `You've consumed this ${pattern.count} times recently`,
            priority: pattern.count > 5 ? 'high' : 'medium'
          });
        }
      }
    });

    return recommendations;
  };

  // Generate meal recommendations
  const generateMealRecommendations = async (): Promise<MealRecommendation[]> => {
    if (!userId) return [];

    try {
      // Fetch meal combinations from database
      const { data: mealCombinations, error } = await supabase
        .from('meal_combinations')
        .select('*')
        .eq('user_id', userId)
        .order('frequency', { ascending: false })
        .limit(5);

      if (error) throw error;

      return mealCombinations?.map(meal => ({
        name: meal.meal_name,
        ingredients: meal.ingredients as string[],
        prepTime: '30 mins', // Default, could be stored in DB
        lastMade: meal.last_prepared ? new Date(meal.last_prepared) : undefined,
        frequency: meal.frequency
      })) || [];
    } catch (error) {
      console.error('Error fetching meal combinations:', error);
      return [];
    }
  };

  // Main function to generate all recommendations
  const generateRecommendations = async () => {
    if (!userId || loading) return;

    setLoading(true);
    try {
      // Check if we have cached recommendations
      const { data: cached, error: cacheError } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .gte('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(1);

      if (!cacheError && cached && cached.length > 0) {
        const cachedRecs = cached[0].recommendations as AIRecommendations;
        setRecommendations({
          ...cachedRecs,
          generatedAt: new Date(cached[0].generated_at)
        });
        return;
      }

      // Generate new recommendations
      const lowStock = checkLowStock();
      const shopping = generateShoppingRecommendations();
      const meals = await generateMealRecommendations();

      const newRecommendations: AIRecommendations = {
        shopping,
        meals,
        lowStock,
        generatedAt: new Date()
      };

      // Cache the recommendations
      await supabase
        .from('ai_recommendations')
        .insert({
          user_id: userId,
          recommendation_type: 'all',
          recommendations: newRecommendations
        });

      setRecommendations(newRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update consumption patterns when items are added
  const updateConsumptionPattern = async (item: FoodItem) => {
    if (!userId || item.label !== 'raw material') return;

    try {
      await supabase.rpc('update_consumption_pattern', {
        p_user_id: userId,
        p_item_name: item.name,
        p_quantity: item.amount,
        p_unit: item.unit
      });
    } catch (error) {
      console.error('Error updating consumption pattern:', error);
    }
  };

  // Update meal combinations when cooked meals are added
  const updateMealCombination = async (mealName: string, ingredients: string[]) => {
    if (!userId) return;

    try {
      const { data: existing } = await supabase
        .from('meal_combinations')
        .select('*')
        .eq('user_id', userId)
        .eq('meal_name', mealName)
        .single();

      if (existing) {
        await supabase
          .from('meal_combinations')
          .update({
            frequency: existing.frequency + 1,
            last_prepared: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('meal_combinations')
          .insert({
            user_id: userId,
            meal_name: mealName,
            ingredients,
            frequency: 1,
            last_prepared: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error updating meal combination:', error);
    }
  };

  useEffect(() => {
    if (userId && foodItems.length > 0) {
      generateRecommendations();
    }
  }, [userId, foodItems.length, actionHistory.length]);

  return {
    recommendations,
    loading,
    refreshRecommendations: generateRecommendations,
    updateConsumptionPattern,
    updateMealCombination
  };
};