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

interface VoiceRecordingEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: Omit<FoodItem, 'id' | 'userId'>[]) => void;
  analysisData: {
    items: Array<{
      name: string;
      item_type: 'cooked_meal' | 'raw_material';
      quantity: number;
      unit: string;
      estimated_freshness_days: number;
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
  freshnesssDays: number;
  storageLocation: string;
  notes: string;
  dateCookedStored: string;
  eatByDate: string;
  tags: string[];
}

export const VoiceRecordingEditForm = ({
  isOpen,
  onClose,
  onSubmit,
  analysisData,
}: VoiceRecordingEditFormProps) => {
  const [items, setItems] = useState<EditableItem[]>([]);

  useEffect(() => {
    if (analysisData) {
      const today = new Date().toISOString().split('T')[0];
      const editableItems: EditableItem[] = analysisData.items.map((item, index) => {
        const eatByDate = new Date();
        eatByDate.setDate(eatByDate.getDate() + item.estimated_freshness_days);
        
        return {
          id: `voice-item-${index}`,
          name: item.name,
          itemType: item.item_type,
          quantity: item.quantity,
          unit: item.unit,
          freshnesssDays: item.estimated_freshness_days,
          storageLocation: 'Fridge - Middle Shelf',
          notes: `Voice detected with ${analysisData.confidence} confidence`,
          dateCookedStored: today,
          eatByDate: eatByDate.toISOString().split('T')[0],
          tags: [],
        };
      });
      setItems(editableItems);
    }
  }, [analysisData]);

  const updateItem = (id: string, field: keyof EditableItem, value: string | number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addNewItem = () => {
    const today = new Date().toISOString().split('T')[0];
    const eatByDate = new Date();
    eatByDate.setDate(eatByDate.getDate() + 4);
    
    const newItem: EditableItem = {
      id: `voice-item-${Date.now()}`,
      name: '',
      itemType: 'raw_material',
      quantity: 1,
      unit: 'item',
      freshnesssDays: 4,
      storageLocation: 'Fridge - Middle Shelf',
      notes: 'Manually added',
      dateCookedStored: today,
      eatByDate: eatByDate.toISOString().split('T')[0],
      tags: [],
    };
    setItems(prev => [...prev, newItem]);
  };

  // Tag management functions
  const addTagToItem = (itemId: string, tags: string[]) => {
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
      freshnessDays: item.freshnesssDays,
      tags: item.tags.length > 0 ? item.tags : undefined,
    }));

    onSubmit(foodItems);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle>Review Voice Recording Items</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Review and edit the items detected from your voice recording. You can modify any details or add/remove items as needed.
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
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Item {items.indexOf(item) + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`name-${item.id}`}>Item Name *</Label>
                        <Input
                          id={`name-${item.id}`}
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          placeholder="Enter item name"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`type-${item.id}`}>Item Type</Label>
                        <Select
                          value={item.itemType}
                          onValueChange={(value) => updateItem(item.id, 'itemType', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="raw_material">Raw Material</SelectItem>
                            <SelectItem value="cooked_meal">Cooked Meal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                        <AmountInput
                          id={`quantity-${item.id}`}
                          value={item.quantity.toString()}
                          onChange={(value) => updateItem(item.id, 'quantity', parseFloat(value) || 0)}
                          placeholder="e.g., 2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`unit-${item.id}`}>Unit</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItem(item.id, 'unit', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FOOD_UNITS.map(unit => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`dateCookedStored-${item.id}`}>Date Cooked/Stored</Label>
                        <Input
                          id={`dateCookedStored-${item.id}`}
                          type="date"
                          value={item.dateCookedStored}
                          onChange={(e) => updateItem(item.id, 'dateCookedStored', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`eatByDate-${item.id}`}>Eat By Date</Label>
                        <Input
                          id={`eatByDate-${item.id}`}
                          type="date"
                          value={item.eatByDate}
                          onChange={(e) => updateItem(item.id, 'eatByDate', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`freshness-${item.id}`}>Freshness Days</Label>
                        <Input
                          id={`freshness-${item.id}`}
                          type="number"
                          min="1"
                          max="365"
                          value={item.freshnesssDays}
                          onChange={(e) => updateItem(item.id, 'freshnesssDays', parseInt(e.target.value) || 4)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <StorageLocationSelect
                          value={item.storageLocation}
                          onValueChange={(value) => updateItem(item.id, 'storageLocation', value)}
                        />
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div>
                      <Label htmlFor={`tags-${item.id}`}>Tags (Optional)</Label>
                      <TagInput
                        value={item.tags}
                        onChange={(tags) => addTagToItem(item.id, tags)}
                        category="food"
                        placeholder="Add tag"
                        label="Tags (Optional)"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`notes-${item.id}`}>Notes</Label>
                      <Textarea
                        id={`notes-${item.id}`}
                        value={item.notes}
                        onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                        placeholder="Add any additional notes..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex justify-center">
                <Button onClick={addNewItem} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Item
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700">
              Add {items.filter(item => item.name.trim()).length} Item{items.filter(item => item.name.trim()).length === 1 ? '' : 's'} to Inventory
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};