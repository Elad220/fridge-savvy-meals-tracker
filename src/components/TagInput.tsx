import { useState, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSavedTags, TagCategory } from '@/hooks/useSavedTags';
import { Plus, X, Star, StarOff, Trash2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  category?: TagCategory;
  placeholder?: string;
  label?: string;
  className?: string;
  maxTags?: number;
  showSavedTags?: boolean;
  allowNewTags?: boolean;
}

export const TagInput = ({
  value = [],
  onChange,
  category = 'general',
  placeholder = 'Add tag',
  label = 'Tags',
  className,
  maxTags,
  showSavedTags = true,
  allowNewTags = true,
}: TagInputProps) => {
  const [tagInput, setTagInput] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const {
    savedTags,
    loading: savedTagsLoading,
    addSavedTag,
    toggleFavorite,
    deleteSavedTag,
    getPopularTags,
    getFavoriteTags,
  } = useSavedTags({ category });

  const popularTags = useMemo(() => getPopularTags(10), [getPopularTags]);
  const favoriteTags = useMemo(() => getFavoriteTags(), [getFavoriteTags]);

  const handleAddTag = useCallback(async (tagName: string) => {
    const trimmedTag = tagName.trim();
    if (!trimmedTag || value.includes(trimmedTag)) return;
    
    if (maxTags && value.length >= maxTags) return;

    const newTags = [...value, trimmedTag];
    onChange(newTags);
    setTagInput('');

    // Save to saved tags if enabled
    if (showSavedTags) {
      await addSavedTag(trimmedTag, category as TagCategory);
    }
  }, [value, onChange, maxTags, showSavedTags, addSavedTag, category]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  }, [value, onChange]);

  const handleTagKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  }, [tagInput, handleAddTag]);

  const handleSavedTagClick = useCallback(async (tagName: string) => {
    await handleAddTag(tagName);
  }, [handleAddTag]);

  const handleToggleFavorite = useCallback(async (tagId: string) => {
    await toggleFavorite(tagId);
  }, [toggleFavorite]);

  const handleDeleteSavedTag = useCallback(async (tagId: string) => {
    await deleteSavedTag(tagId);
  }, [deleteSavedTag]);

  const availableTags = useMemo(() => {
    const allTags = [...popularTags, ...favoriteTags];
    return allTags.filter(tag => !value.includes(tag.tag_name));
  }, [popularTags, favoriteTags, value]);

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      
      <div className="flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyPress={handleTagKeyPress}
          placeholder={placeholder}
          className="flex-1"
          disabled={maxTags ? value.length >= maxTags : false}
        />
        
        {allowNewTags && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAddTag(tagInput)}
            disabled={!tagInput.trim() || (maxTags ? value.length >= maxTags : false)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}

        {showSavedTags && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={savedTagsLoading}
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Saved Tags</h4>
                  {savedTagsLoading && (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  )}
                </div>
                
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {availableTags.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No saved tags available
                      </div>
                    ) : (
                      availableTags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
                        >
                          <Button
                            variant="ghost"
                            className="flex-1 justify-start h-auto p-0"
                            onClick={() => handleSavedTagClick(tag.tag_name)}
                          >
                            <span className="text-sm">{tag.tag_name}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {tag.usage_count}
                            </Badge>
                          </Button>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleFavorite(tag.id)}
                              className="h-6 w-6 p-0"
                            >
                              {tag.is_favorite ? (
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <StarOff className="w-3 h-3" />
                              )}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSavedTag(tag.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveTag(tag)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      {maxTags && (
        <div className="text-xs text-muted-foreground">
          {value.length} / {maxTags} tags
        </div>
      )}
    </div>
  );
};