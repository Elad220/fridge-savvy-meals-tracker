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
  confidence?: 'high' | 'medium' | 'low';
}

export interface MealRecommendation {
  name: string;
  ingredients: string[];
  prepTime: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  reason?: string;
  lastMade?: Date;
  frequency?: number;
}

export interface LowStockAlert {
  itemName: string;
  currentAmount: number;
  unit: string;
  recommendedAmount: number;
  daysUntilOut: number;
  urgency?: 'high' | 'medium' | 'low';
}

export interface Insight {
  consumptionTrends?: string;
  inventoryHealth?: string;
  shoppingPatterns?: string;
  mealPreferences?: string;
  suggestions?: string;
}

export interface NextAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

interface AIRecommendations {
  shopping: ItemRecommendation[];
  meals: MealRecommendation[];
  lowStock: LowStockAlert[];
  insights: Insight;
  nextActions: NextAction[];
  generatedAt: Date;
}

export const useAIRecommendations = (userId: string | undefined) => {
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Generate AI-powered recommendations using the Edge Function
  const generateRecommendations = async () => {
    console.log('generateRecommendations called with userId:', userId);
    if (!userId || loading) {
      console.log('Early return - userId:', userId, 'loading:', loading);
      return;
    }

    setLoading(true);
    try {
      // Skip caching for now to debug the issue
      console.log('Skipping cache check, calling Edge Function directly...');

      // Call the AI recommendations Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Calling AI recommendations Edge Function...');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Edge Function error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to generate recommendations');
      }

      const aiResult = await response.json();
      console.log('AI result:', aiResult);

      // Transform the AI response to match our interface
      const newRecommendations: AIRecommendations = {
        shopping: aiResult.shopping_recommendations?.map((item: {
          name: string;
          quantity: number;
          unit: string;
          reason: string;
          priority: 'high' | 'medium' | 'low';
          confidence?: 'high' | 'medium' | 'low';
        }) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          reason: item.reason,
          priority: item.priority,
          confidence: item.confidence
        })) || [],
        meals: aiResult.meal_suggestions?.map((meal: {
          name: string;
          ingredients: string[];
          prep_time: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          reason?: string;
        }) => ({
          name: meal.name,
          ingredients: meal.ingredients,
          prepTime: meal.prep_time,
          difficulty: meal.difficulty,
          reason: meal.reason
        })) || [],
        lowStock: aiResult.low_stock_alerts?.map((alert: {
          item_name: string;
          current_amount: number;
          unit: string;
          recommended_amount: number;
          days_until_out: number;
          urgency?: 'high' | 'medium' | 'low';
        }) => ({
          itemName: alert.item_name,
          currentAmount: alert.current_amount,
          unit: alert.unit,
          recommendedAmount: alert.recommended_amount,
          daysUntilOut: alert.days_until_out,
          urgency: alert.urgency
        })) || [],
        insights: aiResult.insights || {},
        nextActions: aiResult.next_actions?.map((action: {
          action: string;
          priority: 'high' | 'medium' | 'low';
          reason: string;
        }) => ({
          action: action.action,
          priority: action.priority,
          reason: action.reason
        })) || [],
        generatedAt: new Date()
      };

      // Skip caching for now due to TypeScript issues
      console.log('Skipping cache save due to TypeScript issues');
      
      setRecommendations(newRecommendations);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI recommendations. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update consumption patterns when items are added
  const updateConsumptionPattern = async (item: FoodItem) => {
    // Temporarily disabled due to TypeScript issues
    console.log('updateConsumptionPattern called but disabled');
  };

  // Update meal combinations when cooked meals are added
  const updateMealCombination = async (mealName: string, ingredients: string[]) => {
    // Temporarily disabled due to TypeScript issues
    console.log('updateMealCombination called but disabled');
  };

  // Clear cached recommendations when data changes
  const clearCache = async () => {
    // Temporarily disabled due to TypeScript issues
    console.log('clearCache called but disabled');
  };

  useEffect(() => {
    if (userId) {
      generateRecommendations();
    }
  }, [userId]);

  return {
    recommendations,
    loading,
    refreshRecommendations: generateRecommendations,
    updateConsumptionPattern,
    updateMealCombination,
    clearCache
  };
};