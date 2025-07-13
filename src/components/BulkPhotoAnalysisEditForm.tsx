import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FoodItem, FOOD_UNITS } from '@/types';
import { StorageLocationSelect } from './StorageLocationSelect';
import { AmountInput } from '@/components/ui/amount-input';
import { TagInput } from '@/components/TagInput';

interface BulkPhotoAnalysisEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: Omit<FoodItem, 'id' | 'userId'>[]) => void;
  analysisData: {
    items: Array<{
      suggested_name: string;
      item_type: 'cooked_meal' | 'raw_material';
      estimated_amount: number;
      estimated_unit: string;
      expiration_date?: string | null;
      confidence?: string;
    }>;
    confidence: string;
  };
}

interface EditableItem {
  id: string;
  name: string;
  itemType: 'cooked_meal' | 'raw_material';
  quantity: number;
  unit: string;
  freshnessDays: number;
  storageLocation: string;
  notes: string;
  dateCookedStored: string;
  eatByDate: string;
  tags: string[];
}

export const BulkPhotoAnalysisEditForm = ({ isOpen, onClose, onSubmit, analysisData }: BulkPhotoAnalysisEditFormProps) => {
  const [items, setItems] = useState<EditableItem[]>([]);

  useEffect(() => {
    if (analysisData && analysisData.items) {
      const today = new Date().toISOString().split('T')[0];
      const eatByDate = new Date();
      eatByDate.setDate(eatByDate.getDate() + 4);
      
      const editableItems: EditableItem[] = analysisData.items.map((item, index) => ({
        id: `bulk-item-${index}`,
        name: item.suggested_name,
        itemType: item.item_type,
        quantity: item.estimated_amount || 1,
        unit: item.estimated_unit || 'item',
        freshnessDays: 4,
        storageLocation: 'Fridge - Middle Shelf',
        notes: `AI Analysis Confidence: ${item.confidence || analysisData.confidence}`,
        dateCookedStored: today,
        eatByDate: eatByDate.toISOString().split('T')[0],
        tags: [],
      }));
      
      setItems(editableItems);
    }
  }, [analysisData]);

  const updateItem = (itemId: string, field: keyof EditableItem, value: string | number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addNewItem = () => {
    const today = new Date().toISOString().split('T')[0];
    const eatByDate = new Date();
    eatByDate.setDate(eatByDate.getDate() + 4);
    
    const newItem: EditableItem = {
      id: `photo-item-${Date.now()}`,
      name: '',
      itemType: 'raw_material',
      quantity: 1,
      unit: 'item',
      freshnessDays: 4,
      storageLocation: 'Fridge - Middle Shelf',
      notes: 'Manually added',
      dateCookedStored: today,
      eatByDate: eatByDate.toISOString().split('T')[0],
      tags: [],
    };
    setItems(prev => [...prev, newItem]);
  };

  // Tag management functions using TagInput component
  const updateItemTags = (itemId: string, tags: string[]) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, tags } : item
    ));
  };

  const handleSubmit = () => {
    const validItems = items.filter(item => item.name.trim());
    
    if (validItems.length === 0) {
      toast({
        title: 'No valid items',
        description: 'Please add at least one item with a name.',
        variant: 'destructive',
      });
      return;
    }

    const foodItems: Omit<FoodItem, 'id' | 'userId'>[] = validItems.map(item => ({
      name: item.name.trim(),
      dateCookedStored: new Date(item.dateCookedStored),
      eatByDate: new Date(item.eatByDate),
      amount: item.quantity,
      unit: item.unit,
      storageLocation: item.storageLocation,
      label: item.itemType === 'cooked_meal' ? 'cooked meal' : 'raw material',
      notes: item.notes,
      freshnessDays: item.freshnessDays,
      tags: item.tags.length > 0 ? item.tags : undefined,
    }));

    onSubmit(foodItems);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle>Review Photo Analysis Items</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Review and edit the items detected from your photos. You can modify any details or add/remove items as needed.
          </div>
          
          {items.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">No items detected. Add some manually.</div>
              <Button onClick={addNewItem} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Item name"
                        className="text-lg font-semibold border-none p-0 shadow-none"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`type-${item.id}`}>Type</Label>
                        <Select 
                          value={item.itemType} 
                          onValueChange={(value) => updateItem(item.id, 'itemType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="raw_material">Raw Material</SelectItem>
                            <SelectItem value="cooked_meal">Cooked Meal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`storage-${item.id}`}>Storage Location</Label>
                        <StorageLocationSelect
                          value={item.storageLocation}
                          onValueChange={(value) => updateItem(item.id, 'storageLocation', value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`quantity-${item.id}`}>Amount</Label>
                        <AmountInput
                          value={item.quantity.toString()}
                          onChange={(value) => updateItem(item.id, 'quantity', parseFloat(value) || 0)}
                          placeholder="1"
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`unit-${item.id}`}>Unit</Label>
                        <Select 
                          value={item.unit} 
                          onValueChange={(value) => updateItem(item.id, 'unit', value)}
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
                      
                      <div>
                        <Label htmlFor={`freshness-${item.id}`}>Fresh for (days)</Label>
                        <Input
                          id={`freshness-${item.id}`}
                          type="number"
                          min="1"
                          max="365"
                          value={item.freshnessDays.toString()}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            updateItem(item.id, 'freshnessDays', isNaN(value) ? 3 : value);
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`date-cooked-${item.id}`}>Date Cooked/Stored</Label>
                        <Input
                          id={`date-cooked-${item.id}`}
                          type="date"
                          value={item.dateCookedStored}
                          onChange={(e) => updateItem(item.id, 'dateCookedStored', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`eat-by-${item.id}`}>Eat By Date</Label>
                        <Input
                          id={`eat-by-${item.id}`}
                          type="date"
                          value={item.eatByDate}
                          onChange={(e) => updateItem(item.id, 'eatByDate', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`notes-${item.id}`}>Notes</Label>
                      <Textarea
                        id={`notes-${item.id}`}
                        value={item.notes}
                        onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                        placeholder="Additional details..."
                        rows={2}
                      />
                    </div>

                    {/* Tags using TagInput component */}
                    <TagInput
                      value={item.tags}
                      onChange={(tags) => updateItemTags(item.id, tags)}
                      category="food"
                      placeholder="Add tag"
                      label="Tags (Optional)"
                    />
                  </CardContent>
                </Card>
              ))}
              
              <Button onClick={addNewItem} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Another Item
              </Button>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={items.length === 0}>
              Add All Items
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 