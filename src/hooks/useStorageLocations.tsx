import { useState, useEffect } from 'react';

const DEFAULT_STORAGE_LOCATIONS = [
  'Fridge - Top Shelf',
  'Fridge - Middle Shelf',
  'Fridge - Bottom Shelf',
  'Fridge - Crisper Drawer',
  'Freezer - Top Left',
  'Freezer - Top Right',
  'Freezer - Middle Left',
  'Freezer - Middle Right',
  'Freezer - Bottom Left',
  'Freezer - Bottom Right',
  'Pantry',
  'Counter',
  'Other'
];

const STORAGE_KEY = 'custom-storage-locations';

export const useStorageLocations = () => {
  const [customLocations, setCustomLocations] = useState<string[]>([]);

  // Load custom locations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomLocations(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.warn('Failed to parse custom storage locations:', error);
        setCustomLocations([]);
      }
    }
  }, []);

  // Save custom locations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customLocations));
  }, [customLocations]);

  const addCustomLocation = (location: string) => {
    const trimmedLocation = location.trim();
    if (!trimmedLocation) return false;
    
    // Check if location already exists (case-insensitive)
    const allLocations = [...DEFAULT_STORAGE_LOCATIONS, ...customLocations];
    const exists = allLocations.some(
      loc => loc.toLowerCase() === trimmedLocation.toLowerCase()
    );
    
    if (exists) return false;
    
    setCustomLocations(prev => [...prev, trimmedLocation]);
    return true;
  };

  const removeCustomLocation = (location: string) => {
    setCustomLocations(prev => prev.filter(loc => loc !== location));
  };

  // Get all locations (default + custom, with "Other" at the end)
  const getAllLocations = () => {
    const defaultWithoutOther = DEFAULT_STORAGE_LOCATIONS.slice(0, -1);
    return [...defaultWithoutOther, ...customLocations, 'Other'];
  };

  return {
    storageLocations: getAllLocations(),
    customLocations,
    addCustomLocation,
    removeCustomLocation,
    isCustomLocation: (location: string) => customLocations.includes(location)
  };
};