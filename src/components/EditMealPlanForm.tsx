import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { MealPlan, MealPlanIngredient, FOOD_UNITS } from '@/types';

interface EditMealPlanFormProps {
  item: MealPlan;
  onSubmit: (item: MealPlan) => void;
  onClose: () => void;
}

interface EditableMealPlanIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string;
}

export const EditMealPlanForm = ({ item, onSubmit, onClose }: EditMealPlanFormProps) => {
  const [formData, setFormData] = useState({
    name: item.name,
    plannedDate: item.plannedDate?.toISOString().split('T')[0] || '',
    destinationTime: item.destinationTime ? new Date(item.destinationTime).toTimeString().slice(0, 5) : '',
    notes: item.notes || '',
  });

  // Convert existing ingredients to editable format
  const [mealPlanIngredients, setMealPlanIngredients] = useState<EditableMealPlanIngredient[]>(() => {
    if (!item.ingredients) return [];
    return item.ingredients.map((ing, index) => ({
      id: `ingredient-${index}`,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      notes: ing.notes || ''
    }));
  });

  const [preparationSteps, setPreparationSteps] = useState<string[]>(() => {
    return item.preparationSteps || [];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [hours, minutes] = formData.destinationTime.split(':').map(Number);
    const destinationTime = new Date(formData.plannedDate || new Date());
    if (formData.destinationTime) {
      destinationTime.setHours(hours, minutes);
    }

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

    const updatedItem: MealPlan = {
      ...item,
      name: formData.name,
      plannedDate: formData.plannedDate ? new Date(formData.plannedDate) : undefined,
      destinationTime: formData.destinationTime ? destinationTime : undefined,
      notes: formData.notes || undefined,
      ingredients: ingredients.length > 0 ? ingredients : undefined,
      preparationSteps: steps.length > 0 ? steps : undefined,
    };

    onSubmit(updatedItem);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle>Edit Meal Plan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Meal Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Beef Tacos"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plannedDate">Planned Date (Optional)</Label>
              <Input
                id="plannedDate"
                type="date"
                value={formData.plannedDate}
                onChange={(e) => handleInputChange('plannedDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="destinationTime">Destination Time (Optional)</Label>
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
                <div key={ingredient.id} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <AmountInput
                      value={ingredient.quantity.toString()}
                      onChange={(value) => updateMealPlanIngredient(ingredient.id, 'quantity', parseFloat(value) || 0)}
                      placeholder="Amount"
                      min="0"
                      step="0.1"
                    />
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
                    <Input
                      id={`ingredient-name-${ingredient.id}`}
                      value={ingredient.name}
                      onChange={(e) => updateMealPlanIngredient(ingredient.id, 'name', e.target.value)}
                      placeholder="Ingredient name"
                    />
                  </div>
                  <Input
                    id={`ingredient-notes-${ingredient.id}`}
                    value={ingredient.notes}
                    onChange={(e) => updateMealPlanIngredient(ingredient.id, 'notes', e.target.value)}
                    placeholder="Notes (optional)"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMealPlanIngredient(ingredient.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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

          <div>
            <Label htmlFor="notes">Description (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional details about the meal..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              Update Meal Plan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};