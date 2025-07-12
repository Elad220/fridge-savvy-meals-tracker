import { useState, useMemo } from 'react';
import { FoodItem, FreshnessStatus } from '@/types';
import { FoodItemCard } from '@/components/FoodItemCard';
import { RecentActionsCard } from '@/components/RecentActionsCard';
import { ActionHistoryItem } from '@/hooks/useActionHistory';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search as SearchIcon, Trash2, ExternalLink } from 'lucide-react';

interface InventoryDashboardProps {
  foodItems: FoodItem[];
  onRemoveItem: (id: string) => void;
  onEditItem: (item: FoodItem) => void;
  onAddItem?: (item: Omit<FoodItem, 'id' | 'userId'>) => void;
  userId?: string;
  onNavigateToSettings: () => void;
  recentActions: ActionHistoryItem[];
  historyLoading: boolean;
  refetchHistory: () => void;
}

export const InventoryDashboard = ({
  foodItems,
  onRemoveItem,
  onEditItem,
  onAddItem,
  userId,
  onNavigateToSettings,
  recentActions,
  historyLoading,
  refetchHistory,
}: InventoryDashboardProps) => {
  const [sortBy, setSortBy] = useState<'eatByDate' | 'name' | 'storageLocation'>('eatByDate');
  const [filterBy, setFilterBy] = useState<FreshnessStatus | 'all'>('all');
  const [foodTypeFilter, setFoodTypeFilter] = useState<'all' | 'cooked meal' | 'raw material'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const getFreshnessStatus = (eatByDate: Date): FreshnessStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiryDate = new Date(eatByDate);
    expiryDate.setHours(0, 0, 0, 0);
    
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays === 0) return 'use-or-throw';
    if (diffDays <= 2) return 'use-soon';
    return 'fresh';
  };

  const filteredAndSortedItems = foodItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.storageLocation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFreshness = filterBy === 'all' || getFreshnessStatus(item.eatByDate) === filterBy;
      
      const matchesFoodType = foodTypeFilter === 'all' || item.label === foodTypeFilter;
      
      const matchesTag = tagFilter === 'all' || 
        (item.tags && item.tags.length > 0 && item.tags.includes(tagFilter));
      
      return matchesSearch && matchesFreshness && matchesFoodType && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'eatByDate':
          return a.eatByDate.getTime() - b.eatByDate.getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'storageLocation':
          return a.storageLocation.localeCompare(b.storageLocation);
        default:
          return 0;
      }
    });

  const statusCounts = useMemo(() => ({
    total: foodItems.length,
    fresh: foodItems.filter(item => getFreshnessStatus(item.eatByDate) === 'fresh').length,
    'use-soon': foodItems.filter(item => getFreshnessStatus(item.eatByDate) === 'use-soon').length,
    'use-or-throw': foodItems.filter(item => getFreshnessStatus(item.eatByDate) === 'use-or-throw').length,
    expired: foodItems.filter(item => getFreshnessStatus(item.eatByDate) === 'expired').length,
  }), [foodItems]);

  const handleItemSelect = (itemId: string, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems);
    if (checked) {
      newSelectedItems.add(itemId);
    } else {
      newSelectedItems.delete(itemId);
    }
    setSelectedItems(newSelectedItems);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allItemIds = new Set(filteredAndSortedItems.map(item => item.id));
      setSelectedItems(allItemIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkDelete = () => {
    selectedItems.forEach(itemId => {
      onRemoveItem(itemId);
    });
    setSelectedItems(new Set());
    setIsSelecting(false);
  };

  const toggleSelectionMode = () => {
    setIsSelecting(!isSelecting);
    if (isSelecting) {
      setSelectedItems(new Set());
    }
  };

  return (
    <div className="space-y-4">{/* Quick stats overview - more compact */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Quick Overview</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const event = new CustomEvent('openDashboardWindow', { 
                detail: { statusCounts, recentActions, historyLoading, userId }
              });
              window.dispatchEvent(event);
            }}
            className="glass-button text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Details
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{statusCounts.fresh}</div>
            <div className="text-xs text-muted-foreground">Fresh</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">{statusCounts['use-soon']}</div>
            <div className="text-xs text-muted-foreground">Use Soon</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">{statusCounts['use-or-throw']}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">{statusCounts.expired}</div>
            <div className="text-xs text-muted-foreground">Expired</div>
          </div>
        </div>
        <div className="text-center pt-2 border-t border-border/50">
          <div className="text-2xl font-bold text-primary">{foodItems.length}</div>
          <div className="text-sm text-muted-foreground">Total Items</div>
        </div>
      </div>

      {/* Bulk selection controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSelectionMode}
          className="flex items-center gap-2"
        >
          <Checkbox checked={isSelecting} />
          {isSelecting ? 'Cancel Selection' : 'Select Items'}
        </Button>
        
        {isSelecting && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(selectedItems.size !== filteredAndSortedItems.length)}
            >
              {selectedItems.size === filteredAndSortedItems.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            {selectedItems.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedItems.size})
              </Button>
            )}
          </>
        )}
      </div>

      <div className="glass-card p-2">
        <div className="flex flex-row gap-1 items-center flex-wrap">
          <div className="relative flex-1 min-w-[150px]">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground flex-shrink-0" />
            <Input
              type="search"
              placeholder="Search items..."
              className="w-full bg-background pl-9 pr-9 py-1 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted-foreground flex-shrink-0 focus:outline-none"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm2.12-10.12a1 1 0 10-1.41-1.41L10 8.59 9.29 7.88a1 1 0 10-1.41 1.41L8.59 10l-.71.71a1 1 0 101.41 1.41L10 11.41l.71.71a1 1 0 001.41-1.41L11.41 10l.71-.71z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-28 py-1 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eatByDate">Eat By Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="storageLocation">Storage Location</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-28 py-1 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="fresh">Fresh</SelectItem>
              <SelectItem value="use-soon">Use Soon</SelectItem>
              <SelectItem value="use-or-throw">Use or Throw</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={foodTypeFilter} onValueChange={setFoodTypeFilter}>
            <SelectTrigger className="w-28 py-1 text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cooked meal">Cooked Meals</SelectItem>
              <SelectItem value="raw material">Raw Materials</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-28 py-1 text-sm">
              <SelectValue placeholder="Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {Array.from(new Set(foodItems.flatMap(item => item.tags || []))).map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <div className="text-muted-foreground text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No food items found</h3>
          <p className="text-muted-foreground">
            {foodItems.length === 0 
              ? "Start by adding your first food item to track."
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedItems.map((item) => (
            <div key={item.id} className="relative">
              {isSelecting && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                    className="bg-white border-2 border-gray-300 shadow-sm"
                  />
                </div>
              )}
              <FoodItemCard
                item={item}
                onRemove={() => onRemoveItem(item.id)}
                onEdit={() => onEditItem(item)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
