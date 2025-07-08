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

  // Check if recommendations should be generated based on time and inventory changes
  const shouldGenerateRecommendations = async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Get the most recent AI recommendations for this user
      const { data: recentRecommendations, error: recommendationsError } = await supabase
        .from('ai_recommendations')
        .select('generated_at')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(1);

      if (recommendationsError) {
        console.error('Error fetching recent recommendations:', recommendationsError);
        return true; // Generate if we can't check
      }

      // If no previous recommendations, generate them
      if (!recentRecommendations || recentRecommendations.length === 0) {
        return true;
      }

      const lastGeneratedAt = new Date(recentRecommendations[0].generated_at);
      const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);

      // If recommendations are older than 10 hours, generate new ones
      if (lastGeneratedAt < tenHoursAgo) {
        return true;
      }

      // Check if there have been any inventory changes since the last generation
      const { data: recentActions, error: actionsError } = await supabase
        .from('action_history')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', lastGeneratedAt.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (actionsError) {
        console.error('Error checking recent actions:', actionsError);
        return true; // Generate if we can't check
      }

      // If there have been inventory changes since last generation, generate new recommendations
      if (recentActions && recentActions.length > 0) {
        return true;
      }

      // No recent changes and recommendations are fresh, don't generate
      return false;
    } catch (error) {
      console.error('Error checking if recommendations should be generated:', error);
      return true; // Generate if we can't check
    }
  };

  // Generate AI-powered recommendations using the Edge Function
  const generateRecommendations = async () => {
    console.log('generateRecommendations called with userId:', userId);
    if (!userId || loading) {
      console.log('Early return - userId:', userId, 'loading:', loading);
      return;
    }

    // Check if we should generate recommendations
    const shouldGenerate = await shouldGenerateRecommendations();
    if (!shouldGenerate) {
      console.log('Skipping recommendation generation - recent recommendations available and no inventory changes');
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
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      const response = await fetch(`https://wwhqiddmkziladwfeggn.supabase.co/functions/v1/ai-recommendations`, {
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

      // Save the recommendations to cache
      try {
        await supabase.from('ai_recommendations').upsert({
          user_id: userId,
          recommendation_type: 'comprehensive',
          recommendations: newRecommendations,
          generated_at: newRecommendations.generatedAt.toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });
        console.log('Recommendations saved to cache');
      } catch (cacheError) {
        console.error('Error saving recommendations to cache:', cacheError);
      }
      
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

  // Load cached recommendations if available and recent
  const loadCachedRecommendations = async () => {
    if (!userId) return;

    try {
      const { data: cachedRecommendations, error } = await supabase
        .from('ai_recommendations')
        .select('recommendations, generated_at')
        .eq('user_id', userId)
        .eq('recommendation_type', 'comprehensive')
        .order('generated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading cached recommendations:', error);
        return;
      }

      if (cachedRecommendations && cachedRecommendations.length > 0) {
        const cached = cachedRecommendations[0];
        const generatedAt = new Date(cached.generated_at);
        const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);

        // If cached recommendations are recent, use them
        if (generatedAt > tenHoursAgo) {
          console.log('Loading cached recommendations from:', generatedAt);
          setRecommendations({
            ...cached.recommendations,
            generatedAt
          });
          return;
        }
      }

      // No recent cached recommendations, generate new ones
      generateRecommendations();
    } catch (error) {
      console.error('Error loading cached recommendations:', error);
      generateRecommendations();
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
    if (!userId) return;
    
    try {
      await supabase
        .from('ai_recommendations')
        .delete()
        .eq('user_id', userId);
      console.log('AI recommendations cache cleared');
      
      // Also clear the local state
      setRecommendations(null);
    } catch (error) {
      console.error('Error clearing AI recommendations cache:', error);
    }
  };

  // Clear cache when inventory changes are detected
  const clearCacheOnInventoryChange = async () => {
    if (!userId) return;
    
    try {
      // Clear the cache to force fresh recommendations
      await clearCache();
      console.log('Cache cleared due to inventory changes');
    } catch (error) {
      console.error('Error clearing cache on inventory change:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadCachedRecommendations();
    }
  }, [userId]);

  return {
    recommendations,
    loading,
    refreshRecommendations: generateRecommendations,
    updateConsumptionPattern,
    updateMealCombination,
    clearCache,
    clearCacheOnInventoryChange
  };
};