import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem, FoodItemLabel } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useUserActions } from '@/hooks/useUserActions';

export const useFoodItems = (userId: string | undefined) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { logUserAction } = useUserActions(userId);

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
        label: (item.label || 'raw material') as FoodItemLabel, // Type assertion to FoodItemLabel
        notes: item.notes || undefined,
        userId: item.user_id,
        freshnessDays: item.freshness_days || 4, // Default to 4 if not set
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
          label: item.label,
          notes: item.notes || null,
          freshness_days: item.freshnessDays || 4,
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
        label: data.label as FoodItemLabel, // Type assertion to FoodItemLabel
        notes: data.notes || undefined,
        userId: data.user_id,
        freshnessDays: data.freshness_days || 4,
      };

      setFoodItems(prev => [...prev, newItem]);
      
      // Log the action for tracking
      await logUserAction(
        'add',
        'food_item',
        newItem.id,
        newItem.name,
        {
          quantity: newItem.quantity,
          storageLocation: newItem.storageLocation,
          label: newItem.label,
          freshnessDays: newItem.freshnessDays,
          dateCookedStored: newItem.dateCookedStored.toISOString(),
          eatByDate: newItem.eatByDate.toISOString(),
        },
        { source: 'manual_add' }
      );
      
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
          label: updatedItem.label,
          notes: updatedItem.notes || null,
          freshness_days: updatedItem.freshnessDays || 4,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedItem.id);

      if (error) throw error;

      setFoodItems(prev => prev.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));

      // Log the action for tracking
      await logUserAction(
        'update',
        'food_item',
        updatedItem.id,
        updatedItem.name,
        {
          quantity: updatedItem.quantity,
          storageLocation: updatedItem.storageLocation,
          label: updatedItem.label,
          freshnessDays: updatedItem.freshnessDays,
          dateCookedStored: updatedItem.dateCookedStored.toISOString(),
          eatByDate: updatedItem.eatByDate.toISOString(),
        },
        { source: 'manual_update' }
      );

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
      // Get the item data before removing for logging
      const itemToRemove = foodItems.find(item => item.id === id);
      
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFoodItems(prev => prev.filter(item => item.id !== id));
      
      // Log the action for tracking
      if (itemToRemove) {
        await logUserAction(
          'remove',
          'food_item',
          itemToRemove.id,
          itemToRemove.name,
          {
            quantity: itemToRemove.quantity,
            storageLocation: itemToRemove.storageLocation,
            label: itemToRemove.label,
            freshnessDays: itemToRemove.freshnessDays,
            dateCookedStored: itemToRemove.dateCookedStored.toISOString(),
            eatByDate: itemToRemove.eatByDate.toISOString(),
          },
          { source: 'manual_remove' }
        );
      }
      
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
