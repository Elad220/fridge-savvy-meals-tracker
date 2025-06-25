import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MealPlan } from '@/types';

interface EditMealPlanFormProps {
  item: MealPlan;
  onSubmit: (item: MealPlan) => void;
  onClose: () => void;
}

export const EditMealPlanForm = ({ item, onSubmit, onClose }: EditMealPlanFormProps) => {
  const [formData, setFormData] = useState({
    name: item.name,
    plannedDate: item.plannedDate?.toISOString().split('T')[0] || '',
    destinationTime: item.destinationTime ? new Date(item.destinationTime).toTimeString().slice(0, 5) : '',
    notes: item.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [hours, minutes] = formData.destinationTime.split(':').map(Number);
    const destinationTime = new Date(formData.plannedDate || new Date());
    if (formData.destinationTime) {
      destinationTime.setHours(hours, minutes);
    }

    const updatedItem: MealPlan = {
      ...item,
      name: formData.name,
      plannedDate: formData.plannedDate ? new Date(formData.plannedDate) : undefined,
      destinationTime: formData.destinationTime ? destinationTime : undefined,
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
          <DialogTitle>Edit Meal Plan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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