import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AmountInput } from '@/components/ui/amount-input';
import { StorageLocationSelect } from '@/components/StorageLocationSelect';
import { TagInput } from '@/components/TagInput';
import { FoodItem, FOOD_UNITS } from '@/types';
import { aiService } from '@/lib/ai-service/aiService';
import { Loader2, Sparkles, Edit3 } from 'lucide-react';

interface TextToInventoryFormProps {
  onSubmit: (item: Omit<FoodItem, 'id' | 'userId'>) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface ParsedItem {
  name: string;
  amount: number;
  unit: string;
  storageLocation: string;
  label: 'raw material' | 'cooked meal';
  notes?: string;
  tags: string[];
  freshnessDays: number;
}

export const TextToInventoryForm = ({ onSubmit, onClose, isOpen }: TextToInventoryFormProps) => {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const parseTextToItems = async () => {
    if (!inputText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some text to parse.',
        variant: 'destructive',
      });
      return;
    }

    setIsParsing(true);
    try {
      const prompt = `Parse the following text and extract food inventory items. Return a JSON array of items with these exact fields:
- name (string): The food item name
- amount (number): Quantity as a number
- unit (string): One of: ${FOOD_UNITS.join(', ')}
- storageLocation (string): Where to store it (fridge, freezer, pantry, counter)
- label (string): Either "raw material" or "cooked meal"
- notes (string, optional): Any additional notes
- tags (array of strings): Relevant tags like ingredients, meal type, etc.
- freshnessDays (number): How many days the item stays fresh (1-30)

Text to parse: "${inputText}"

Return only valid JSON array, no other text.`;

      const response = await aiService.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 1000,
      });

      let items: ParsedItem[];
      try {
        items = JSON.parse(response.content);
        if (!Array.isArray(items)) {
          throw new Error('Response is not an array');
        }
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          items = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse AI response as JSON');
        }
      }

      // Validate and clean the items
      const validItems = items.filter(item => 
        item.name && 
        typeof item.amount === 'number' && 
        item.amount > 0 &&
        ['raw material', 'cooked meal'].includes(item.label)
      ).map(item => ({
        ...item,
        unit: (FOOD_UNITS as readonly string[]).includes(item.unit) ? item.unit as typeof FOOD_UNITS[number] : 'item',
        tags: Array.isArray(item.tags) ? item.tags : [],
        freshnessDays: Math.min(Math.max(item.freshnessDays || 4, 1), 30),
        storageLocation: item.storageLocation || 'fridge'
      }));

      if (validItems.length === 0) {
        toast({
          title: 'No Items Found',
          description: 'Could not extract any valid food items from the text. Please try rephrasing.',
          variant: 'destructive',
        });
        return;
      }

      setParsedItems(validItems);
      setShowResults(true);

      toast({
        title: 'Success',
        description: `Found ${validItems.length} food item${validItems.length > 1 ? 's' : ''} in your text!`,
      });

    } catch (error) {
      console.error('Error parsing text:', error);
      toast({
        title: 'Parsing Error',
        description: 'Failed to parse the text. Please make sure you have an AI provider configured in settings.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const updateParsedItem = (index: number, field: keyof ParsedItem, value: any) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const calculateEatByDate = (freshnessDays: number) => {
    const today = new Date();
    const eatBy = new Date(today);
    eatBy.setDate(eatBy.getDate() + freshnessDays);
    return eatBy;
  };

  const handleAddItems = async () => {
    for (const item of parsedItems) {
      try {
        const today = new Date();
        const eatByDate = calculateEatByDate(item.freshnessDays);

        const foodItem: Omit<FoodItem, 'id' | 'userId'> = {
          name: item.name,
          dateCookedStored: today,
          eatByDate: eatByDate,
          amount: item.amount,
          unit: item.unit,
          storageLocation: item.storageLocation,
          label: item.label,
          notes: item.notes || undefined,
          tags: item.tags.length > 0 ? item.tags : undefined,
          freshnessDays: item.freshnessDays,
        };

        await onSubmit(foodItem);
      } catch (error) {
        console.error('Error adding item:', error);
        toast({
          title: 'Error',
          description: `Failed to add ${item.name}. Please try again.`,
          variant: 'destructive',
        });
      }
    }

    // Reset form
    setInputText('');
    setParsedItems([]);
    setShowResults(false);
    setEditingIndex(null);
    onClose();
  };

  const handleClose = () => {
    setInputText('');
    setParsedItems([]);
    setShowResults(false);
    setEditingIndex(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Text to Inventory
          </DialogTitle>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="inputText">
                Describe your food items in natural language
              </Label>
              <Textarea
                id="inputText"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Example: I bought 2 pounds of chicken breast, 1 bag of spinach, and made 4 servings of pasta sauce yesterday. Also got some bananas and a loaf of bread."
                className="min-h-32 resize-none"
                disabled={isParsing}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={parseTextToItems}
                disabled={isParsing || !inputText.trim()}
                className="flex items-center gap-2"
              >
                {isParsing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isParsing ? 'Parsing...' : 'Parse Items'}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Found {parsedItems.length} item{parsedItems.length > 1 ? 's' : ''}</h3>
              <Button
                variant="outline"
                onClick={() => setShowResults(false)}
                className="text-sm"
              >
                Back to Text
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {parsedItems.map((item, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span>{item.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {editingIndex === index ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Amount</Label>
                            <AmountInput
                              value={item.amount.toString()}
                              onChange={(value) => updateParsedItem(index, 'amount', parseFloat(value) || 1)}
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Select
                              value={item.unit}
                              onValueChange={(value) => updateParsedItem(index, 'unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
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

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Type</Label>
                            <Select
                              value={item.label}
                              onValueChange={(value: 'raw material' | 'cooked meal') => 
                                updateParsedItem(index, 'label', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="raw material">Raw Material</SelectItem>
                                <SelectItem value="cooked meal">Cooked Meal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Fresh for (days)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              value={item.freshnessDays}
                              onChange={(e) => updateParsedItem(index, 'freshnessDays', parseInt(e.target.value) || 4)}
                            />
                          </div>
                        </div>

                        <StorageLocationSelect
                          value={item.storageLocation}
                          onValueChange={(value) => updateParsedItem(index, 'storageLocation', value)}
                          required={false}
                        />

                        <TagInput
                          value={item.tags}
                          onChange={(tags) => updateParsedItem(index, 'tags', tags)}
                          category="food"
                          placeholder="Add tags"
                          label="Tags"
                        />

                        <div>
                          <Label>Notes</Label>
                          <Input
                            value={item.notes || ''}
                            onChange={(e) => updateParsedItem(index, 'notes', e.target.value)}
                            placeholder="Optional notes"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Amount:</span> {item.amount} {item.unit}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {item.label}
                        </div>
                        <div>
                          <span className="font-medium">Storage:</span> {item.storageLocation}
                        </div>
                        <div>
                          <span className="font-medium">Fresh for:</span> {item.freshnessDays} days
                        </div>
                        {item.tags.length > 0 && (
                          <div className="col-span-2">
                            <span className="font-medium">Tags:</span> {item.tags.join(', ')}
                          </div>
                        )}
                        {item.notes && (
                          <div className="col-span-2">
                            <span className="font-medium">Notes:</span> {item.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleAddItems} className="flex-1">
                Add {parsedItems.length} Item{parsedItems.length > 1 ? 's' : ''} to Inventory
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};