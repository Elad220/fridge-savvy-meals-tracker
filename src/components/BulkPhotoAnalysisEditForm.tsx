import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FoodItem } from '@/types';
import { StorageLocationSelect } from './StorageLocationSelect';

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
}

export const BulkPhotoAnalysisEditForm = ({
  isOpen,
  onClose,
  onSubmit,
  analysisData,
}: BulkPhotoAnalysisEditFormProps) => {
  const [items, setItems] = useState<EditableItem[]>([]);

  useEffect(() => {
    if (analysisData) {
      const editableItems: EditableItem[] = analysisData.items.map((item, index) => ({
        id: `photo-item-${index}`,
        name: item.suggested_name || 'Food Item',
        itemType: item.item_type,
        quantity: item.estimated_amount || 1,
        unit: item.estimated_unit || 'item',
        freshnessDays: 4, // Default value since backend doesn't provide this
        storageLocation: 'Refrigerator',
        notes: `Photo analysis with ${analysisData.confidence} confidence`,
      }));
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
    const newItem: EditableItem = {
      id: `photo-item-${Date.now()}`,
      name: '',
      itemType: 'raw_material',
      quantity: 1,
      unit: 'item',
      freshnessDays: 4,
      storageLocation: 'Refrigerator',
      notes: 'Manually added',
    };
    setItems(prev => [...prev, newItem]);
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

    const today = new Date();
    const foodItems: Omit<FoodItem, 'id' | 'userId'>[] = validItems.map(item => ({
      name: item.name.trim(),
      dateCookedStored: today,
      eatByDate: new Date(today.getTime() + (item.freshnessDays * 24 * 60 * 60 * 1000)),
      amount: item.quantity,
      unit: item.unit,
      storageLocation: item.storageLocation,
      label: item.itemType === 'cooked_meal' ? 'cooked meal' : 'raw material',
      notes: item.notes,
      freshnessDays: item.freshnessDays,
    }));

    onSubmit(foodItems);
  };

  const unitOptions = [
    'item', 'piece', 'serving', 'cup', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'can', 'bottle', 'box', 'bag', 'pack'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Photo Analysis Items</DialogTitle>
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
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="mt-1"
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
                            {unitOptions.map(unit => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`freshness-${item.id}`}>Freshness Days</Label>
                        <Input
                          id={`freshness-${item.id}`}
                          type="number"
                          min="1"
                          max="365"
                          value={item.freshnessDays}
                          onChange={(e) => updateItem(item.id, 'freshnessDays', parseInt(e.target.value) || 4)}
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
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              Add {items.filter(item => item.name.trim()).length} Item{items.filter(item => item.name.trim()).length === 1 ? '' : 's'} to Inventory
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 