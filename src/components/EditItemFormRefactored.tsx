import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AmountInput } from '@/components/ui/amount-input';
import { StorageLocationSelect } from '@/components/StorageLocationSelect';
import { TagInput } from '@/components/TagInput';
import { FoodItem, FOOD_UNITS } from '@/types';
import { toast } from '@/components/ui/use-toast';

interface EditItemFormRefactoredProps {
  item: FoodItem;
  onSubmit: (item: FoodItem) => void;
  onClose: () => void;
}

// Form field configuration
const formFields = [
  {
    name: 'name',
    label: 'Food Name',
    type: 'text' as const,
    required: true,
    placeholder: 'e.g., Chicken Stir-fry',
  },
  {
    name: 'dateCookedStored',
    label: 'Date Cooked/Stored',
    type: 'date' as const,
    required: true,
  },
  {
    name: 'freshnessDays',
    label: 'Fresh for (days)',
    type: 'number' as const,
    required: true,
    validation: (value: string) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 365) {
        return 'Freshness days must be between 1 and 365';
      }
      return null;
    },
  },
  {
    name: 'eatByDate',
    label: 'Eat By Date',
    type: 'date' as const,
    required: true,
  },
  {
    name: 'amount',
    label: 'Amount',
    type: 'amount' as const,
    required: true,
    validation: (value: string) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return 'Amount must be a positive number';
      }
      return null;
    },
  },
  {
    name: 'unit',
    label: 'Unit',
    type: 'select' as const,
    required: true,
    options: FOOD_UNITS.map(unit => ({ value: unit, label: unit })),
  },
  {
    name: 'label',
    label: 'Food Type',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'raw material', label: 'Raw Material' },
      { value: 'cooked meal', label: 'Cooked Meal' },
    ],
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea' as const,
    placeholder: 'Additional notes about the food item',
  },
];

export const EditItemFormRefactored = ({ item, onSubmit, onClose }: EditItemFormRefactoredProps) => {
  const [formData, setFormData] = useState({
    name: item.name,
    dateCookedStored: item.dateCookedStored.toISOString().split('T')[0],
    eatByDate: item.eatByDate.toISOString().split('T')[0],
    amount: item.amount.toString(),
    unit: item.unit,
    label: item.label,
    notes: item.notes || '',
    freshnessDays: (item.freshnessDays || 4).toString(),
    storageLocation: item.storageLocation,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>(item.tags || []);

  const calculateEatByDate = (cookedDate: string, freshnessDays: number) => {
    const cooked = new Date(cookedDate);
    const eatBy = new Date(cooked);
    eatBy.setDate(eatBy.getDate() + freshnessDays);
    return eatBy.toISOString().split('T')[0];
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate eat by date when cooked date or freshness days change
      if (field === 'dateCookedStored' || field === 'freshnessDays') {
        const freshnessDays = parseInt(field === 'freshnessDays' ? value : prev.freshnessDays) || 4;
        const cookedDate = field === 'dateCookedStored' ? value : prev.dateCookedStored;
        updated.eatByDate = calculateEatByDate(cookedDate, freshnessDays);
      }
      
      return updated;
    });

    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    formFields.forEach(field => {
      const value = formData[field.name];
      
      // Required field validation
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }

      // Custom validation
      if (field.validation) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid positive number for the amount.',
          variant: 'destructive',
        });
        return;
      }
      
      const updatedItem: FoodItem = {
        ...item,
        name: formData.name,
        dateCookedStored: new Date(formData.dateCookedStored),
        eatByDate: new Date(formData.eatByDate),
        amount: amount,
        unit: formData.unit,
        storageLocation: formData.storageLocation,
        label: formData.label,
        notes: formData.notes || undefined,
        tags: tags.length > 0 ? tags : undefined,
        freshnessDays: parseInt(formData.freshnessDays) || 4,
      };
      
      await onSubmit(updatedItem);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit form. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: typeof formFields[0]) => {
    const value = formData[field.name];
    const error = errors[field.name];

    const commonProps = {
      id: field.name,
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleInputChange(field.name, e.target.value),
      placeholder: field.placeholder,
      required: field.required,
      className: error ? 'border-red-500' : '',
    };

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Textarea {...commonProps} />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Select 
              value={value} 
              onValueChange={(val) => handleInputChange(field.name, val)}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'amount':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <AmountInput
              id={field.name}
              value={value}
              onChange={(val) => handleInputChange(field.name, val)}
              placeholder={field.placeholder}
              required={field.required}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input {...commonProps} type={field.type} />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card">
        <DialogHeader>
          <DialogTitle>Edit Food Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Render form fields */}
          {formFields.map(field => renderField(field))}

          {/* Custom field for storage location */}
          <div>
            <StorageLocationSelect
              value={formData.storageLocation}
              onValueChange={(value) => handleInputChange('storageLocation', value)}
              required
            />
          </div>

          {/* Custom field for tags */}
          <div>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="Add tags..."
            />
          </div>

          {/* Form actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};