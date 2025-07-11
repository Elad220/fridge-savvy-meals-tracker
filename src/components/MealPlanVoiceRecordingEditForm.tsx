import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Calendar, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MealPlan, FOOD_UNITS } from '@/types';

interface MealPlanVoiceRecordingEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mealPlan: Omit<MealPlan, 'id' | 'userId'>) => void;
  analysisData: {
    meal: {
      name: string;
      plannedDate: string | null;
      destinationTime: string | null;
      notes: string;
    };
    ingredients: Array<{
      name: string;
      quantity: number;
      unit: string;
      notes: string;
    }>;
    preparationSteps: string[];
    confidence: string;
  };
}

interface EditableIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string;
}

interface EditableMealPlan {
  name: string;
  plannedDate: Date | null;
  destinationTime: Date | null;
  notes: string;
  ingredients: EditableIngredient[];
  preparationSteps: string[];
}

export const MealPlanVoiceRecordingEditForm = ({
  isOpen,
  onClose,
  onSubmit,
  analysisData,
}: MealPlanVoiceRecordingEditFormProps) => {
  const [mealPlan, setMealPlan] = useState<EditableMealPlan>({
    name: '',
    plannedDate: null,
    destinationTime: null,
    notes: '',
    ingredients: [],
    preparationSteps: []
  });

  useEffect(() => {
    if (analysisData) {
      // Parse dates from strings
      let plannedDate: Date | null = null;
      let destinationTime: Date | null = null;

      if (analysisData.meal.plannedDate) {
        plannedDate = new Date(analysisData.meal.plannedDate);
      }

      if (analysisData.meal.destinationTime) {
        // Parse time string (HH:MM format)
        const [hours, minutes] = analysisData.meal.destinationTime.split(':').map(Number);
        destinationTime = new Date();
        destinationTime.setHours(hours, minutes, 0, 0);
      }

      const editableIngredients: EditableIngredient[] = analysisData.ingredients.map((ingredient, index) => ({
        id: `ingredient-${index}`,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes
      }));

      setMealPlan({
        name: analysisData.meal.name,
        plannedDate,
        destinationTime,
        notes: analysisData.meal.notes,
        ingredients: editableIngredients,
        preparationSteps: [...analysisData.preparationSteps]
      });
    }
  }, [analysisData]);

  const updateMealPlan = (field: keyof EditableMealPlan, value: string | Date | null) => {
    setMealPlan(prev => ({ ...prev, [field]: value }));
  };

  const updateIngredient = (id: string, field: keyof EditableIngredient, value: string | number) => {
    setMealPlan(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(ingredient => 
        ingredient.id === id ? { ...ingredient, [field]: value } : ingredient
      )
    }));
  };

  const removeIngredient = (id: string) => {
    setMealPlan(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ingredient => ingredient.id !== id)
    }));
  };

  const addNewIngredient = () => {
    const newIngredient: EditableIngredient = {
      id: `ingredient-${Date.now()}`,
      name: '',
      quantity: 1,
      unit: 'item',
      notes: ''
    };
    setMealPlan(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
  };

  const updatePreparationStep = (index: number, value: string) => {
    setMealPlan(prev => ({
      ...prev,
      preparationSteps: prev.preparationSteps.map((step, i) => 
        i === index ? value : step
      )
    }));
  };

  const removePreparationStep = (index: number) => {
    setMealPlan(prev => ({
      ...prev,
      preparationSteps: prev.preparationSteps.filter((_, i) => i !== index)
    }));
  };

  const addPreparationStep = () => {
    setMealPlan(prev => ({
      ...prev,
      preparationSteps: [...prev.preparationSteps, '']
    }));
  };

  const handleSubmit = () => {
    if (!mealPlan.name.trim()) {
      toast({
        title: 'Missing meal name',
        description: 'Please enter a name for your meal plan.',
        variant: 'destructive',
      });
      return;
    }

    // Convert to MealPlan format
    const mealPlanData: Omit<MealPlan, 'id' | 'userId'> = {
      name: mealPlan.name.trim(),
      plannedDate: mealPlan.plannedDate,
      destinationTime: mealPlan.destinationTime,
      notes: mealPlan.notes.trim() || undefined
    };

    onSubmit(mealPlanData);
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const formatTimeForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toTimeString().slice(0, 5);
  };

  const handleDateChange = (value: string) => {
    const date = value ? new Date(value) : null;
    updateMealPlan('plannedDate', date);
  };

  const handleTimeChange = (value: string) => {
    if (!value) {
      updateMealPlan('destinationTime', null);
      return;
    }

    const [hours, minutes] = value.split(':').map(Number);
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);
    updateMealPlan('destinationTime', time);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle>Edit Meal Plan Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Meal Plan Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Meal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meal-name">Meal Name *</Label>
                <Input
                  id="meal-name"
                  value={mealPlan.name}
                  onChange={(e) => updateMealPlan('name', e.target.value)}
                  placeholder="Enter meal name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planned-date">Planned Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="planned-date"
                      type="date"
                      value={formatDateForInput(mealPlan.plannedDate)}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination-time">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="destination-time"
                      type="time"
                      value={formatTimeForInput(mealPlan.destinationTime)}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meal-notes">Notes</Label>
                <Textarea
                  id="meal-notes"
                  value={mealPlan.notes}
                  onChange={(e) => updateMealPlan('notes', e.target.value)}
                  placeholder="Add any notes about the meal..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mealPlan.ingredients.map((ingredient) => (
                <div key={ingredient.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label htmlFor={`ingredient-name-${ingredient.id}`}>Name</Label>
                    <Input
                      id={`ingredient-name-${ingredient.id}`}
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
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
                      onChange={(e) => updateIngredient(ingredient.id, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                                      <div className="col-span-2">
                      <Label htmlFor={`ingredient-unit-${ingredient.id}`}>Unit</Label>
                      <Select 
                        value={ingredient.unit} 
                        onValueChange={(value) => updateIngredient(ingredient.id, 'unit', value)}
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
                      onChange={(e) => updateIngredient(ingredient.id, 'notes', e.target.value)}
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredient(ingredient.id)}
                      className="w-full h-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addNewIngredient}
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
              {mealPlan.preparationSteps.map((step, index) => (
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

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Add Meal Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 