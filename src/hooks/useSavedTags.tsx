import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type SavedTag = Tables<'saved_tags'>;
export type SavedTagInsert = TablesInsert<'saved_tags'>;
export type SavedTagUpdate = TablesUpdate<'saved_tags'>;

export type TagCategory = 'general' | 'food' | 'recipe' | 'meal';

interface UseSavedTagsOptions {
  category?: TagCategory;
  includeFavorites?: boolean;
}

export const useSavedTags = (options: UseSavedTagsOptions = {}) => {
  const { user } = useAuth();
  const [savedTags, setSavedTags] = useState<SavedTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedTags = useCallback(async () => {
    if (!user) {
      setSavedTags([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('saved_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (options.category) {
        query = query.eq('tag_category', options.category);
      }

      if (options.includeFavorites) {
        query = query.eq('is_favorite', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setSavedTags(data || []);
    } catch (err) {
      console.error('Error fetching saved tags:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch saved tags');
    } finally {
      setLoading(false);
    }
  }, [user, options.category, options.includeFavorites]);

  const addSavedTag = useCallback(async (tagName: string, category: TagCategory = 'general') => {
    if (!user) return;

    try {
      setError(null);

      // Check if tag already exists
      const { data: existingTag } = await supabase
        .from('saved_tags')
        .select('*')
        .eq('user_id', user.id)
        .eq('tag_name', tagName)
        .eq('tag_category', category)
        .single();

      if (existingTag) {
        // Update usage count
        const { error: updateError } = await supabase
          .from('saved_tags')
          .update({ 
            usage_count: existingTag.usage_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingTag.id);

        if (updateError) throw updateError;
      } else {
        // Insert new tag
        const { error: insertError } = await supabase
          .from('saved_tags')
          .insert({
            user_id: user.id,
            tag_name: tagName,
            tag_category: category,
            usage_count: 1,
            is_favorite: false
          });

        if (insertError) throw insertError;
      }

      // Refresh the list
      await fetchSavedTags();
    } catch (err) {
      console.error('Error adding saved tag:', err);
      setError(err instanceof Error ? err.message : 'Failed to add saved tag');
    }
  }, [user, fetchSavedTags]);

  const updateSavedTag = useCallback(async (id: string, updates: Partial<SavedTagUpdate>) => {
    if (!user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('saved_tags')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh the list
      await fetchSavedTags();
    } catch (err) {
      console.error('Error updating saved tag:', err);
      setError(err instanceof Error ? err.message : 'Failed to update saved tag');
    }
  }, [user, fetchSavedTags]);

  const deleteSavedTag = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('saved_tags')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh the list
      await fetchSavedTags();
    } catch (err) {
      console.error('Error deleting saved tag:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete saved tag');
    }
  }, [user, fetchSavedTags]);

  const toggleFavorite = useCallback(async (id: string) => {
    const tag = savedTags.find(t => t.id === id);
    if (!tag) return;

    await updateSavedTag(id, { is_favorite: !tag.is_favorite });
  }, [savedTags, updateSavedTag]);

  const getPopularTags = useCallback((limit: number = 10) => {
    return savedTags
      .filter(tag => !options.category || tag.tag_category === options.category)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  }, [savedTags, options.category]);

  const getFavoriteTags = useCallback(() => {
    return savedTags.filter(tag => tag.is_favorite);
  }, [savedTags]);

  // Fetch tags on mount and when dependencies change
  useEffect(() => {
    fetchSavedTags();
  }, [fetchSavedTags]);

  return {
    savedTags,
    loading,
    error,
    addSavedTag,
    updateSavedTag,
    deleteSavedTag,
    toggleFavorite,
    getPopularTags,
    getFavoriteTags,
    refresh: fetchSavedTags
  };
};