import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserAction, UserActionStats, UserActionPattern, UserActionType, EntityType } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useUserActions = (userId: string | undefined) => {
  const [recentActions, setRecentActions] = useState<UserAction[]>([]);
  const [actionStats, setActionStats] = useState<UserActionStats[]>([]);
  const [actionPatterns, setActionPatterns] = useState<UserActionPattern[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to log a user action
  const logUserAction = async (
    actionType: UserActionType,
    entityType: EntityType,
    entityId: string,
    entityName: string,
    entityData?: Record<string, any>,
    actionContext?: Record<string, any>
  ) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase.rpc('log_user_action', {
        p_action_type: actionType,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_entity_name: entityName,
        p_entity_data: entityData || null,
        p_action_context: actionContext || null,
      });

      if (error) throw error;

      // Refresh recent actions after logging
      await fetchRecentActions();
      
      return data;
    } catch (error: any) {
      console.error('Error logging user action:', error);
      toast({
        title: 'Action tracking failed',
        description: 'Failed to log user action for analytics',
        variant: 'destructive',
      });
    }
  };

  // Function to fetch recent user actions
  const fetchRecentActions = async (limit: number = 50) => {
    if (!userId) {
      setRecentActions([]);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_recent_user_actions', {
        p_user_id: userId,
        p_limit: limit,
      });

      if (error) throw error;

      const transformedActions: UserAction[] = data.map((action: any) => ({
        id: action.id,
        userId: userId,
        actionType: action.action_type as UserActionType,
        entityType: action.entity_type as EntityType,
        entityId: action.entity_id,
        entityName: action.entity_name,
        entityData: action.entity_data,
        actionContext: action.action_context,
        createdAt: new Date(action.created_at),
      }));

      setRecentActions(transformedActions);
    } catch (error: any) {
      console.error('Error fetching recent actions:', error);
    }
  };

  // Function to fetch action statistics
  const fetchActionStats = async (daysBack: number = 30) => {
    if (!userId) {
      setActionStats([]);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_action_stats', {
        p_user_id: userId,
        p_days_back: daysBack,
      });

      if (error) throw error;

      const transformedStats: UserActionStats[] = data.map((stat: any) => ({
        actionType: stat.action_type as UserActionType,
        entityType: stat.entity_type as EntityType,
        actionCount: parseInt(stat.action_count),
        mostRecentAction: new Date(stat.most_recent_action),
      }));

      setActionStats(transformedStats);
    } catch (error: any) {
      console.error('Error fetching action stats:', error);
    }
  };

  // Function to fetch action patterns for predictions
  const fetchActionPatterns = async (daysBack: number = 90) => {
    if (!userId) {
      setActionPatterns([]);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_action_patterns', {
        p_user_id: userId,
        p_days_back: daysBack,
      });

      if (error) throw error;

      const transformedPatterns: UserActionPattern[] = data.map((pattern: any) => ({
        entityName: pattern.entity_name,
        actionType: pattern.action_type as UserActionType,
        actionCount: parseInt(pattern.action_count),
        avgDaysBetweenActions: pattern.avg_days_between_actions ? parseFloat(pattern.avg_days_between_actions) : undefined,
        mostCommonStorageLocation: pattern.most_common_storage_location,
        mostCommonLabel: pattern.most_common_label,
        avgFreshnessDays: pattern.avg_freshness_days ? parseFloat(pattern.avg_freshness_days) : undefined,
      }));

      setActionPatterns(transformedPatterns);
    } catch (error: any) {
      console.error('Error fetching action patterns:', error);
    }
  };

  // Function to get suggestions based on action patterns
  const getSuggestions = () => {
    const suggestions: string[] = [];
    
    actionPatterns.forEach((pattern) => {
      if (pattern.actionType === 'add' && pattern.actionCount >= 3) {
        if (pattern.avgDaysBetweenActions && pattern.avgDaysBetweenActions > 0) {
          suggestions.push(
            `You add "${pattern.entityName}" every ${Math.round(pattern.avgDaysBetweenActions)} days on average. Consider adding it to your meal plan.`
          );
        }
        
        if (pattern.mostCommonStorageLocation) {
          suggestions.push(
            `You usually store "${pattern.entityName}" in ${pattern.mostCommonStorageLocation}.`
          );
        }
        
        if (pattern.avgFreshnessDays && pattern.avgFreshnessDays > 0) {
          suggestions.push(
            `"${pattern.entityName}" typically stays fresh for ${Math.round(pattern.avgFreshnessDays)} days based on your usage.`
          );
        }
      }
    });

    return suggestions;
  };

  // Function to get frequently added items
  const getFrequentlyAddedItems = () => {
    return actionPatterns
      .filter(pattern => pattern.actionType === 'add')
      .sort((a, b) => b.actionCount - a.actionCount)
      .slice(0, 10);
  };

  // Function to get items that are frequently removed (wasted)
  const getFrequentlyWastedItems = () => {
    return actionPatterns
      .filter(pattern => pattern.actionType === 'remove')
      .sort((a, b) => b.actionCount - a.actionCount)
      .slice(0, 10);
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([
        fetchRecentActions(),
        fetchActionStats(),
        fetchActionPatterns(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [userId]);

  return {
    recentActions,
    actionStats,
    actionPatterns,
    loading,
    logUserAction,
    fetchRecentActions,
    fetchActionStats,
    fetchActionPatterns,
    getSuggestions,
    getFrequentlyAddedItems,
    getFrequentlyWastedItems,
  };
};