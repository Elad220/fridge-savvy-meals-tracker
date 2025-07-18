import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

const DEFAULT_STORAGE_LOCATIONS = [
  'Fridge - Top Shelf',
  'Fridge - Middle Shelf',
  'Fridge - Bottom Shelf',
  'Fridge - Left Drawer',
  'Fridge - Right Drawer',
  'Fridge - Left Door',
  'Fridge - Right Door',
  'Freezer - Top Left',
  'Freezer - Top Right',
  'Freezer - Middle Left',
  'Freezer - Middle Right',
  'Freezer - Bottom Left',
  'Freezer - Bottom Right',
  'Pantry - Top Shelf',
  'Pantry - Bottom Shelf',
  'Counter',
  'Other'
];

const STORAGE_KEY = 'custom-storage-locations';
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
  const { user } = useAuth();
  const [customLocations, setCustomLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch from Supabase on mount and when user changes
  useEffect(() => {
    const fetchLocations = async () => {
      if (!user) {
        setCustomLocations(readCustomLocationsFromStorage());
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('storage_locations')
        .select('location_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) {
        console.warn('Failed to fetch storage locations from Supabase:', error);
        setCustomLocations(readCustomLocationsFromStorage());
      } else {
        const locations = (data || []).map((row: Database["public"]["Tables"]["storage_locations"]["Row"]) => row.location_name);
        setCustomLocations(locations);
        // Optionally cache in localStorage for offline use
        localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
      }
      setLoading(false);
    };
    fetchLocations();
    // Listen for updates from other hook instances (for local dev, not cross-device)
    const handleUpdate = () => {
      setCustomLocations(readCustomLocationsFromStorage());
    };
    window.addEventListener(STORAGE_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(STORAGE_EVENT, handleUpdate);
    };
  }, [user]);

  // Add a new custom location (Supabase + local cache)
  const addCustomLocation = useCallback(async (location: string) => {
    const trimmedLocation = location.trim();
    if (!trimmedLocation) return false;
    const allLocations = [...DEFAULT_STORAGE_LOCATIONS, ...customLocations];
    const exists = allLocations.some(
      loc => loc.toLowerCase() === trimmedLocation.toLowerCase()
    );
    if (exists) return false;
    if (!user) {
      // Fallback to localStorage for unauthenticated
      const updated = [...customLocations, trimmedLocation];
      setCustomLocations(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(STORAGE_EVENT));
      return true;
    }
    // Insert into Supabase
    const { error } = await supabase.from('storage_locations').insert({
      user_id: user.id,
      location_name: trimmedLocation,
    });
    if (error) {
      console.warn('Failed to add storage location to Supabase:', error);
      return false;
    }
    const updated = [...customLocations, trimmedLocation];
    setCustomLocations(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(STORAGE_EVENT));
    return true;
  }, [user, customLocations]);

  // Remove a custom location (Supabase + local cache)
  const removeCustomLocation = useCallback(async (location: string) => {
    if (!user) {
      const updated = customLocations.filter(loc => loc !== location);
      setCustomLocations(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(STORAGE_EVENT));
      return;
    }
    const { error } = await supabase
      .from('storage_locations')
      .delete()
      .eq('user_id', user.id)
      .eq('location_name', location);
    if (error) {
      console.warn('Failed to remove storage location from Supabase:', error);
      return;
    }
    const updated = customLocations.filter(loc => loc !== location);
    setCustomLocations(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }, [user, customLocations]);

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
    isCustomLocation: (location: string) => customLocations.includes(location),
    loading,
  };
};