import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FoodItem } from '@/types';

interface MoveToInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<FoodItem, 'id' | 'userId'>) => void;
  initialData: {
    name: string;
    notes?: string;
    plannedDate?: Date;
  };
}

export const MoveToInventoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: MoveToInventoryModalProps) => {
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
    quantity: '1',
    storageLocation: '',
    label: 'cooked meal' as const,
    notes: initialData.notes ? `From meal plan: ${initialData.notes}` : '',
    freshnessDays: defaultFreshnessDays.toString()
  });

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
    
    const foodItem: Omit<FoodItem, 'id' | 'userId'> = {
      name: formData.name,
      dateCookedStored: new Date(formData.dateCookedStored),
      eatByDate: new Date(formData.eatByDate),
      quantity: formData.quantity,
      storageLocation: formData.storageLocation,
      label: formData.label,
      notes: formData.notes || undefined,
      freshnessDays: parseInt(formData.freshnessDays) || 4,
    };

    onSubmit(foodItem);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Inventory</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                max="30"
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

          <div>
            <Label htmlFor="storageLocation">Storage Location *</Label>
            <Select 
              value={formData.storageLocation} 
              onValueChange={(value) => handleInputChange('storageLocation', value)}
            >
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
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                Add to Inventory
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
