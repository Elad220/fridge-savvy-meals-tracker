
import { useState } from 'react';
import { FoodItem, FreshnessStatus } from '@/types';
import { FoodItemCard } from '@/components/FoodItemCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface InventoryDashboardProps {
  foodItems: FoodItem[];
  onRemoveItem: (id: string) => void;
  onEditItem: (item: FoodItem) => void;
}

export const InventoryDashboard = ({ foodItems, onRemoveItem, onEditItem }: InventoryDashboardProps) => {
  const [sortBy, setSortBy] = useState<'eatByDate' | 'name' | 'storageLocation'>('eatByDate');
  const [filterBy, setFilterBy] = useState<FreshnessStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getFreshnessStatus = (eatByDate: Date): FreshnessStatus => {
    const today = new Date();
    const diffTime = eatByDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 2) return 'use-soon';
    return 'fresh';
  };

  const filteredAndSortedItems = foodItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.storageLocation.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterBy === 'all') return matchesSearch;
      
      const status = getFreshnessStatus(item.eatByDate);
      return matchesSearch && status === filterBy;
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

  const statusCounts = {
    fresh: foodItems.filter(item => getFreshnessStatus(item.eatByDate) === 'fresh').length,
    'use-soon': foodItems.filter(item => getFreshnessStatus(item.eatByDate) === 'use-soon').length,
    expired: foodItems.filter(item => getFreshnessStatus(item.eatByDate) === 'expired').length,
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm">
          <div className="text-lg md:text-2xl font-bold text-gray-900">{foodItems.length}</div>
          <div className="text-xs text-gray-600">Total Items</div>
        </div>
        <div className="bg-green-50 p-3 md:p-4 rounded-lg shadow-sm">
          <div className="text-lg md:text-2xl font-bold text-green-700">{statusCounts.fresh}</div>
          <div className="text-xs text-green-600">Fresh Items</div>
        </div>
        <div className="bg-yellow-50 p-3 md:p-4 rounded-lg shadow-sm">
          <div className="text-lg md:text-2xl font-bold text-yellow-700">{statusCounts['use-soon']}</div>
          <div className="text-xs text-yellow-600">Use Soon</div>
        </div>
        <div className="bg-red-50 p-3 md:p-4 rounded-lg shadow-sm">
          <div className="text-lg md:text-2xl font-bold text-red-700">{statusCounts.expired}</div>
          <div className="text-xs text-red-600">Expired</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search food items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Food Items Grid */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-gray-400 text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No food items found</h3>
          <p className="text-gray-600">
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
              status={getFreshnessStatus(item.eatByDate)}
              onRemove={() => onRemoveItem(item.id)}
              onEdit={() => onEditItem(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
