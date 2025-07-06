// Creating new file.
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { AmountInput } from '@/components/ui/amount-input';
import { StorageLocationSelect } from '@/components/StorageLocationSelect';
import { FoodItem, FOOD_UNITS } from '@/types';
import { toast } from '@/hooks/use-toast';

interface AnalysisItem {
  suggested_name: string;
  item_type: 'cooked_meal' | 'raw_material';
  expiration_date: string | null;
  estimated_amount?: number;
  estimated_unit?: string;
  confidence: string;
}

interface PhotoAnalysisBulkEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: Omit<FoodItem, 'id' | 'userId'>[]) => void;
  analysisData: AnalysisItem[];
}

interface EditableItem {
  id: string;
  name: string;
  itemType: 'cooked_meal' | 'raw_material';
  amount: number;
  unit: string;
  freshnessDays: number;
  eatByDate: string; // ISO date string
  storageLocation: string;
  notes: string;
}

export const PhotoAnalysisBulkEditForm = ({
  isOpen,
  onClose,
  onSubmit,
  analysisData,
}: PhotoAnalysisBulkEditFormProps) => {
  const todayIso = new Date().toISOString().split('T')[0];

  const buildDefaultEatBy = (analysis: AnalysisItem): string => {
    if (analysis.expiration_date && analysis.item_type === 'raw_material') {
      return analysis.expiration_date;
    }
    const date = new Date();
    date.setDate(date.getDate() + 4);
    return date.toISOString().split('T')[0];
  };

  const [items, setItems] = useState<EditableItem[]>([]);

  useEffect(() => {
    if (analysisData && analysisData.length > 0) {
      const mapped: EditableItem[] = analysisData.map((a, idx) => ({
        id: `photo-item-${idx}-${Date.now()}`,
        name: a.suggested_name,
        itemType: a.item_type,
        amount: a.estimated_amount || 1,
        unit: a.estimated_unit || (a.item_type === 'cooked_meal' ? 'serving' : 'item'),
        freshnessDays: 4,
        eatByDate: buildDefaultEatBy(a),
        storageLocation: 'Refrigerator',
        notes: `AI analyzed with ${a.confidence} confidence`,
      }));
      setItems(mapped);
    }
  }, [analysisData]);

  const updateItem = (id: string, field: keyof EditableItem, value: any) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const addNewItem = () => {
    const newItem: EditableItem = {
      id: `photo-item-${Date.now()}`,
      name: '',
      itemType: 'raw_material',
      amount: 1,
      unit: 'item',
      freshnessDays: 4,
      eatByDate: todayIso,
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

    const foodItems: Omit<FoodItem, 'id' | 'userId'>[] = validItems.map(item => ({
      name: item.name.trim(),
      dateCookedStored: new Date(todayIso),
      eatByDate: new Date(item.eatByDate),
      amount: item.amount,
      unit: item.unit,
      storageLocation: item.storageLocation,
      label: item.itemType === 'cooked_meal' ? 'cooked meal' : 'raw material',
      notes: item.notes,
      freshnessDays: item.freshnessDays,
    }));

    onSubmit(foodItems);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Detected Items</DialogTitle>
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
              {items.map((item, idx) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Item {idx + 1}</CardTitle>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <Label htmlFor={`amount-${item.id}`}>Amount *</Label>
                        <AmountInput
                          id={`amount-${item.id}`}
                          value={item.amount.toString()}
                          onChange={(value) => updateItem(item.id, 'amount', parseFloat(value) || 0)}
                          placeholder="e.g., 2"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`unit-${item.id}`}>Unit *</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItem(item.id, 'unit', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FOOD_UNITS.map(u => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`freshness-${item.id}`}>Freshness Days *</Label>
                        <Input
                          id={`freshness-${item.id}`}
                          type="number"
                          min="1"
                          max="365"
                          value={item.freshnessDays}
                          onChange={(e) => updateItem(item.id, 'freshnessDays', parseInt(e.target.value) || 1)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`eatby-${item.id}`}>Eat By Date *</Label>
                        <Input
                          id={`eatby-${item.id}`}
                          type="date"
                          value={item.eatByDate}
                          onChange={(e) => updateItem(item.id, 'eatByDate', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <StorageLocationSelect
                          value={item.storageLocation}
                          onValueChange={(val) => updateItem(item.id, 'storageLocation', val)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`notes-${item.id}`}>Notes</Label>
                      <Textarea
                        id={`notes-${item.id}`}
                        value={item.notes}
                        onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                        placeholder="Additional notes..."
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
              Add {items.filter(i => i.name.trim()).length} Item{items.filter(i => i.name.trim()).length === 1 ? '' : 's'} to Inventory
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