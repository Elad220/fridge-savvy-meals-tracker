import { useState, useMemo } from 'react';
import { FoodItem, FreshnessStatus } from '@/types';
import { FoodItemCard } from '@/components/FoodItemCard';
import { RecentActionsCard } from '@/components/RecentActionsCard';
import { ActionHistoryItem } from '@/hooks/useActionHistory';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search as SearchIcon, Trash2, ExternalLink, X, Calendar, Package, MapPin, Edit, Utensils, Carrot } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const getStatusConfig = (status: FreshnessStatus) => {
    const statusConfig: Record<FreshnessStatus, { textColor: string }> = {
      fresh: { textColor: 'text-green-600' },
      'use-soon': { textColor: 'text-yellow-600' },
      'use-or-throw': { textColor: 'text-orange-600' },
      expired: { textColor: 'text-red-600' }
    };
    return statusConfig[status];
  };

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
    <div className="space-y-2">{/* Quick stats overview - more compact */}
      <div className="glass-card border-2 border-green-400/30 p-2 md:p-3 space-y-2 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground gradient-text">Quick Overview</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const event = new CustomEvent('openDashboardWindow', { 
                detail: { statusCounts, recentActions, historyLoading, userId }
              });
              window.dispatchEvent(event);
            }}
            className="glass-button text-xs px-2 py-1"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Details
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{statusCounts.fresh}</div>
            <div className="text-xs text-muted-foreground">Fresh</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">{statusCounts['use-soon']}</div>
            <div className="text-xs text-muted-foreground">Use Soon</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{statusCounts['use-or-throw']}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{statusCounts.expired}</div>
            <div className="text-xs text-muted-foreground">Expired</div>
          </div>
        </div>
        <div className="text-center pt-1 border-t border-green-300/30">
          <div className="text-xl font-bold text-primary">{foodItems.length}</div>
          <div className="text-xs text-muted-foreground">Total Items</div>
        </div>
      </div>

      {/* Bulk selection controls */}
      <div className="flex flex-wrap gap-1 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSelectionMode}
          className="flex items-center gap-1 px-2 py-1"
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
              className="px-2 py-1"
            >
              {selectedItems.size === filteredAndSortedItems.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            {selectedItems.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-2 py-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedItems.size})
              </Button>
            )}
          </>
        )}
      </div>

      <div className="glass-card p-1">
        <div className="flex flex-row gap-1 items-center flex-wrap">
          <div className="relative flex-1 min-w-[150px]">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground flex-shrink-0" />
            <Input
              type="search"
              placeholder="Search items..."
              className="w-full bg-background pl-8 pr-8 py-1 text-sm rounded-md"
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
          <Select value={sortBy} onValueChange={v => setSortBy(v as 'eatByDate' | 'name' | 'storageLocation')}>
            <SelectTrigger className="w-24 py-1 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eatByDate">Eat By Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="storageLocation">Storage Location</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={v => setFilterBy(v as FreshnessStatus | 'all')}>
            <SelectTrigger className="w-24 py-1 text-xs">
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
          <Select value={foodTypeFilter} onValueChange={v => setFoodTypeFilter(v as 'all' | 'cooked meal' | 'raw material')}>
            <SelectTrigger className="w-24 py-1 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cooked meal">Cooked Meals</SelectItem>
              <SelectItem value="raw material">Raw Materials</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-24 py-1 text-xs">
              <SelectValue placeholder="Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {(() => {
                // Calculate tag counts
                const tagCounts = new Map<string, number>();
                foodItems.forEach(item => {
                  if (item.tags) {
                    item.tags.forEach(tag => {
                      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                    });
                  }
                });
                
                return Array.from(tagCounts.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([tag, count]) => (
                    <SelectItem key={tag} value={tag}>
                      {tag} ({count})
                    </SelectItem>
                  ));
              })()}
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
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
              <div 
                onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)} 
                className="cursor-pointer relative"
              >
                <FoodItemCard
                  item={item}
                  onRemove={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  onEdit={(e) => {
                    e.stopPropagation();
                    onEditItem(item);
                  }}
                  compact={expandedCard !== item.id}
                  isExpanded={expandedCard === item.id}
                />
              </div>
              <Dialog open={expandedCard === item.id} onOpenChange={(open) => !open && setExpandedCard(null)}>
                <DialogContent className="sm:max-w-md glass-card border-2 border-green-400/40">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-foreground">{item.name}</span>
                      <span className={`${getStatusConfig(getFreshnessStatus(item.eatByDate)).textColor} px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30`}>
                        {getFreshnessStatus(item.eatByDate) === 'fresh' ? 'Fresh' : 
                         getFreshnessStatus(item.eatByDate) === 'use-soon' ? 'Use Soon' :
                         getFreshnessStatus(item.eatByDate) === 'use-or-throw' ? 'Use or Throw' : 'Expired'}
                      </span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        {item.label === 'cooked meal' ? (
                          <Utensils className="w-4 h-4 mr-2 text-amber-600" />
                        ) : (
                          <Carrot className="w-4 h-4 mr-2 text-green-600" />
                        )}
                        <span className="font-medium">
                          {item.label === 'cooked meal' ? 'Cooked Meal' : 'Raw Material'}
                        </span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Package className="w-4 h-4 mr-2" />
                        <span>{item.amount} {item.unit}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          Eat by: {item.eatByDate.toLocaleDateString()}
                          {(() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const expiryDate = new Date(item.eatByDate);
                            expiryDate.setHours(0, 0, 0, 0);
                            const timeDiff = expiryDate.getTime() - today.getTime();
                            const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                            const status = getFreshnessStatus(item.eatByDate);
                            const config = getStatusConfig(status);
                            
                            return daysUntilExpiry >= 0 ? (
                              <span className={`ml-2 ${config.textColor} font-medium`}>
                                ({daysUntilExpiry === 0 ? 'Today' : daysUntilExpiry === 1 ? 'Tomorrow' : `${daysUntilExpiry} days`})
                              </span>
                            ) : (
                              <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                                ({Math.abs(daysUntilExpiry)} days ago)
                              </span>
                            );
                          })()}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{item.storageLocation}</span>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="p-3 bg-background/50 rounded-lg text-sm text-muted-foreground">
                        <strong>Notes:</strong> {item.notes}
                      </div>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-border/50">
                      <span className="text-sm text-muted-foreground">
                        Added: {item.dateCookedStored.toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setExpandedCard(null);
                            onEditItem(item);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Food Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove "{item.name}" from your inventory? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onRemoveItem(item.id)} className="bg-red-600 hover:bg-red-700">
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
