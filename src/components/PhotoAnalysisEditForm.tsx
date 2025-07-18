import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AmountInput } from '@/components/ui/amount-input';
import { StorageLocationSelect } from '@/components/StorageLocationSelect';
import { TagInput } from '@/components/TagInput';
import { FoodItem, FOOD_UNITS } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useStorageLocations } from '@/hooks/useStorageLocations';

interface PhotoAnalysisEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<FoodItem, 'id' | 'userId'>) => void;
  analysisData: {
    suggested_name: string;
    item_type: 'cooked_meal' | 'raw_material';
    expiration_date: string | null;
    confidence: string;
    estimated_amount?: number;
    estimated_unit?: string;
  };
}

export const PhotoAnalysisEditForm = ({ isOpen, onClose, onSubmit, analysisData }: PhotoAnalysisEditFormProps) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate default eat by date based on analysis
  const getDefaultEatByDate = () => {
    if (analysisData.expiration_date && analysisData.item_type === 'raw_material') {
      return analysisData.expiration_date;
    }
    // For cooked meals, default to today + 4 days
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 4);
    return defaultDate.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: analysisData.suggested_name,
    dateCookedStored: today,
    eatByDate: getDefaultEatByDate(),
    amount: (analysisData.estimated_amount || 1).toString(),
    unit: analysisData.estimated_unit || 'serving',
    storageLocation: 'Fridge - Middle Shelf',
    label: analysisData.item_type === 'cooked_meal' ? 'cooked meal' : 'raw material',
    notes: `AI Analysis Confidence: ${analysisData.confidence}`,
    freshnessDays: '3',
  });

  // Tag management using TagInput component
  const [tags, setTags] = useState<string[]>([]);

  // Ingredients for cooked meals
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');

  const calculateEatByDate = (cookedDate: string, freshnessDays: number) => {
    const cooked = new Date(cookedDate);
    const eatBy = new Date(cooked);
    eatBy.setDate(eatBy.getDate() + freshnessDays);
    return eatBy.toISOString().split('T')[0];
  };

  const handleAddIngredient = () => {
    if (ingredientInput.trim() && !ingredients.includes(ingredientInput.trim())) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const handleIngredientKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number for the amount.',
        variant: 'destructive',
      });
      return;
    }
    
    const newItem: Omit<FoodItem, 'id' | 'userId'> = {
      name: formData.name,
      dateCookedStored: new Date(formData.dateCookedStored),
      eatByDate: new Date(formData.eatByDate),
      amount: amount,
      unit: formData.unit,
      storageLocation: formData.storageLocation,
      label: formData.label as 'cooked meal' | 'raw material',
      notes: formData.notes || undefined,
      tags: tags.length > 0 ? tags : undefined,
      freshnessDays: parseInt(formData.freshnessDays) || 3,
    };
    
    onSubmit(newItem);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-update eat by date when date cooked/stored or freshness days change
    if (field === 'dateCookedStored' || field === 'freshnessDays') {
      const cookedDate = field === 'dateCookedStored' ? value : formData.dateCookedStored;
      const freshnessDays = field === 'freshnessDays' ? parseInt(value) || 3 : parseInt(formData.freshnessDays) || 3;
      const eatByDate = calculateEatByDate(cookedDate, freshnessDays);
      setFormData(prev => ({ ...prev, eatByDate }));
    }
  };

  const { loading: locationsLoading } = useStorageLocations();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle>Review AI Analysis & Add Food Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Food Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Chicken Stir-fry"
              required
            />
          </div>

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
                placeholder="1"
                min="0.1"
                step="0.1"
                required
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
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
            <StorageLocationSelect
              value={formData.storageLocation}
              onValueChange={(value) => handleInputChange('storageLocation', value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="label">Type *</Label>
            <Select value={formData.label} onValueChange={(value) => handleInputChange('label', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw material">Raw Material</SelectItem>
                <SelectItem value="cooked meal">Cooked Meal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags using TagInput component */}
          <TagInput
            value={tags}
            onChange={setTags}
            category="food"
            placeholder="Add tag"
            label="Tags (Optional)"
          />

          {/* Ingredients for cooked meals */}
          {formData.label === 'cooked meal' && (
            <div>
              <Label htmlFor="ingredients">Ingredients (Optional)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="ingredients"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyPress={handleIngredientKeyPress}
                  placeholder="Add ingredient"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddIngredient}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground flex items-center gap-1">
                      {ingredient}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIngredient(ingredient)}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional details about the food..."
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={locationsLoading} className="flex-1 bg-green-600 hover:bg-green-700">
              {locationsLoading ? 'Loading...' : 'Add Food Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
