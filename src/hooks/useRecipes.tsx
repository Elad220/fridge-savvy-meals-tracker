import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Recipe, CreateRecipeData } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useRecipes = (userId: string | undefined) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    if (!userId) {
      setRecipes([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const transformed: Recipe[] = data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: r.name as string,
        description: (r.description as string) || undefined,
        ingredients: (r.ingredients as Recipe['ingredients']) || [],
        instructions: (r.instructions as string[]) || [],
        prepTime: (r.prep_time as string) || undefined,
        cookTime: (r.cook_time as string) || undefined,
        servings: (r.servings as string) || undefined,
        difficulty: (r.difficulty as Recipe['difficulty']) || undefined,
        tags: (r.tags as string[]) || [],
        source: (r.source as Recipe['source']) || undefined,
        sourceMetadata: (r.source_metadata as Recipe['sourceMetadata']) || undefined,
        isFavorite: Boolean(r.is_favorite),
        createdAt: new Date(r.created_at as string),
        updatedAt: new Date(r.updated_at as string),
        userId: r.user_id as string,
      }));
      setRecipes(transformed);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error loading recipes',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addRecipe = async (recipe: CreateRecipeData) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          user_id: userId,
          name: recipe.name,
          description: recipe.description || null,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          prep_time: recipe.prepTime || null,
          cook_time: recipe.cookTime || null,
          servings: recipe.servings || null,
          difficulty: recipe.difficulty || null,
          tags: recipe.tags || [],
          source: recipe.source || 'manual',
          source_metadata: recipe.sourceMetadata || {},
        })
        .select()
        .single();
      if (error) throw error;
      const newRecipe: Recipe = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        ingredients: data.ingredients || [],
        instructions: data.instructions || [],
        prepTime: data.prep_time || undefined,
        cookTime: data.cook_time || undefined,
        servings: data.servings || undefined,
        difficulty: data.difficulty || undefined,
        tags: data.tags || [],
        source: data.source || undefined,
        sourceMetadata: data.source_metadata || undefined,
        isFavorite: data.is_favorite,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        userId: data.user_id,
      };
      setRecipes(prev => [newRecipe, ...prev]);
      toast({
        title: 'Recipe saved!',
        description: `${recipe.name} has been saved to your recipes.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error saving recipe',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const updateRecipe = async (updated: Recipe) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({
          name: updated.name,
          description: updated.description || null,
          ingredients: updated.ingredients,
          instructions: updated.instructions,
          prep_time: updated.prepTime || null,
          cook_time: updated.cookTime || null,
          servings: updated.servings || null,
          difficulty: updated.difficulty || null,
          tags: updated.tags || [],
          source: updated.source || 'manual',
          source_metadata: updated.sourceMetadata || {},
          is_favorite: updated.isFavorite,
        })
        .eq('id', updated.id);
      if (error) throw error;
      setRecipes(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      toast({
        title: 'Recipe updated',
        description: `${updated.name} has been updated.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error updating recipe',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const removeRecipe = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setRecipes(prev => prev.filter(r => r.id !== id));
      toast({
        title: 'Recipe removed',
        description: 'The recipe has been removed.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error removing recipe',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [userId]);

  return {
    recipes,
    loading,
    addRecipe,
    updateRecipe,
    removeRecipe,
    refetch: fetchRecipes,
  };
}; 