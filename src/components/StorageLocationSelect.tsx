import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStorageLocations } from '@/hooks/useStorageLocations';
import { toast } from '@/components/ui/use-toast';

interface StorageLocationSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  loading?: boolean;
}

export const StorageLocationSelect = ({ 
  value, 
  onValueChange, 
  required = false,
  placeholder = "Select storage location",
  loading: loadingProp
}: StorageLocationSelectProps) => {
  const { storageLocations, addCustomLocation, loading: hookLoading } = useStorageLocations();
  const loading = loadingProp !== undefined ? loadingProp : hookLoading;
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState('');

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'Other') {
      setIsAddingCustom(true);
      setCustomLocationInput('');
    } else {
      setIsAddingCustom(false);
      onValueChange(selectedValue);
    }
  };

  const handleAddCustomLocation = () => {
    if (!customLocationInput.trim()) {
      toast({
        title: 'Invalid Location',
        description: 'Please enter a location name.',
        variant: 'destructive',
      });
      return;
    }

    const success = addCustomLocation(customLocationInput);
    if (success) {
      onValueChange(customLocationInput);
      setIsAddingCustom(false);
      setCustomLocationInput('');
      toast({
        title: 'Location Added',
        description: `"${customLocationInput}" has been added to your storage locations.`,
      });
    } else {
      toast({
        title: 'Location Already Exists',
        description: 'This storage location already exists.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelCustom = () => {
    setIsAddingCustom(false);
    setCustomLocationInput('');
  };

  if (isAddingCustom) {
    return (
      <div className="space-y-2">
        <Label htmlFor="customLocation">Custom Storage Location *</Label>
        <div className="flex gap-2">
          <Input
            id="customLocation"
            value={customLocationInput}
            onChange={(e) => setCustomLocationInput(e.target.value)}
            placeholder="Enter custom location"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomLocation();
              } else if (e.key === 'Escape') {
                handleCancelCustom();
              }
            }}
            autoFocus
          />
          <Button 
            type="button" 
            onClick={handleAddCustomLocation}
            size="sm"
            className="shrink-0"
          >
            Add
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancelCustom}
            size="sm"
            className="shrink-0"
          >
            Cancel
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Press Enter to add or Escape to cancel
        </p>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="storageLocation">Storage Location {required && '*'}</Label>
      <Select value={value} onValueChange={handleSelectChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading locations...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="px-4 py-2 text-muted-foreground text-xs">Loading...</div>
          ) : (
            storageLocations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};