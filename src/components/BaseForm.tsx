import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { X, Plus, Trash2 } from 'lucide-react';

// Common form field types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'amount';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
}

// Base form props interface
export interface BaseFormProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void | Promise<void>;
  fields?: FormField[];
  initialData?: Record<string, any>;
  maxWidth?: string;
  showCancelButton?: boolean;
  submitButtonText?: string;
  cancelButtonText?: string;
  children?: React.ReactNode;
}

// Functional BaseForm component
export const BaseForm: React.FC<BaseFormProps> = ({
  title,
  isOpen,
  onClose,
  onSubmit,
  fields = [],
  initialData = {},
  maxWidth = "sm:max-w-md",
  showCancelButton = true,
  submitButtonText = "Submit",
  cancelButtonText = "Cancel",
  children
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form data changes
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' })); // Clear error when field changes
  }, []);

  // Validate a single field
  const validateField = useCallback((field: FormField, value: any): string | null => {
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      return field.validation(value);
    }

    return null;
  }, []);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, formData, validateField]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      await onSubmit(formData);
      handleClose();
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
  }, [formData, onSubmit, validateForm]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  }, [initialData, onClose]);

  // Render a form field based on its type
  const renderField = useCallback((field: FormField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];

    const commonProps = {
      id: field.name,
      value: value,
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
            <Input
              {...commonProps}
              type="number"
              step="0.01"
              min="0"
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
  }, [formData, errors, handleInputChange]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${maxWidth} glass-card`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Render predefined fields */}
          {fields.map(field => renderField(field))}
          
          {/* Render custom children */}
          {children}
          
          {/* Form actions */}
          <div className="flex justify-end gap-2 pt-4">
            {showCancelButton && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {cancelButtonText}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : submitButtonText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Hook-based form for functional components
export const useBaseForm = (initialData?: Record<string, any>) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' })); // Clear error when field changes
  }, []);

  const validateField = useCallback((field: FormField, value: any): string | null => {
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      return field.validation(value);
    }

    return null;
  }, []);

  const validateForm = useCallback((fields: FormField[]): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const resetForm = useCallback((newData?: Record<string, any>) => {
    setFormData(newData || {});
    setErrors({});
    setIsSubmitting(false);
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleInputChange,
    validateForm,
    resetForm,
  };
};

// Common form components
export const FormField: React.FC<{
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}> = ({ field, value, onChange, error }) => {
  const commonProps = {
    id: field.name,
    value: value || '',
    placeholder: field.placeholder,
    required: field.required,
    className: error ? 'border-red-500' : '',
  };

  switch (field.type) {
    case 'textarea':
      return (
        <div>
          <Label htmlFor={field.name}>{field.label}</Label>
          <Textarea
            {...commonProps}
            onChange={(e) => onChange(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div>
          <Label htmlFor={field.name}>{field.label}</Label>
          <Select 
            value={value || ''} 
            onValueChange={onChange}
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
        <div>
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            {...commonProps}
            type="number"
            step="0.01"
            min="0"
            onChange={(e) => onChange(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      );

    default:
      return (
        <div>
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            {...commonProps}
            type={field.type}
            onChange={(e) => onChange(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      );
  }
};

// Common list management hooks
export const useListManager = <T,>(initialItems: T[] = []) => {
  const [items, setItems] = useState<T[]>(initialItems);

  const addItem = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, []);

  const updateItem = useCallback((index: number, item: T) => {
    setItems(prev => prev.map((existing, i) => i === index ? item : existing));
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const setItemsList = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  return {
    items,
    addItem,
    updateItem,
    removeItem,
    setItems: setItemsList,
  };
};

// Common dialog management hook
export const useDialog = (initialOpen: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};