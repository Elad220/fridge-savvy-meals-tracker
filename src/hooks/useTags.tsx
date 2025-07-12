import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface SavedTag {
  id: string;
  name: string;
  category: 'food' | 'recipe' | 'general';
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
}

export const useTags = () => {
  const { user } = useAuth();
  const [savedTags, setSavedTags] = useState<SavedTag[]>([]);
  const [loading, setLoading] = useState(false);

  // Load saved tags from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`savedTags_${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          const tagsWithDates = parsed.map((tag: any) => ({
            ...tag,
            lastUsed: new Date(tag.lastUsed),
            createdAt: new Date(tag.createdAt),
          }));
          setSavedTags(tagsWithDates);
        } catch (error) {
          console.error('Error loading saved tags:', error);
        }
      }
    }
  }, [user]);

  // Save tags to localStorage
  const saveTagsToStorage = (tags: SavedTag[]) => {
    if (user) {
      localStorage.setItem(`savedTags_${user.id}`, JSON.stringify(tags));
    }
  };

  // Add a new tag
  const addTag = (name: string, category: 'food' | 'recipe' | 'general' = 'general') => {
    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) return false;

    // Check if tag already exists
    const existingTag = savedTags.find(tag => tag.name === trimmedName);
    if (existingTag) {
      // Update usage count and last used
      const updatedTags = savedTags.map(tag =>
        tag.id === existingTag.id
          ? { ...tag, usageCount: tag.usageCount + 1, lastUsed: new Date() }
          : tag
      );
      setSavedTags(updatedTags);
      saveTagsToStorage(updatedTags);
      return true;
    }

    const newTag: SavedTag = {
      id: crypto.randomUUID(),
      name: trimmedName,
      category,
      usageCount: 1,
      lastUsed: new Date(),
      createdAt: new Date(),
    };

    const updatedTags = [...savedTags, newTag];
    setSavedTags(updatedTags);
    saveTagsToStorage(updatedTags);
    return true;
  };

  // Remove a tag
  const removeTag = (id: string) => {
    const updatedTags = savedTags.filter(tag => tag.id !== id);
    setSavedTags(updatedTags);
    saveTagsToStorage(updatedTags);
  };

  // Update tag usage
  const useTag = (name: string, category: 'food' | 'recipe' | 'general' = 'general') => {
    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) return;

    const existingTag = savedTags.find(tag => tag.name === trimmedName);
    if (existingTag) {
      // Update usage count and last used
      const updatedTags = savedTags.map(tag =>
        tag.id === existingTag.id
          ? { ...tag, usageCount: tag.usageCount + 1, lastUsed: new Date() }
          : tag
      );
      setSavedTags(updatedTags);
      saveTagsToStorage(updatedTags);
    } else {
      // Add new tag
      addTag(trimmedName, category);
    }
  };

  // Get tags by category
  const getTagsByCategory = (category: 'food' | 'recipe' | 'general') => {
    return savedTags
      .filter(tag => tag.category === category || tag.category === 'general')
      .sort((a, b) => b.usageCount - a.usageCount || b.lastUsed.getTime() - a.lastUsed.getTime());
  };

  // Get all tags sorted by usage
  const getAllTags = () => {
    return savedTags.sort((a, b) => b.usageCount - a.usageCount || b.lastUsed.getTime() - a.lastUsed.getTime());
  };

  // Get frequently used tags (top 10)
  const getFrequentTags = (category?: 'food' | 'recipe' | 'general') => {
    const tags = category ? getTagsByCategory(category) : getAllTags();
    return tags.slice(0, 10);
  };

  // Search tags
  const searchTags = (query: string, category?: 'food' | 'recipe' | 'general') => {
    const tags = category ? getTagsByCategory(category) : getAllTags();
    const searchTerm = query.toLowerCase();
    return tags.filter(tag => tag.name.includes(searchTerm));
  };

  return {
    savedTags,
    loading,
    addTag,
    removeTag,
    useTag,
    getTagsByCategory,
    getAllTags,
    getFrequentTags,
    searchTags,
  };
};