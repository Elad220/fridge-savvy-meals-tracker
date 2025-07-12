import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AmountInput } from '@/components/ui/amount-input';
import { X, Plus, Trash2, ChefHat } from 'lucide-react';
import { Recipe, CreateRecipeData, RecipeIngredient, FOOD_UNITS } from '@/types';
import { toast } from '@/hooks/use-toast';
import { TagInput } from '@/components/TagInput';

interface EditRecipeFormProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recipe: Recipe) => void;
}

interface EditableRecipeIngredient extends Omit<RecipeIngredient, 'quantity'> {
  quantity: string;
}

export const EditRecipeForm = ({ recipe, isOpen, onClose, onSubmit }: EditRecipeFormProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [ingredients, setIngredients] = useState<EditableRecipeIngredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [instructionInput, setInstructionInput] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: '' as 'Easy' | 'Medium' | 'Hard' | '',
  });

  // Initialize form data when recipe changes
  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name,
        description: recipe.description || '',
        prepTime: recipe.prepTime || '',
        cookTime: recipe.cookTime || '',
        servings: recipe.servings || '',
        difficulty: recipe.difficulty || '',
      });
      
      // Convert ingredients to editable format
      const editableIngredients: EditableRecipeIngredient[] = recipe.ingredients.map(ingredient => ({
        name: ingredient.name,
        quantity: ingredient.quantity.toString(),
        unit: ingredient.unit,
        notes: ingredient.notes || '',
      }));
      setIngredients(editableIngredients);
      
      setInstructions(recipe.instructions || []);
      setTags(recipe.tags || []);
    }
  }, [recipe]);

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      onClose();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    onClose();
  };

  const handleAddIngredient = () => {
    const newIngredient: EditableRecipeIngredient = {
      name: '',
      quantity: '1',
      unit: 'serving',
      notes: '',
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const handleUpdateIngredient = (index: number, field: keyof EditableRecipeIngredient, value: string) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setIngredients(updatedIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddInstruction = () => {
    if (instructionInput.trim()) {
      setInstructions([...instructions, instructionInput.trim()]);
      setInstructionInput('');
    }
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleInstructionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInstruction();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Recipe name required',
        description: 'Please enter a recipe name.',
        variant: 'destructive',
      });
      return;
    }

    if (ingredients.length === 0) {
      toast({
        title: 'Ingredients required',
        description: 'Please add at least one ingredient.',
        variant: 'destructive',
      });
      return;
    }

    if (instructions.length === 0) {
      toast({
        title: 'Instructions required',
        description: 'Please add at least one instruction.',
        variant: 'destructive',
      });
      return;
    }

    // Convert ingredients to proper format
    const recipeIngredients: RecipeIngredient[] = ingredients.map(ingredient => ({
      name: ingredient.name,
      quantity: parseFloat(ingredient.quantity) || 0,
      unit: ingredient.unit,
      notes: ingredient.notes || undefined,
    }));

    const updatedRecipe: Recipe = {
      ...recipe,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      ingredients: recipeIngredients,
      instructions,
      prepTime: formData.prepTime.trim() || undefined,
      cookTime: formData.cookTime.trim() || undefined,
      servings: formData.servings.trim() || undefined,
      difficulty: formData.difficulty || undefined,
      tags: tags.length > 0 ? tags : [],
      updatedAt: new Date(),
    };

    onSubmit(updatedRecipe);
    handleCloseDialog();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Edit Recipe: {recipe.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Recipe Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter recipe name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the recipe"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prepTime">Prep Time</Label>
                  <Input
                    id="prepTime"
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                    placeholder="e.g., 15 minutes"
                  />
                </div>
                <div>
                  <Label htmlFor="cookTime">Cook Time</Label>
                  <Input
                    id="cookTime"
                    value={formData.cookTime}
                    onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                    placeholder="e.g., 30 minutes"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    placeholder="e.g., 4 servings"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value as 'Easy' | 'Medium' | 'Hard' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Ingredients
                <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ingredient
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Label>Ingredient Name</Label>
                    <Input
                      value={ingredient.name}
                      onChange={(e) => handleUpdateIngredient(index, 'name', e.target.value)}
                      placeholder="e.g., flour"
                    />
                  </div>
                  <div className="w-24">
                    <Label>Amount</Label>
                    <AmountInput
                      value={ingredient.quantity}
                      onChange={(value) => handleUpdateIngredient(index, 'quantity', value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="w-32">
                    <Label>Unit</Label>
                    <Select value={ingredient.unit} onValueChange={(value) => handleUpdateIngredient(index, 'unit', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FOOD_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Notes (optional)</Label>
                    <Input
                      value={ingredient.notes}
                      onChange={(e) => handleUpdateIngredient(index, 'notes', e.target.value)}
                      placeholder="e.g., finely chopped"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveIngredient(index)}
                    className="mt-6"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Label>Step {index + 1}</Label>
                    <Textarea
                      value={instruction}
                      onChange={(e) => {
                        const updatedInstructions = [...instructions];
                        updatedInstructions[index] = e.target.value;
                        setInstructions(updatedInstructions);
                      }}
                      placeholder="Enter instruction step"
                      rows={2}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInstruction(index)}
                    className="mt-6"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Input
                  value={instructionInput}
                  onChange={(e) => setInstructionInput(e.target.value)}
                  onKeyPress={handleInstructionKeyPress}
                  placeholder="Add new instruction step"
                />
                <Button type="button" variant="outline" onClick={handleAddInstruction}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <TagInput
                tags={tags}
                onTagsChange={setTags}
                placeholder="Add recipe tags..."
                category="recipe"
                maxTags={10}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button type="submit">
              Update Recipe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 