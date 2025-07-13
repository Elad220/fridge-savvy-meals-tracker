# Form Refactoring Guide

This guide explains how to refactor the existing forms in the application to use the new `BaseForm` component, which provides a consistent and reusable form structure.

## Overview

The `BaseForm` component provides:
- Standardized form structure with dialog/modal
- Built-in validation
- Error handling
- Loading states
- Consistent UI patterns
- Reusable field components

## BaseForm Features

### 1. Form Field Types
- `text` - Standard text input
- `number` - Numeric input
- `date` - Date picker
- `textarea` - Multi-line text area
- `select` - Dropdown selection
- `amount` - Numeric input with decimal support

### 2. Validation
Each field can have custom validation:
```typescript
{
  name: 'email',
  label: 'Email',
  type: 'text',
  required: true,
  validation: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
}
```

### 3. Form Props
```typescript
interface BaseFormProps {
  title: string;                    // Form title
  isOpen: boolean;                  // Dialog open state
  onClose: () => void;              // Close handler
  onSubmit: (data: any) => void;    // Submit handler
  fields?: FormField[];             // Form field definitions
  initialData?: Record<string, any>; // Initial form data
  maxWidth?: string;                // Dialog max width
  showCancelButton?: boolean;       // Show cancel button
  submitButtonText?: string;        // Submit button text
  cancelButtonText?: string;        // Cancel button text
  children?: React.ReactNode;       // Custom form content
}
```

## Refactoring Examples

### Example 1: Simple Form (EditItemForm)

**Before:**
```typescript
export const EditItemForm = ({ item, onSubmit, onClose }: EditItemFormProps) => {
  const [formData, setFormData] = useState({
    name: item.name,
    dateCookedStored: item.dateCookedStored.toISOString().split('T')[0],
    // ... more state
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation and submission logic
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card">
        <DialogHeader>
          <DialogTitle>Edit Food Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Manual form fields */}
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

**After:**
```typescript
export const EditItemFormRefactored = ({ item, onSubmit, onClose }: EditItemFormProps) => {
  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Food Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Chicken Stir-fry',
    },
    {
      name: 'dateCookedStored',
      label: 'Date Cooked/Stored',
      type: 'date',
      required: true,
    },
    // ... more fields
  ];

  const initialData = {
    name: item.name,
    dateCookedStored: item.dateCookedStored.toISOString().split('T')[0],
    // ... more initial data
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    // Transform and submit data
    const updatedItem = { /* transform formData */ };
    onSubmit(updatedItem);
  };

  return (
    <BaseForm
      title="Edit Food Item"
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      fields={fields}
      initialData={initialData}
    />
  );
};
```

### Example 2: Complex Form with Custom Fields (AddRecipeForm)

**Before:**
```typescript
export const AddRecipeForm = ({ isOpen, onClose, onSubmit }: AddRecipeFormProps) => {
  const [ingredients, setIngredients] = useState<EditableRecipeIngredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  // ... more state

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic fields */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Manual form fields */}
            </CardContent>
          </Card>

          {/* Ingredients section */}
          {/* Instructions section */}
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

**After:**
```typescript
export const AddRecipeFormRefactored = ({ isOpen, onClose, onSubmit }: AddRecipeFormProps) => {
  const { items: ingredients, addItem: addIngredient, removeItem: removeIngredient } = useListManager<EditableRecipeIngredient>();
  const { items: instructions, addItem: addInstruction, removeItem: removeInstruction } = useListManager<string>();

  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Recipe Name',
      type: 'text',
      required: true,
      placeholder: 'Enter recipe name',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Brief description of the recipe',
    },
    // ... more basic fields
  ];

  return (
    <BaseForm
      title="Add New Recipe"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      fields={fields}
      maxWidth="sm:max-w-2xl"
    >
      {/* Custom ingredients section */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Ingredients management UI */}
        </CardContent>
      </Card>

      {/* Custom instructions section */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Instructions management UI */}
        </CardContent>
      </Card>
    </BaseForm>
  );
};
```

## Available Hooks

### useBaseForm
For functional components that need more control:
```typescript
const {
  formData,
  errors,
  isSubmitting,
  handleInputChange,
  validateForm,
  resetForm,
} = useBaseForm(initialData);
```

### useListManager
For managing dynamic lists (ingredients, instructions, etc.):
```typescript
const {
  items,
  addItem,
  updateItem,
  removeItem,
  setItems,
} = useListManager<YourType>(initialItems);
```

### useDialog
For dialog state management:
```typescript
const {
  isOpen,
  open,
  close,
  toggle,
} = useDialog(initialOpen);
```

## Migration Steps

1. **Identify form fields**: List all form fields and their types
2. **Define FormField array**: Convert fields to FormField definitions
3. **Extract initial data**: Move form state to initialData object
4. **Simplify submit handler**: Remove manual validation, use BaseForm's built-in validation
5. **Handle custom fields**: Move complex fields (like TagInput) to children
6. **Test thoroughly**: Ensure all functionality works as expected

## Benefits

- **Consistency**: All forms follow the same structure and patterns
- **Maintainability**: Common functionality is centralized
- **Reusability**: Form components can be easily reused
- **Validation**: Built-in validation with custom rules
- **Error handling**: Standardized error display and handling
- **Accessibility**: Consistent keyboard navigation and screen reader support

## Common Patterns

### Dynamic Lists
For forms with dynamic content (ingredients, instructions, etc.):
```typescript
const { items, addItem, removeItem } = useListManager<YourType>();

// In the form children:
{items.map((item, index) => (
  <div key={index}>
    {/* Item fields */}
    <Button onClick={() => removeItem(index)}>Remove</Button>
  </div>
))}
<Button onClick={() => addItem(newItem)}>Add Item</Button>
```

### Custom Validation
```typescript
{
  name: 'amount',
  label: 'Amount',
  type: 'amount',
  required: true,
  validation: (value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return 'Amount must be a positive number';
    }
    return null;
  },
}
```

### Conditional Fields
```typescript
{formData.type === 'cooked' && (
  <FormField
    field={{
      name: 'cookingTime',
      label: 'Cooking Time',
      type: 'number',
      required: true,
    }}
    value={formData.cookingTime}
    onChange={(value) => handleInputChange('cookingTime', value)}
    error={errors.cookingTime}
  />
)}
```

This refactoring will significantly reduce code duplication and improve maintainability across all forms in the application.