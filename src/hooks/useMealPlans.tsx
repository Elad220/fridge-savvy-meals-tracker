import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MealPlan } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useMealPlans = (userId: string | undefined) => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMealPlans = async () => {
    if (!userId) {
      setMealPlans([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .order('planned_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      const transformedPlans: MealPlan[] = data.map(plan => ({
        id: plan.id,
        name: plan.name,
        plannedDate: plan.planned_date ? new Date(plan.planned_date) : undefined,
        userId: plan.user_id,
      }));

      setMealPlans(transformedPlans);
    } catch (error: any) {
      toast({
        title: 'Error loading meal plans',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addMealPlan = async (plan: Omit<MealPlan, 'id' | 'userId'>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: userId,
          name: plan.name,
          planned_date: plan.plannedDate ? plan.plannedDate.toISOString().split('T')[0] : null,
        })
        .select()
        .single();

      if (error) throw error;

      const newPlan: MealPlan = {
        id: data.id,
        name: data.name,
        plannedDate: data.planned_date ? new Date(data.planned_date) : undefined,
        userId: data.user_id,
      };

      setMealPlans(prev => [...prev, newPlan]);
      
      toast({
        title: 'Meal plan added',
        description: `${plan.name} has been added to your meal plans.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error adding meal plan',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const removeMealPlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMealPlans(prev => prev.filter(plan => plan.id !== id));
      
      toast({
        title: 'Meal plan removed',
        description: 'The meal plan has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error removing meal plan',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchMealPlans();
  }, [userId]);

  return {
    mealPlans,
    loading,
    addMealPlan,
    removeMealPlan,
    refetch: fetchMealPlans,
  };
};
