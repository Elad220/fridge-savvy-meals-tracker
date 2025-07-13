import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AmountInput } from '@/components/ui/amount-input';
import { StorageLocationSelect } from '@/components/StorageLocationSelect';
import { TagInput } from '@/components/TagInput';
import { FoodItem, MealPlan, MealPlanIngredient, FOOD_UNITS } from '@/types';
import { X, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

interface AddItemFormRefactoredProps {
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

// Form field configurations
const inventoryFields = [
  {
    name: 'name',
    label: 'Food Name',
    type: 'text' as const,
    required: true,
    placeholder: 'e.g., Chicken Stir-fry',
  },
  {
    name: 'dateCookedStored',
    label: 'Date Cooked/Stored',
    type: 'date' as const,
    required: true,
  },
  {
    name: 'freshnessDays',
    label: 'Fresh for (days)',
    type: 'number' as const,
    required: true,
    validation: (value: string) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 365) {
        return 'Freshness days must be between 1 and 365';
      }
      return null;
    },
  },
  {
    name: 'eatByDate',
    label: 'Eat By Date',
    type: 'date' as const,
    required: true,
  },
  {
    name: 'amount',
    label: 'Amount',
    type: 'amount' as const,
    required: true,
    validation: (value: string) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return 'Amount must be a positive number';
      }
      return null;
    },
  },
  {
    name: 'unit',
    label: 'Unit',
    type: 'select' as const,
    required: true,
    options: FOOD_UNITS.map(unit => ({ value: unit, label: unit })),
  },
  {
    name: 'label',
    label: 'Food Type',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'raw material', label: 'Raw Material' },
      { value: 'cooked meal', label: 'Cooked Meal' },
    ],
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea' as const,
    placeholder: 'Additional notes about the food item',
  },
];

const mealPlanFields = [
  {
    name: 'name',
    label: 'Meal Name',
    type: 'text' as const,
    required: true,
    placeholder: 'e.g., Dinner',
  },
  {
    name: 'plannedDate',
    label: 'Planned Date',
    type: 'date' as const,
    required: true,
  },
  {
    name: 'destinationTime',
    label: 'Time',
    type: 'text' as const,
    required: true,
    placeholder: '12:30',
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea' as const,
    placeholder: 'Additional notes about the meal',
  },
];

export const AddItemFormRefactored = ({ 
  type, 
  onSubmit, 
  onClose, 
  onMealCombinationUpdate 
}: AddItemFormRefactoredProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  // Meal plan specific state
  const [mealPlanIngredients, setMealPlanIngredients] = useState<EditableMealPlanIngredient[]>([]);
  const [preparationSteps, setPreparationSteps] = useState<string[]>([]);
  
  const calculateEatByDate = (cookedDate: string, freshnessDays: number) => {
    const cooked = new Date(cookedDate);
    const eatBy = new Date(cooked);
    eatBy.setDate(eatBy.getDate() + freshnessDays);
    return eatBy.toISOString().split('T')[0];
  };

  const today = new Date().toISOString().split('T')[0];
  const defaultFreshnessDays = 3;
  const eatByDate = calculateEatByDate(today, defaultFreshnessDays);

  const [formData, setFormData] = useState({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate eat by date when cooked date or freshness days change
      if (type === 'inventory' && (field === 'dateCookedStored' || field === 'freshnessDays')) {
        const freshnessDays = parseInt(field === 'freshnessDays' ? value : prev.freshnessDays) || 4;
        const cookedDate = field === 'dateCookedStored' ? value : prev.dateCookedStored;
        updated.eatByDate = calculateEatByDate(cookedDate, freshnessDays);
      }
      
      return updated;
    });

    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fields = type === 'inventory' ? inventoryFields : mealPlanFields;

    fields.forEach(field => {
      const value = formData[field.name];
      
      // Required field validation
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }

      // Custom validation
      if (field.validation) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Ingredient management
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

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

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
          tags: tags.length > 0 ? tags : undefined,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    onClose();
  };

  const renderField = (field: typeof inventoryFields[0]) => {
    const value = formData[field.name];
    const error = errors[field.name];

    const commonProps = {
      id: field.name,
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleInputChange(field.name, e.target.value),
      placeholder: field.placeholder,
      required: field.required,
      className: error ? 'border-red-500' : '',
    };

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Textarea {...commonProps} />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Select 
              value={value} 
              onValueChange={(val) => handleInputChange(field.name, val)}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'amount':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <AmountInput
              id={field.name}
              value={value}
              onChange={(val) => handleInputChange(field.name, val)}
              placeholder={field.placeholder}
              required={field.required}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input {...commonProps} type={field.type} />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
    }
  };

  const fields = type === 'inventory' ? inventoryFields : mealPlanFields;

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle>
            Add {type === 'inventory' ? 'Food Item' : 'Meal Plan'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map(field => renderField(field))}
              
              {/* Custom field for storage location (inventory only) */}
              {type === 'inventory' && (
                <div>
                  <StorageLocationSelect
                    value={formData.storageLocation}
                    onValueChange={(value) => handleInputChange('storageLocation', value)}
                    required
                  />
                </div>
              )}

              {/* Custom field for tags (inventory only) */}
              {type === 'inventory' && (
                <div>
                  <TagInput
                    value={tags}
                    onChange={setTags}
                    placeholder="Add tags..."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ingredients section (inventory only) */}
          {type === 'inventory' && (
            <Card>
              <CardHeader>
                <CardTitle>Ingredients (for cooked meals)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyPress={handleIngredientKeyPress}
                    placeholder="Add ingredient..."
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddIngredient} disabled={!ingredientInput.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((ingredient, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {ingredient}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIngredient(ingredient)}
                          className="h-4 w-4 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Meal plan ingredients section */}
          {type === 'meals' && (
            <Card>
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mealPlanIngredients.map((ingredient, index) => (
                  <div key={ingredient.id} className="flex gap-2 items-center">
                    <Input
                      value={ingredient.name}
                      onChange={(e) => updateMealPlanIngredient(ingredient.id, 'name', e.target.value)}
                      placeholder="Ingredient name"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={ingredient.quantity}
                      onChange={(e) => updateMealPlanIngredient(ingredient.id, 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="Qty"
                      className="w-20"
                    />
                    <Select 
                      value={ingredient.unit} 
                      onValueChange={(value) => updateMealPlanIngredient(ingredient.id, 'unit', value)}
                    >
                      <SelectTrigger className="w-24">
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
                    <Input
                      value={ingredient.notes}
                      onChange={(e) => updateMealPlanIngredient(ingredient.id, 'notes', e.target.value)}
                      placeholder="Notes"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMealPlanIngredient(ingredient.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <Button type="button" onClick={addMealPlanIngredient} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ingredient
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Preparation steps section (meals only) */}
          {type === 'meals' && (
            <Card>
              <CardHeader>
                <CardTitle>Preparation Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {preparationSteps.map((step, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-sm font-medium w-8">{index + 1}.</span>
                    <Input
                      value={step}
                      onChange={(e) => updatePreparationStep(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePreparationStep(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <Button type="button" onClick={addPreparationStep} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Form actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : `Save ${type === 'inventory' ? 'Item' : 'Meal'}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};