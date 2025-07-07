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
    if (!userId || loading) return;

    setLoading(true);
    try {
      // Check if we have cached recommendations
      const { data: cached, error: cacheError } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', 'ai_powered')
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

      // Cache the recommendations
      await supabase
        .from('ai_recommendations')
        .insert({
          user_id: userId,
          recommendation_type: 'ai_powered',
          recommendations: newRecommendations,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });

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

  // Clear cached recommendations when data changes
  const clearCache = async () => {
    if (!userId) return;

    try {
      await supabase
        .from('ai_recommendations')
        .delete()
        .eq('user_id', userId)
        .eq('recommendation_type', 'ai_powered');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
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