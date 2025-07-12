import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Tag, TrendingUp } from 'lucide-react';
import { useTags, SavedTag } from '@/hooks/useTags';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  category?: 'food' | 'recipe' | 'general';
  maxTags?: number;
  className?: string;
}

export const TagInput = ({
  tags,
  onTagsChange,
  placeholder = "Add tags...",
  category = 'general' as const,
  maxTags = 10,
  className = "",
}: TagInputProps) => {
  const [tagInput, setTagInput] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { useTag, getFrequentTags, searchTags } = useTags();

  const frequentTags = getFrequentTags(category);
  const searchResults = searchQuery ? searchTags(searchQuery, category) : [];

  const handleAddTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();
    if (!trimmedTag || tags.includes(trimmedTag) || tags.length >= maxTags) {
      return;
    }

    const newTags = [...tags, trimmedTag];
    onTagsChange(newTags);
    useTag(trimmedTag, category);
    setTagInput('');
    setIsPopoverOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  const handleInputKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Tab' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleTagSuggestionClick = (tag: SavedTag) => {
    handleAddTag(tag.name);
  };

  const handleQuickTagClick = (tagName: string) => {
    handleAddTag(tagName);
  };

  useEffect(() => {
    if (isPopoverOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPopoverOpen]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
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

      {/* Tag Input with Suggestions */}
      <div className="flex gap-2">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) {
                    setIsPopoverOpen(true);
                  }
                }}
                onKeyPress={handleInputKeyPress}
                placeholder={placeholder}
                className="pr-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAddTag(tagInput)}
                disabled={!tagInput.trim() || tags.includes(tagInput.trim()) || tags.length >= maxTags}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </PopoverTrigger>
          
          <PopoverContent className="w-80 p-0" align="start">
            <ScrollArea className="h-64">
              <div className="p-3 space-y-3">
                {/* Quick Tags */}
                {frequentTags.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      Frequently Used
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {frequentTags.slice(0, 8).map((tag) => (
                        <Button
                          key={tag.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleTagSuggestionClick(tag)}
                          disabled={tags.includes(tag.name)}
                          className="text-xs h-6 px-2"
                        >
                          {tag.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                      <Tag className="w-4 h-4" />
                      Saved Tags
                    </div>
                    <div className="space-y-1">
                      {searchResults.map((tag) => (
                        <Button
                          key={tag.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTagSuggestionClick(tag)}
                          disabled={tags.includes(tag.name)}
                          className="w-full justify-start h-8 text-sm"
                        >
                          <span className="flex-1 text-left">{tag.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {tag.usageCount} uses
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Tag */}
                {tagInput.trim() && !searchResults.some(tag => tag.name === tagInput.trim()) && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                      <Plus className="w-4 h-4" />
                      Add New Tag
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddTag(tagInput)}
                      className="w-full justify-start h-8 text-sm"
                    >
                      <span className="flex-1 text-left">"{tagInput.trim()}"</span>
                      <span className="text-xs text-muted-foreground ml-2">new tag</span>
                    </Button>
                  </div>
                )}

                {/* No Results */}
                {searchQuery && searchResults.length === 0 && !tagInput.trim() && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No saved tags found
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Tag Limit Warning */}
      {tags.length >= maxTags && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
};