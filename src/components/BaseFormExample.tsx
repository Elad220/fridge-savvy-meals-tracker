import { useState } from 'react';
import { BaseForm, FormField } from '@/components/BaseForm';
import { Button } from '@/components/ui/button';

// Example: Simple form using BaseForm
export const SimpleFormExample = () => {
  const [isOpen, setIsOpen] = useState(false);

  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your name',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      required: true,
      placeholder: 'Enter your email',
      validation: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        return null;
      },
    },
    {
      name: 'age',
      label: 'Age',
      type: 'number',
      required: true,
      validation: (value) => {
        const age = parseInt(value);
        if (isNaN(age) || age < 0 || age > 120) {
          return 'Age must be between 0 and 120';
        }
        return null;
      },
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { value: 'student', label: 'Student' },
        { value: 'professional', label: 'Professional' },
        { value: 'retired', label: 'Retired' },
      ],
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Additional notes...',
    },
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    console.log('Form submitted:', formData);
    // Handle form submission
    setIsOpen(false);
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Open Simple Form
      </Button>

      <BaseForm
        title="Simple Form Example"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        fields={fields}
        submitButtonText="Save"
        cancelButtonText="Cancel"
      />
    </div>
  );
};

// Example: Form with custom children
export const CustomFormExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [customField, setCustomField] = useState('');

  const fields: FormField[] = [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
    },
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    console.log('Form submitted:', { ...formData, customField });
    setIsOpen(false);
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Open Custom Form
      </Button>

      <BaseForm
        title="Custom Form Example"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        fields={fields}
        maxWidth="sm:max-w-lg"
      >
        {/* Custom field rendered as children */}
        <div>
          <label htmlFor="customField" className="text-sm font-medium">
            Custom Field
          </label>
          <input
            id="customField"
            type="text"
            value={customField}
            onChange={(e) => setCustomField(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Custom field..."
          />
        </div>
      </BaseForm>
    </div>
  );
};