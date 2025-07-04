import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChefHat, Clock, Star, Utensils, Plus } from 'lucide-react';
import { FoodItem, MealPlan } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useApiTokens } from '@/hooks/useApiTokens';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Recipe {
  name: string;
  description: string;
  ingredients: string[];
  cookingTime: string;
  difficulty: string;
}

interface RecipeGeneratorProps {
  foodItems: FoodItem[];
  onAddMealPlan?: (meal: Omit<MealPlan, 'id' | 'userId'>) => void;
  onNavigateToSettings: () => void;
}

export const RecipeGenerator = ({ foodItems, onAddMealPlan, onNavigateToSettings }: RecipeGeneratorProps) => {
  const { user } = useAuth();
  const { hasGeminiToken, loading: tokenLoading } = useApiTokens();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleIngredientToggle = (ingredient: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const generateRecipes = async () => {
    if (!user || selectedIngredients.length === 0) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recipes', {
        body: {
          ingredients: selectedIngredients,
          userId: user.id,
        },
      });

      if (error) throw error;

      setRecipes(data.recipes || []);
      toast({
        title: 'Recipes generated!',
        description: `Found ${data.recipes?.length || 0} recipes for your ingredients.`,
      });
    } catch (error: any) {
      console.error('Error generating recipes:', error);
      toast({
        title: 'Error generating recipes',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getRecipeDetails = async (recipe: Recipe) => {
    if (!user) return;

    setSelectedRecipe(recipe);
    setIsLoadingDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-recipe-details', {
        body: {
          recipeName: recipe.name,
          ingredients: recipe.ingredients,
          userId: user.id,
        },
      });

      if (error) throw error;

      setRecipeDetails(data);
    } catch (error: any) {
      console.error('Error loading recipe details:', error);
      toast({
        title: 'Error loading recipe details',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const addRecipeToMealPlan = () => {
    if (!selectedRecipe || !onAddMealPlan) return;

    const newMealPlan: Omit<MealPlan, 'id' | 'userId'> = {
      name: selectedRecipe.name,
      notes: `Generated recipe: ${selectedRecipe.description}\n\nIngredients: ${selectedRecipe.ingredients.join(', ')}\n\nDifficulty: ${selectedRecipe.difficulty}\nCooking Time: ${selectedRecipe.cookingTime}`,
    };

    onAddMealPlan(newMealPlan);
    
    toast({
      title: 'Recipe added to meal plan!',
      description: `${selectedRecipe.name} has been added to your meal plans.`,
    });

    setIsOpen(false);
    setSelectedRecipe(null);
    setRecipeDetails(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400';
    }
  };

  const uniqueIngredients = [...new Set(foodItems.map(item => item.name))];

  const renderContent = () => {
    if (tokenLoading) {
      return (
        <Button 
          disabled 
          variant="outline"
          className="w-full border-purple-300 text-purple-400 dark:border-purple-700 dark:text-purple-500 cursor-not-allowed"
        >
          <div className="flex items-center justify-center w-full">
            <ChefHat className="w-4 h-4 mr-2 animate-pulse" />
            Loading...
          </div>
        </Button>
      );
    }

    if (!hasGeminiToken) {
      return (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-sm text-orange-700 dark:text-orange-400">
            Add your Gemini API token in the{' '}
            <button onClick={onNavigateToSettings} className="font-bold underline hover:text-orange-800 dark:hover:text-orange-300">
              settings page
            </button>{' '}
            to generate recipes from your ingredients.
          </p>
        </div>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto border-purple-500 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-950/30">
            <ChefHat className="w-4 h-4 mr-2" />
            Generate Recipes
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Recipes</DialogTitle>
          </DialogHeader>

          {!selectedRecipe ? (
            <div className="space-y-6">
              {uniqueIngredients.length === 0 ? (
                <p className="text-muted-foreground">No ingredients available. Add some food items first.</p>
              ) : (
                <>
                  <div>
                    <h4 className="font-medium mb-3">Select ingredients:</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {uniqueIngredients.map(ingredient => (
                        <div key={ingredient} className="flex items-center space-x-2">
                          <Checkbox
                            id={ingredient}
                            checked={selectedIngredients.includes(ingredient)}
                            onCheckedChange={() => handleIngredientToggle(ingredient)}
                          />
                          <label htmlFor={ingredient} className="text-sm cursor-pointer">
                            {ingredient}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={generateRecipes}
                    disabled={selectedIngredients.length === 0 || isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? 'Generating...' : `Generate Recipes (${selectedIngredients.length} ingredients)`}
                  </Button>

                  {recipes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Generated Recipes:</h4>
                      {recipes.map((recipe, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer" onClick={() => getRecipeDetails(recipe)}>
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium">{recipe.name}</h5>
                            <div className="flex gap-2">
                              <Badge className={getDifficultyColor(recipe.difficulty)}>
                                {recipe.difficulty}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {recipe.cookingTime}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{recipe.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {recipe.ingredients.map((ing, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {ing}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedRecipe(null)}>
                    ← Back to Recipes
                  </Button>
                  <h4 className="font-medium">{selectedRecipe.name}</h4>
                </div>
                {onAddMealPlan && (
                  <Button 
                    onClick={addRecipeToMealPlan}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Meal Plan
                  </Button>
                )}
              </div>

              {isLoadingDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading recipe details...</p>
                </div>
              ) : recipeDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Prep Time</div>
                      <div className="font-medium">{recipeDetails.prepTime}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Cook Time</div>
                      <div className="font-medium">{recipeDetails.cookTime}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Servings</div>
                      <div className="font-medium">{recipeDetails.servings}</div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      Ingredients
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {recipeDetails.ingredients?.map((ingredient: string, index: number) => (
                        <li key={index}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Instructions</h5>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      {recipeDetails.instructions?.map((step: string, index: number) => (
                        <li key={index} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </div>

                  {recipeDetails.tips && recipeDetails.tips.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Tips
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {recipeDetails.tips.map((tip: string, index: number) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Recipe Generator</h2>
          <p className="text-sm text-muted-foreground">Generate recipes from your ingredients</p>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};