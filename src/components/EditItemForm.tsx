
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FoodItem } from '@/types';

interface EditItemFormProps {
  item: FoodItem;
  onSubmit: (item: FoodItem) => void;
  onClose: () => void;
}

export const EditItemForm = ({ item, onSubmit, onClose }: EditItemFormProps) => {
  const [formData, setFormData] = useState({
    name: item.name,
    dateCookedStored: item.dateCookedStored.toISOString().split('T')[0],
    eatByDate: item.eatByDate.toISOString().split('T')[0],
    quantity: item.quantity,
    storageLocation: item.storageLocation,
    notes: item.notes || '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedItem: FoodItem = {
      ...item,
      name: formData.name,
      dateCookedStored: new Date(formData.dateCookedStored),
      eatByDate: new Date(formData.eatByDate),
      quantity: formData.quantity,
      storageLocation: formData.storageLocation,
      notes: formData.notes || undefined,
    };
    
    onSubmit(updatedItem);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Food Item</DialogTitle>
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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              Update Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
