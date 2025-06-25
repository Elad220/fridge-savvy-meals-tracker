
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useFoodItems = (userId: string | undefined) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFoodItems = async () => {
    if (!userId) {
      setFoodItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('user_id', userId)
        .order('eat_by_date', { ascending: true });

      if (error) throw error;

      const transformedItems: FoodItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        dateCookedStored: new Date(item.date_cooked_stored),
        eatByDate: new Date(item.eat_by_date),
        quantity: item.quantity,
        storageLocation: item.storage_location,
        notes: item.notes || undefined,
        userId: item.user_id,
      }));

      setFoodItems(transformedItems);
    } catch (error: any) {
      toast({
        title: 'Error loading food items',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addFoodItem = async (item: Omit<FoodItem, 'id' | 'userId'>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('food_items')
        .insert({
          user_id: userId,
          name: item.name,
          date_cooked_stored: item.dateCookedStored.toISOString().split('T')[0],
          eat_by_date: item.eatByDate.toISOString().split('T')[0],
          quantity: item.quantity,
          storage_location: item.storageLocation,
          notes: item.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: FoodItem = {
        id: data.id,
        name: data.name,
        dateCookedStored: new Date(data.date_cooked_stored),
        eatByDate: new Date(data.eat_by_date),
        quantity: data.quantity,
        storageLocation: data.storage_location,
        notes: data.notes || undefined,
        userId: data.user_id,
      };

      setFoodItems(prev => [...prev, newItem]);
      
      toast({
        title: 'Food item added',
        description: `${item.name} has been added to your inventory.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error adding food item',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateFoodItem = async (updatedItem: FoodItem) => {
    try {
      const { error } = await supabase
        .from('food_items')
        .update({
          name: updatedItem.name,
          date_cooked_stored: updatedItem.dateCookedStored.toISOString().split('T')[0],
          eat_by_date: updatedItem.eatByDate.toISOString().split('T')[0],
          quantity: updatedItem.quantity,
          storage_location: updatedItem.storageLocation,
          notes: updatedItem.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedItem.id);

      if (error) throw error;

      setFoodItems(prev => prev.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));

      toast({
        title: 'Food item updated',
        description: `${updatedItem.name} has been updated.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error updating food item',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const removeFoodItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFoodItems(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: 'Food item removed',
        description: 'The item has been removed from your inventory.',
      });
    } catch (error: any) {
      toast({
        title: 'Error removing food item',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, [userId]);

  return {
    foodItems,
    loading,
    addFoodItem,
    updateFoodItem,
    removeFoodItem,
    refetch: fetchFoodItems,
  };
};
