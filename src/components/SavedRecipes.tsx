import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bookmark, 
  Clock, 
  Star, 
  Utensils, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Heart,
  ChefHat,
  Calendar,
  Plus
} from 'lucide-react';
import { Recipe, CreateRecipeData } from '@/types';
import { useRecipes } from '@/hooks/useRecipes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { EditMealPlanForm } from '@/components/EditMealPlanForm';
import { MealPlan, MealPlanIngredient } from '@/types';
import { AddRecipeForm } from '@/components/AddRecipeForm';
import { EditRecipeForm } from '@/components/EditRecipeForm';

interface SavedRecipesProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMealPlan: (meal: Omit<MealPlan, 'id' | 'userId'>) => void;
}

export const SavedRecipes = ({ isOpen, onClose, onAddMealPlan }: SavedRecipesProps) => {
  const { user } = useAuth();
  const { recipes, loading, updateRecipe, removeRecipe, addRecipe, refetch } = useRecipes(user?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCookModal, setShowCookModal] = useState(false);
  const [mealPlanDraft, setMealPlanDraft] = useState<Omit<MealPlan, 'id' | 'userId'> | null>(null);
  const [showAddRecipeForm, setShowAddRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDifficulty = difficultyFilter === 'all' || recipe.difficulty === difficultyFilter;
    const matchesSource = sourceFilter === 'all' || recipe.source === sourceFilter;
    
    return matchesSearch && matchesDifficulty && matchesSource;
  });

  const handleToggleFavorite = async (recipe: Recipe) => {
    try {
      await updateRecipe({
        ...recipe,
        isFavorite: !recipe.isFavorite,
      });
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    if (confirm(`Are you sure you want to delete "${recipe.name}"?`)) {
      try {
        await removeRecipe(recipe.id);
        toast({
          title: 'Recipe deleted',
          description: `${recipe.name} has been removed from your collection.`,
        });
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
  };

  const handleCook = (recipe: Recipe) => {
    // Convert recipe ingredients to MealPlanIngredient format
    const ingredients: MealPlanIngredient[] = recipe.ingredients.map(ingredient => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: ingredient.notes || undefined,
    }));
    const mealPlan: Omit<MealPlan, 'id' | 'userId'> = {
      name: recipe.name,
      notes: recipe.description,
      ingredients,
      preparationSteps: recipe.instructions || [],
    };
    setMealPlanDraft(mealPlan);
    setShowCookModal(true);
  };

  const handleCookSubmit = (mealPlan: MealPlan) => {
    // Remove id and userId if present
    const { id, userId, ...rest } = mealPlan;
    onAddMealPlan(rest);
    setShowCookModal(false);
    setMealPlanDraft(null);
    toast({
      title: 'Meal plan created!',
      description: `${mealPlan.name} has been added to your meal plans.`,
    });
  };

  const handleAddRecipe = async (recipeData: CreateRecipeData) => {
    try {
      await addRecipe(recipeData);
      setShowAddRecipeForm(false);
      toast({
        title: 'Recipe added!',
        description: `${recipeData.name} has been added to your recipe collection.`,
      });
    } catch (error) {
      console.error('Error adding recipe:', error);
      toast({
        title: 'Error adding recipe',
        description: 'Failed to add recipe. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditRecipe = async (updatedRecipe: Recipe) => {
    try {
      await updateRecipe(updatedRecipe);
      setEditingRecipe(null);
      toast({
        title: 'Recipe updated!',
        description: `${updatedRecipe.name} has been updated.`,
      });
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast({
        title: 'Error updating recipe',
        description: 'Failed to update recipe. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'manual': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400';
      case 'generated': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400';
      case 'imported': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saved Recipes</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your recipes...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            Saved Recipes ({recipes.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="imported">Imported</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowAddRecipeForm(true)}
              className="sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Recipe
            </Button>
          </div>

          {/* Recipe List */}
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No recipes found</h3>
              <p className="text-muted-foreground">
                {recipes.length === 0 
                  ? "You haven't saved any recipes yet. Generate some recipes to get started!"
                  : "No recipes match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                    recipe.isFavorite ? 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{recipe.name}</h4>
                        {recipe.isFavorite && (
                          <Heart className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                        {recipe.source === 'generated' && (
                          <ChefHat className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                      {recipe.description && (
                        <p className="text-sm text-muted-foreground mb-2">{recipe.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {recipe.difficulty && (
                          <Badge className={getDifficultyColor(recipe.difficulty)}>
                            {recipe.difficulty}
                          </Badge>
                        )}
                        {recipe.source && (
                          <Badge className={getSourceColor(recipe.source)}>
                            {recipe.source}
                          </Badge>
                        )}
                        {recipe.prepTime && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Prep: {recipe.prepTime}
                          </Badge>
                        )}
                        {recipe.cookTime && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Cook: {recipe.cookTime}
                          </Badge>
                        )}
                        {recipe.servings && (
                          <Badge variant="outline" className="text-xs">
                            <Utensils className="w-3 h-3 mr-1" />
                            {recipe.servings} servings
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(recipe)}
                        className="h-8 w-8 p-0"
                      >
                        <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRecipe(recipe)}
                        className="h-8 w-8 p-0"
                      >
                        <Star className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRecipe(recipe)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRecipe(recipe)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCook(recipe)}>
                        <ChefHat className="w-4 h-4 mr-1" /> Cook
                      </Button>
                    </div>
                  </div>
                  
                  {/* Ingredients Preview */}
                  {recipe.ingredients.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Utensils className="w-4 h-4" />
                        Ingredients ({recipe.ingredients.length})
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {recipe.ingredients.slice(0, 5).map((ingredient, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {ingredient.quantity} {ingredient.unit} {ingredient.name}
                          </Badge>
                        ))}
                        {recipe.ingredients.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{recipe.ingredients.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {recipe.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recipe Details Dialog */}
        {selectedRecipe && (
          <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedRecipe.name}
                  {selectedRecipe.isFavorite && (
                    <Heart className="w-5 h-5 text-yellow-500 fill-current" />
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedRecipe.description && (
                  <p className="text-muted-foreground">{selectedRecipe.description}</p>
                )}

                {/* Recipe Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  {selectedRecipe.prepTime && (
                    <div>
                      <div className="text-sm text-muted-foreground">Prep Time</div>
                      <div className="font-medium">{selectedRecipe.prepTime}</div>
                    </div>
                  )}
                  {selectedRecipe.cookTime && (
                    <div>
                      <div className="text-sm text-muted-foreground">Cook Time</div>
                      <div className="font-medium">{selectedRecipe.cookTime}</div>
                    </div>
                  )}
                  {selectedRecipe.servings && (
                    <div>
                      <div className="text-sm text-muted-foreground">Servings</div>
                      <div className="font-medium">{selectedRecipe.servings}</div>
                    </div>
                  )}
                  {selectedRecipe.difficulty && (
                    <div>
                      <div className="text-sm text-muted-foreground">Difficulty</div>
                      <div className="font-medium">{selectedRecipe.difficulty}</div>
                    </div>
                  )}
                </div>

                {/* Ingredients */}
                {selectedRecipe.ingredients.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      Ingredients
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <li key={index}>
                          {ingredient.quantity} {ingredient.unit} {ingredient.name}
                          {ingredient.notes && ` - ${ingredient.notes}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Instructions */}
                {selectedRecipe.instructions.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Instructions</h5>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      {selectedRecipe.instructions.map((step, index) => (
                        <li key={index} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Tags */}
                {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Tags</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedRecipe.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source Info */}
                {selectedRecipe.source && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Source:</span> {selectedRecipe.source}
                    {selectedRecipe.sourceMetadata && (
                      <div className="mt-1 text-xs">
                        {selectedRecipe.sourceMetadata.generatedAt && (
                          <div>Generated: {new Date(selectedRecipe.sourceMetadata.generatedAt as string).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
      {showCookModal && mealPlanDraft && (
        <EditMealPlanForm
          item={{ ...mealPlanDraft, id: '', userId: '' }}
          onSubmit={handleCookSubmit}
          onClose={() => { setShowCookModal(false); setMealPlanDraft(null); }}
        />
      )}

      {/* Add Recipe Form */}
      {showAddRecipeForm && (
        <AddRecipeForm
          isOpen={showAddRecipeForm}
          onClose={() => setShowAddRecipeForm(false)}
          onSubmit={handleAddRecipe}
        />
      )}

      {/* Edit Recipe Form */}
      {editingRecipe && (
        <EditRecipeForm
          recipe={editingRecipe}
          isOpen={!!editingRecipe}
          onClose={() => setEditingRecipe(null)}
          onSubmit={handleEditRecipe}
        />
      )}
    </Dialog>
  );
}; 