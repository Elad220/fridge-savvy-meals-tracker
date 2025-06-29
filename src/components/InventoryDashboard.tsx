import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FoodItem, FreshnessStatus } from '@/types';
import { FoodItemCard } from '@/components/FoodItemCard';
import { PhotoAnalysis } from '@/components/PhotoAnalysis';
import { PhotoAnalysisButton } from '@/components/PhotoAnalysisButton';
import { Filter, Search as SearchIcon, SlidersHorizontal, X, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InventoryDashboardProps {
  foodItems: FoodItem[];
  onRemoveItem: (id: string) => void;
  onEditItem: (item: FoodItem) => void;
  onAddItem?: (item: Omit<FoodItem, 'id' | 'userId'>) => void;
  userId?: string;
  onNavigateToSettings: () => void;
}

export const InventoryDashboard = ({
  foodItems,
  onRemoveItem,
  onEditItem,
  onAddItem,
  userId,
  onNavigateToSettings,
}: InventoryDashboardProps) => {
  const [sortBy, setSortBy] = useState<'eatByDate' | 'name' | 'storageLocation'>('eatByDate');
  const [filterBy, setFilterBy] = useState<FreshnessStatus | 'all'>('all');
  const [foodTypeFilter, setFoodTypeFilter] = useState<'all' | 'cooked meal' | 'raw material'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPhotoAnalysis, setShowPhotoAnalysis] = useState(false);
  
  // Ref for photo analysis
  const isInitialRender = useRef(true);

  // Memoize the callback to prevent unnecessary re-renders
  const handleOpenPhotoAnalysis = useCallback(() => {
    setShowPhotoAnalysis(true);
  }, []);

  // Handle the analysis completion
  const handleAnalysisComplete = useCallback((item: Omit<FoodItem, 'id' | 'userId'>) => {
    // The item is already in the correct format, just pass it through
    if (onAddItem) {
      onAddItem(item);
    }
    setShowPhotoAnalysis(false);
  }, [onAddItem]);

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

  const handlePhotoAnalysisComplete = (analysisData: {
    suggested_name: string;
    item_type: 'cooked_meal' | 'raw_material';
    expiration_date: string | null;
    confidence: string;
  }) => {
    if (!onAddItem) return;

    const today = new Date();
    const eatByDate = analysisData.expiration_date 
      ? new Date(analysisData.expiration_date)
      : new Date(today.getTime() + (4 * 24 * 60 * 60 * 1000));

    const newItem: Omit<FoodItem, 'id' | 'userId'> = {
      name: analysisData.suggested_name,
      dateCookedStored: today,
      eatByDate: eatByDate,
      quantity: '1',
      storageLocation: 'Refrigerator',
      label: analysisData.item_type === 'cooked_meal' ? 'cooked meal' : 'raw material',
      notes: `AI analyzed with ${analysisData.confidence} confidence`,
      freshnessDays: analysisData.expiration_date ? undefined : 4,
    };

    onAddItem(newItem);
  };

  const filteredAndSortedItems = foodItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.storageLocation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFreshness = filterBy === 'all' || getFreshnessStatus(item.eatByDate) === filterBy;
      
      const matchesFoodType = foodTypeFilter === 'all' || item.label === foodTypeFilter;
      
      return matchesSearch && matchesFreshness && matchesFoodType;
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



  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <div className="bg-green-50 dark:bg-green-950/20 p-3 md:p-4 rounded-lg shadow-sm border">
            <div className="text-lg md:text-2xl font-bold text-green-700 dark:text-green-400">{statusCounts.fresh}</div>
            <div className="text-xs text-green-600 dark:text-green-500">Fresh</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 md:p-4 rounded-lg shadow-sm border">
            <div className="text-lg md:text-2xl font-bold text-yellow-700 dark:text-yellow-400">{statusCounts['use-soon']}</div>
            <div className="text-xs text-yellow-600 dark:text-yellow-500">Use Soon</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/20 p-3 md:p-4 rounded-lg shadow-sm border">
            <div className="text-lg md:text-2xl font-bold text-orange-700 dark:text-orange-400">{statusCounts['use-or-throw']}</div>
            <div className="text-xs text-orange-600 dark:text-orange-500">Use or Throw</div>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 p-3 md:p-4 rounded-lg shadow-sm border">
            <div className="text-lg md:text-2xl font-bold text-red-700 dark:text-red-400">{statusCounts.expired}</div>
            <div className="text-xs text-red-600 dark:text-red-500">Expired</div>
          </div>
        </div>
        
        <div className="bg-card p-2 rounded-lg shadow-sm border max-w-md mx-auto -mb-2">
          <div className="text-2xl md:text-3xl font-bold text-foreground text-center">{foodItems.length}</div>
          <div className="text-sm text-muted-foreground text-center">Total Items</div>
        </div>
      </div>

      <div className="text-center min-h-[28px] flex items-center justify-center -mt-1">
        {userId && onAddItem && (
          <PhotoAnalysisButton
            onOpen={handleOpenPhotoAnalysis}
            onNavigateToSettings={onNavigateToSettings}
            disabled={!userId || !onAddItem}
          />
        )}
      </div>

      <div className="bg-card p-3 md:p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items..."
              className="w-full bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eatByDate">Eat By Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="storageLocation">Storage Location</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="fresh">Fresh</SelectItem>
                <SelectItem value="use-soon">Use Soon</SelectItem>
                <SelectItem value="use-or-throw">Use or Throw</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={foodTypeFilter} onValueChange={(value: any) => setFoodTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Food Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cooked meal">Cooked Meals</SelectItem>
                <SelectItem value="raw material">Raw Materials</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg shadow-sm border">
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
            <FoodItemCard
              key={item.id}
              item={item}
              onRemove={() => onRemoveItem(item.id)}
              onEdit={() => onEditItem(item)}
            />
          ))}
        </div>
      )}

{showPhotoAnalysis && (
        <PhotoAnalysis
          key={`photo-analysis-${userId || 'no-user'}`}
          isOpen={showPhotoAnalysis}
          onClose={() => setShowPhotoAnalysis(false)}
          onAnalysisComplete={handleAnalysisComplete}
          userId={userId || ''}
        />
      )}
    </div>
  );
};