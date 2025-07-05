import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ActionHistoryItem {
  id: string;
  actionType: 'add' | 'remove';
  itemName: string;
  itemDetails: any;
  createdAt: Date;
}

export const useActionHistory = (userId: string | undefined) => {
  const [recentActions, setRecentActions] = useState<ActionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentActions = async () => {
    if (!userId) {
      setRecentActions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('action_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const transformedActions: ActionHistoryItem[] = data.map(item => ({
        id: item.id,
        actionType: item.action_type as 'add' | 'remove',
        itemName: item.item_name,
        itemDetails: item.item_details,
        createdAt: new Date(item.created_at),
      }));

      setRecentActions(transformedActions);
    } catch (error: any) {
      console.error('Error loading action history:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (
    actionType: 'add' | 'remove',
    itemName: string,
    itemDetails?: any
  ) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('action_history')
        .insert({
          user_id: userId,
          action_type: actionType,
          item_name: itemName,
          item_details: itemDetails || null,
        });

      if (error) throw error;

      // Refresh the recent actions after logging
      fetchRecentActions();
    } catch (error: any) {
      console.error('Error logging action:', error.message);
    }
  };

  useEffect(() => {
    fetchRecentActions();
  }, [userId]);

  return {
    recentActions,
    loading,
    logAction,
    refetch: fetchRecentActions,
  };
};