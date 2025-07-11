import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AmountInput } from '@/components/ui/amount-input';
import { StorageLocationSelect } from '@/components/StorageLocationSelect';
import { FoodItem, MealPlan, MealPlanIngredient, FOOD_UNITS } from '@/types';
import { X, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AddItemFormProps {
  type: 'inventory' | 'meals';
  onSubmit: (item: Omit<FoodItem, 'id' | 'userId'> | Omit<MealPlan, 'id' | 'userId'>) => void;
  onClose: () => void;
  onMealCombinationUpdate?: (mealName: string, ingredients: string[]) => void;
}

interface EditableMealPlanIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string;
}

export const AddItemForm = ({ type, onSubmit, onClose, onMealCombinationUpdate }: AddItemFormProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  
  // Meal plan specific state
  const [mealPlanIngredients, setMealPlanIngredients] = useState<EditableMealPlanIngredient[]>([]);
  const [preparationSteps, setPreparationSteps] = useState<string[]>([]);
  
  const calculateEatByDate = (cookedDate: string, freshnessDays: number) => {
    const cooked = new Date(cookedDate);
    const eatBy = new Date(cooked);
    eatBy.setDate(eatBy.getDate() + freshnessDays);
    return eatBy.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const defaultFreshnessDays = 3;
    const eatByDate = calculateEatByDate(today, defaultFreshnessDays);
    
    return {
      name: '',
      dateCookedStored: today,
      eatByDate: eatByDate,
      amount: '1',
      unit: 'serving',
      storageLocation: '',
      label: 'raw material' as const,
      notes: '',
      plannedDate: today,
      destinationTime: '12:30',
      freshnessDays: defaultFreshnessDays.toString()
    };
  });

  const handleAddIngredient = () => {
    if (ingredientInput.trim() && !ingredients.includes(ingredientInput.trim())) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const handleIngredientKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  // Meal plan ingredient management
  const addMealPlanIngredient = () => {
    const newIngredient: EditableMealPlanIngredient = {
      id: `ingredient-${Date.now()}`,
      name: '',
      quantity: 1,
      unit: 'item',
      notes: ''
    };
    setMealPlanIngredients(prev => [...prev, newIngredient]);
  };

  const updateMealPlanIngredient = (id: string, field: keyof EditableMealPlanIngredient, value: string | number) => {
    setMealPlanIngredients(prev => prev.map(ingredient => 
      ingredient.id === id ? { ...ingredient, [field]: value } : ingredient
    ));
  };

  const removeMealPlanIngredient = (id: string) => {
    setMealPlanIngredients(prev => prev.filter(ingredient => ingredient.id !== id));
  };

  // Preparation steps management
  const addPreparationStep = () => {
    setPreparationSteps(prev => [...prev, '']);
  };

  const updatePreparationStep = (index: number, value: string) => {
    setPreparationSteps(prev => prev.map((step, i) => 
      i === index ? value : step
    ));
  };

  const removePreparationStep = (index: number) => {
    setPreparationSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (type === 'inventory') {
        const freshnessDays = parseInt(formData.freshnessDays) || 4;
        const eatByDate = formData.eatByDate || calculateEatByDate(formData.dateCookedStored, freshnessDays);
        const amount = parseFloat(formData.amount);
        
        if (isNaN(amount) || amount <= 0) {
          toast({
            title: 'Invalid Amount',
            description: 'Please enter a valid positive number for the amount.',
            variant: 'destructive',
          });
          return;
        }

        const foodItem: Omit<FoodItem, 'id' | 'userId'> = {
          name: formData.name,
          dateCookedStored: new Date(formData.dateCookedStored),
          eatByDate: new Date(eatByDate),
          amount: amount,
          unit: formData.unit,
          storageLocation: formData.storageLocation,
          label: formData.label,
          notes: formData.notes || undefined,
          freshnessDays: freshnessDays,
        };

        await onSubmit(foodItem);
        
        // Track meal combination for cooked meals
        if (formData.label === 'cooked meal' && ingredients.length > 0 && onMealCombinationUpdate) {
          onMealCombinationUpdate(formData.name, ingredients);
        }
      } else {
        // Convert editable ingredients to MealPlanIngredient format
        const ingredients: MealPlanIngredient[] = mealPlanIngredients
          .filter(ing => ing.name.trim())
          .map(ing => ({
            name: ing.name.trim(),
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes.trim() || undefined,
          }));

        // Filter out empty preparation steps
        const steps = preparationSteps.filter(step => step.trim());

        const mealPlan: Omit<MealPlan, 'id' | 'userId'> = {
          name: formData.name,
          plannedDate: formData.plannedDate ? new Date(formData.plannedDate) : undefined,
          destinationTime: formData.destinationTime ? new Date(`${formData.plannedDate}T${formData.destinationTime}`) : undefined,
          notes: formData.notes || undefined,
          ingredients: ingredients.length > 0 ? ingredients : undefined,
          preparationSteps: steps.length > 0 ? steps : undefined,
        };

        await onSubmit(mealPlan);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to save item. Please try again.',
        variant: 'destructive',
      });
    }
  };

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if (type === 'inventory' && (field === 'dateCookedStored' || field === 'freshnessDays')) {
        const freshnessDays = parseInt(field === 'freshnessDays' ? value : prev.freshnessDays) || 4;
        const cookedDate = field === 'dateCookedStored' ? value : prev.dateCookedStored;
        updated.eatByDate = calculateEatByDate(cookedDate, freshnessDays);
      }

      return updated;
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle>
            {type === 'inventory' ? 'Add Food Item' : 'Add Meal Plan'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">
              {type === 'inventory' ? 'Food Name' : 'Meal Name'} *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={type === 'inventory' ? 'e.g., Chicken Stir-fry' : 'e.g., Beef Tacos'}
              required
            />
          </div>

          {type === 'inventory' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateCookedStored">Date Cooked/Stored *</Label>
                  <Input
                    id="dateCookedStored"
                    type="date"
                    value={formData.dateCookedStored}
                    onChange={(e) => handleInputChange('dateCookedStored', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="freshnessDays">Fresh for (days) *</Label>
                  <Input
                    id="freshnessDays"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.freshnessDays}
                    onChange={(e) => handleInputChange('freshnessDays', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="eatByDate">Eat By Date *</Label>
                <Input
                  id="eatByDate"
                  type="date"
                  value={formData.eatByDate}
                  onChange={(e) => handleInputChange('eatByDate', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <AmountInput
                    id="amount"
                    value={formData.amount}
                    onChange={(value) => handleInputChange('amount', value)}
                    placeholder="e.g., 2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Select 
                    value={formData.unit} 
                    onValueChange={(value) => handleInputChange('unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
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
              </div>

              <div>
                <Label htmlFor="label">Food Type *</Label>
                <Select 
                  value={formData.label} 
                  onValueChange={(value: 'cooked meal' | 'raw material') => handleInputChange('label', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select food type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw material">Raw Material</SelectItem>
                    <SelectItem value="cooked meal">Cooked Meal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.label === 'cooked meal' && (
                <div>
                  <Label htmlFor="ingredients">Ingredients (Optional)</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="ingredients"
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        onKeyPress={handleIngredientKeyPress}
                        placeholder="Add an ingredient..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddIngredient}
                        disabled={!ingredientInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    {ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ingredients.map((ingredient, index) => (
                          <Badge key={index} variant="secondary" className="pr-1">
                            {ingredient}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => handleRemoveIngredient(ingredient)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <StorageLocationSelect
                value={formData.storageLocation}
                onValueChange={(value) => handleInputChange('storageLocation', value)}
                required
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plannedDate">Planned Date</Label>
                  <Input
                    id="plannedDate"
                    type="date"
                    value={formData.plannedDate}
                    onChange={(e) => handleInputChange('plannedDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="destinationTime">Time</Label>
                  <Input
                    id="destinationTime"
                    type="time"
                    value={formData.destinationTime}
                    onChange={(e) => handleInputChange('destinationTime', e.target.value)}
                  />
                </div>
              </div>

              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <CardTitle>Ingredients</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mealPlanIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Label htmlFor={`ingredient-name-${ingredient.id}`}>Name</Label>
                        <Input
                          id={`ingredient-name-${ingredient.id}`}
                          value={ingredient.name}
                          onChange={(e) => updateMealPlanIngredient(ingredient.id, 'name', e.target.value)}
                          placeholder="Ingredient name"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`ingredient-quantity-${ingredient.id}`}>Qty</Label>
                        <Input
                          id={`ingredient-quantity-${ingredient.id}`}
                          type="number"
                          min="0"
                          step="0.1"
                          value={ingredient.quantity}
                          onChange={(e) => updateMealPlanIngredient(ingredient.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`ingredient-unit-${ingredient.id}`}>Unit</Label>
                        <Select 
                          value={ingredient.unit} 
                          onValueChange={(value) => updateMealPlanIngredient(ingredient.id, 'unit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
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
                      <div className="col-span-3">
                        <Label htmlFor={`ingredient-notes-${ingredient.id}`}>Notes</Label>
                        <Input
                          id={`ingredient-notes-${ingredient.id}`}
                          value={ingredient.notes}
                          onChange={(e) => updateMealPlanIngredient(ingredient.id, 'notes', e.target.value)}
                          placeholder="Optional notes"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMealPlanIngredient(ingredient.id)}
                          className="w-full h-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={addMealPlanIngredient}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Ingredient
                  </Button>
                </CardContent>
              </Card>

              {/* Preparation Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Preparation Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {preparationSteps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`step-${index}`}>Step {index + 1}</Label>
                        <Textarea
                          id={`step-${index}`}
                          value={step}
                          onChange={(e) => updatePreparationStep(index, e.target.value)}
                          placeholder={`Step ${index + 1} description`}
                          rows={2}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePreparationStep(index)}
                          className="h-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={addPreparationStep}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Preparation Step
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">
                {type === 'inventory' ? 'Notes (Optional)' : 'Description (Optional)'}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={type === 'inventory' ? 'Additional details about the food...' : 'Additional details about the meal...'}
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                {type === 'inventory' ? 'Add Food Item' : 'Add Meal Plan'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemForm;