
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FoodItem, MealPlan } from '@/types';
import { X } from 'lucide-react';

interface AddItemFormProps {
  type: 'inventory' | 'meals';
  onSubmit: (item: any) => void;
  onClose: () => void;
}

export const AddItemForm = ({ type, onSubmit, onClose }: AddItemFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    dateCookedStored: new Date().toISOString().split('T')[0],
    eatByDate: '',
    quantity: '',
    storageLocation: '',
    notes: '',
    plannedDate: ''
  });

  const storageLocations = [
    'Fridge - Top Shelf',
    'Fridge - Middle Shelf',
    'Fridge - Bottom Shelf',
    'Fridge - Crisper Drawer',
    'Freezer - Top',
    'Freezer - Bottom',
    'Pantry',
    'Counter',
    'Other'
  ];

  const calculateEatByDate = (cookedDate: string, foodType: string) => {
    const cooked = new Date(cookedDate);
    const daysToAdd = foodType.toLowerCase().includes('rice') ? 3 :
                     foodType.toLowerCase().includes('meat') || foodType.toLowerCase().includes('chicken') ? 3 :
                     foodType.toLowerCase().includes('vegetable') ? 4 :
                     foodType.toLowerCase().includes('soup') ? 3 : 4;
    
    const eatBy = new Date(cooked);
    eatBy.setDate(eatBy.getDate() + daysToAdd);
    return eatBy.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'inventory') {
      const eatByDate = formData.eatByDate || calculateEatByDate(formData.dateCookedStored, formData.name);
      
      const foodItem: Omit<FoodItem, 'id' | 'userId'> = {
        name: formData.name,
        dateCookedStored: new Date(formData.dateCookedStored),
        eatByDate: new Date(eatByDate),
        quantity: formData.quantity,
        storageLocation: formData.storageLocation,
        notes: formData.notes || undefined,
      };
      
      onSubmit(foodItem);
    } else {
      const mealPlan: Omit<MealPlan, 'id' | 'userId'> = {
        name: formData.name,
        plannedDate: formData.plannedDate ? new Date(formData.plannedDate) : undefined,
      };
      
      onSubmit(mealPlan);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate eat by date when name or cooked date changes
      if (type === 'inventory' && (field === 'name' || field === 'dateCookedStored') && !prev.eatByDate) {
        updated.eatByDate = calculateEatByDate(
          field === 'dateCookedStored' ? value : prev.dateCookedStored,
          field === 'name' ? value : prev.name
        );
      }
      
      return updated;
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {type === 'inventory' ? 'Add Food Item' : 'Add Meal Plan'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="eatByDate">Eat By Date *</Label>
                  <Input
                    id="eatByDate"
                    type="date"
                    value={formData.eatByDate}
                    onChange={(e) => handleInputChange('eatByDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="e.g., 2 servings, Half a pot, Small container"
                  required
                />
              </div>

              <div>
                <Label htmlFor="storageLocation">Storage Location *</Label>
                <Select value={formData.storageLocation} onValueChange={(value) => handleInputChange('storageLocation', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage location" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="plannedDate">Planned Date (Optional)</Label>
              <Input
                id="plannedDate"
                type="date"
                value={formData.plannedDate}
                onChange={(e) => handleInputChange('plannedDate', e.target.value)}
              />
            </div>
          )}

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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              {type === 'inventory' ? 'Add Food Item' : 'Add Meal Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
