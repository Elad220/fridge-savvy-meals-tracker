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

// A simple event name for broadcasting updates to custom storage locations
const STORAGE_EVENT = 'custom-storage-locations-updated';

// Helper to read custom locations from localStorage safely
const readCustomLocationsFromStorage = (): string[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse custom storage locations:', err);
    return [];
  }
};

export const useStorageLocations = () => {
  const [customLocations, setCustomLocations] = useState<string[]>([]);

  // Load custom locations on mount **and** subscribe to updates from other hook instances
  useEffect(() => {
    setCustomLocations(readCustomLocationsFromStorage());

    const handleUpdate = (e: Event) => {
      // When another hook instance adds a location it will dispatch the event.
      // Simply re-read from localStorage to get the latest list.
      setCustomLocations(readCustomLocationsFromStorage());
    };

    window.addEventListener(STORAGE_EVENT, handleUpdate);

    return () => {
      window.removeEventListener(STORAGE_EVENT, handleUpdate);
    };
  }, []);

  // Save custom locations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customLocations));
  }, [customLocations]);

  const addCustomLocation = (location: string) => {
    const trimmedLocation = location.trim();
    if (!trimmedLocation) return false;
    
    const allLocations = [...DEFAULT_STORAGE_LOCATIONS, ...customLocations];
    const exists = allLocations.some(
      loc => loc.toLowerCase() === trimmedLocation.toLowerCase()
    );
    
    if (exists) return false;

    const updated = [...customLocations, trimmedLocation];
    setCustomLocations(updated);
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Notify other hook instances in the same tab
    window.dispatchEvent(new Event(STORAGE_EVENT));
    return true;
  };

  const removeCustomLocation = (location: string) => {
    const updated = customLocations.filter(loc => loc !== location);
    setCustomLocations(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(STORAGE_EVENT));
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