import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AmountInput } from '@/components/ui/amount-input';
import { StorageLocationSelect } from '@/components/StorageLocationSelect';
import { FoodItem, FOOD_UNITS, MealPlanIngredient } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useStorageLocations } from '@/hooks/useStorageLocations';

interface MoveToInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<FoodItem, 'id' | 'userId'>) => void;
  initialData: {
    name: string;
    notes?: string;
    plannedDate?: Date;
    ingredients?: MealPlanIngredient[];
  };
}

export const MoveToInventoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: MoveToInventoryModalProps) => {

  const calculateEatByDate = (cookedDate: string, freshnessDays: number) => {
    const cooked = new Date(cookedDate);
    const eatBy = new Date(cooked);
    eatBy.setDate(eatBy.getDate() + freshnessDays);
    return eatBy.toISOString().split('T')[0];
  };

  const today = new Date().toISOString().split('T')[0];
  const defaultFreshnessDays = 3;
  const defaultEatByDate = calculateEatByDate(today, defaultFreshnessDays);
  
  const [formData, setFormData] = useState({
    name: initialData.name,
    dateCookedStored: today,
    eatByDate: defaultEatByDate,
    amount: '1',
    unit: 'serving',
    storageLocation: '',
    label: 'cooked meal' as const,
    notes: initialData.notes ? `From meal plan: ${initialData.notes}` : '',
    freshnessDays: defaultFreshnessDays.toString()
  });

  const { loading: locationsLoading } = useStorageLocations();

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData.name,
        dateCookedStored: today,
        eatByDate: defaultEatByDate,
        amount: '1',
        unit: 'serving',
        storageLocation: '',
        label: 'cooked meal' as const,
        notes: initialData.notes ? `From meal plan: ${initialData.notes}` : '',
        freshnessDays: defaultFreshnessDays.toString()
      });
    }
  }, [isOpen, initialData.name, initialData.notes]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'dateCookedStored' || field === 'freshnessDays') {
        const freshnessDays = parseInt(field === 'freshnessDays' ? value : prev.freshnessDays) || 4;
        const cookedDate = field === 'dateCookedStored' ? value : prev.dateCookedStored;
        updated.eatByDate = calculateEatByDate(cookedDate, freshnessDays);
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    
    const foodItem: Omit<FoodItem, 'id' | 'userId'> = {
      name: formData.name,
      dateCookedStored: new Date(formData.dateCookedStored),
      eatByDate: new Date(formData.eatByDate),
      amount: amount,
      unit: formData.unit,
      storageLocation: formData.storageLocation,
      label: formData.label,
      notes: formData.notes || undefined,
      freshnessDays: parseInt(formData.freshnessDays) || 4,
    };

    onSubmit(foodItem);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle>Add to Inventory</DialogTitle>
        </DialogHeader>

        {/* Show ingredients that will be consumed */}
        {initialData.ingredients && initialData.ingredients.length > 0 && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Ingredients to be consumed from inventory:</strong>
              <ul className="mt-2 space-y-1">
                {initialData.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-sm">
                    • {ingredient.name} ({ingredient.quantity} {ingredient.unit})
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

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

          <StorageLocationSelect
            value={formData.storageLocation}
            onValueChange={(value) => handleInputChange('storageLocation', value)}
            required
          />

          <div className="space-y-4">
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
              <Button type="submit" disabled={locationsLoading}>
                {locationsLoading ? 'Loading...' : 'Move to Inventory'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
