import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StorageLocationSelect } from '@/components/StorageLocationSelect';
import { FoodItem, FOOD_UNITS } from '@/types';
import { toast } from '@/components/ui/use-toast';

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

  const calculateEatByDate = (cookedDate: string, freshnessDays: number) => {
    const cooked = new Date(cookedDate);
    const eatBy = new Date(cooked);
    eatBy.setDate(eatBy.getDate() + freshnessDays);
    return eatBy.toISOString().split('T')[0];
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
    
    const newItem: Omit<FoodItem, 'id' | 'userId'> = {
      name: formData.name,
      dateCookedStored: new Date(formData.dateCookedStored),
      eatByDate: new Date(formData.eatByDate),
      amount: amount,
      unit: formData.unit,
      storageLocation: formData.storageLocation,
      label: formData.label as 'cooked meal' | 'raw material',
      notes: formData.notes || undefined,
      freshnessDays: parseInt(formData.freshnessDays) || 3,
    };
    
    onSubmit(newItem);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate eat by date when cooked date or freshness days change
      // But only for cooked meals, not raw materials with specific expiration dates
      if ((field === 'dateCookedStored' || field === 'freshnessDays') && 
          (analysisData.item_type === 'cooked_meal' || !analysisData.expiration_date)) {
        const freshnessDays = parseInt(field === 'freshnessDays' ? value : prev.freshnessDays) || 4;
        const cookedDate = field === 'dateCookedStored' ? value : prev.dateCookedStored;
        updated.eatByDate = calculateEatByDate(cookedDate, freshnessDays);
      }
      
      return updated;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review AI Analysis & Add Item</DialogTitle>
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
            {analysisData.expiration_date && (
              <p className="text-xs text-muted-foreground mt-1">
                AI detected expiration: {analysisData.expiration_date}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
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

          <div>
            <Label htmlFor="notes">Notes</Label>
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
              Add to Inventory
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
