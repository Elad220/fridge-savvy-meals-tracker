import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search, Tag, TrendingUp, Clock, Plus } from 'lucide-react';
import { useTags, SavedTag } from '@/hooks/useTags';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TagManager = ({ isOpen, onClose }: TagManagerProps) => {
  const { savedTags, removeTag, addTag } = useTags();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'food' | 'recipe' | 'general'>('all');
  const [sortBy, setSortBy] = useState<'usage' | 'name' | 'recent'>('usage');
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<'food' | 'recipe' | 'general'>('general');

  const filteredTags = savedTags
    .filter(tag => {
      const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || tag.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return b.lastUsed.getTime() - a.lastUsed.getTime();
        default:
          return 0;
      }
    });

  const handleAddTag = () => {
    if (newTagName.trim()) {
      addTag(newTagName.trim(), newTagCategory);
      setNewTagName('');
      setNewTagCategory('general');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    removeTag(tagId);
  };

  const getCategoryStats = () => {
    const stats = {
      food: 0,
      recipe: 0,
      general: 0,
      total: savedTags.length,
    };

    savedTags.forEach(tag => {
      stats[tag.category]++;
    });

    return stats;
  };

  const stats = getCategoryStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Tag Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Tags</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.food}</div>
                  <div className="text-sm text-muted-foreground">Food Tags</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.recipe}</div>
                  <div className="text-sm text-muted-foreground">Recipe Tags</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.general}</div>
                  <div className="text-sm text-muted-foreground">General Tags</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add New Tag */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Tag</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="newTagName">Tag Name</Label>
                  <Input
                    id="newTagName"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="newTagCategory">Category</Label>
                  <Select value={newTagCategory} onValueChange={(value: 'food' | 'recipe' | 'general') => setNewTagCategory(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="recipe">Recipe</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddTag} disabled={!newTagName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tag
              </Button>
            </CardContent>
          </Card>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manage Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tags..."
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="categoryFilter">Category</Label>
                  <Select value={categoryFilter} onValueChange={(value: 'all' | 'food' | 'recipe' | 'general') => setCategoryFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="recipe">Recipe</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sortBy">Sort By</Label>
                  <Select value={sortBy} onValueChange={(value: 'usage' | 'name' | 'recent') => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usage">Most Used</SelectItem>
                      <SelectItem value="name">Alphabetical</SelectItem>
                      <SelectItem value="recent">Recently Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Tags ({filteredTags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tags found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {filteredTags.map((tag) => (
                      <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                 <div className="flex items-center gap-3">
                           <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize">
                             {tag.category}
                           </span>
                          <span className="font-medium">{tag.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <TrendingUp className="w-4 h-4" />
                            {tag.usageCount} uses
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {tag.lastUsed.toLocaleDateString()}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTag(tag.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};