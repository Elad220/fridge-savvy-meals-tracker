import { useState, useMemo } from 'react';
import { MealPlan, FoodItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Edit, Clock, PackagePlus, BellPlus, Search as SearchIcon, ExternalLink } from 'lucide-react';
import { MoveToInventoryModal } from './MoveToInventoryModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { generateMealPlanICS } from '@/lib/calendar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface MealPlanningProps {
  mealPlans: MealPlan[];
  foodItems: FoodItem[];
  onRemoveMealPlan: (id: string) => void;
  onAddMealPlan: (meal: Omit<MealPlan, 'id' | 'userId'>) => void;
  onEditMealPlan: (meal: MealPlan) => void;
  onNavigateToSettings: () => void;
  onMoveToInventory: (meal: MealPlan, foodItem: Omit<FoodItem, 'id' | 'userId'>) => void;
  userId: string;
}

export const MealPlanning = ({ 
  mealPlans, 
  foodItems, 
  onRemoveMealPlan, 
  onAddMealPlan, 
  onEditMealPlan, 
  onNavigateToSettings,
  onMoveToInventory,
  userId
}: MealPlanningProps) => {
  const [moveToInventoryModalOpen, setMoveToInventoryModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);
  const [sortBy, setSortBy] = useState<'plannedDate' | 'name' | 'destinationTime'>('plannedDate');
  const [filterBy, setFilterBy] = useState<'all' | 'upcoming' | 'overdue' | 'today'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const handleMoveToInventoryInit = (meal: MealPlan) => {
    setSelectedMeal(meal);
    setMoveToInventoryModalOpen(true);
  };

  const handleMoveToInventoryConfirm = (item: Omit<FoodItem, 'id' | 'userId'>) => {
    if (selectedMeal) {
      onMoveToInventory(selectedMeal, item);
      setMoveToInventoryModalOpen(false);
      setSelectedMeal(null);
    }
  };

  const handleAddReminder = (meal: MealPlan) => {
    const icsContent = generateMealPlanICS(meal);

    if (!icsContent) {
      toast({
        title: 'Date missing',
        description: 'Please set a date for this meal before creating a reminder.',
      });
      return;
    }

    const blob = new Blob([icsContent], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meal.name.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Reminder created',
      description: 'An event file has been downloaded. Open it to add the reminder to your calendar.',
    });
  };

  const isOverdue = (meal: MealPlan) => {
    if (!meal.destinationTime) return false;
    const now = new Date();
    const plannedDateTime = meal.destinationTime;
    return now > plannedDateTime;
  };

  const isToday = (meal: MealPlan) => {
    if (!meal.plannedDate) return false;
    const today = new Date();
    const mealDate = new Date(meal.plannedDate);
    return today.toDateString() === mealDate.toDateString();
  };

  const isUpcoming = (meal: MealPlan) => {
    if (!meal.plannedDate) return false;
    const today = new Date();
    const mealDate = new Date(meal.plannedDate);
    return mealDate > today;
  };

  const mealStats = useMemo(() => ({
    total: mealPlans.length,
    upcoming: mealPlans.filter(isUpcoming).length,
    overdue: mealPlans.filter(isOverdue).length,
    today: mealPlans.filter(isToday).length,
  }), [mealPlans]);

  const filteredAndSortedMeals = mealPlans
    .filter(meal => {
      const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (meal.notes && meal.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'upcoming' && isUpcoming(meal)) ||
                           (filterBy === 'overdue' && isOverdue(meal)) ||
                           (filterBy === 'today' && isToday(meal));
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'plannedDate':
          if (!a.plannedDate && !b.plannedDate) return 0;
          if (!a.plannedDate) return 1;
          if (!b.plannedDate) return -1;
          return a.plannedDate.getTime() - b.plannedDate.getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'destinationTime':
          if (!a.destinationTime && !b.destinationTime) return 0;
          if (!a.destinationTime) return 1;
          if (!b.destinationTime) return -1;
          return a.destinationTime.getTime() - b.destinationTime.getTime();
        default:
          return 0;
      }
    });

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
      const allItemIds = new Set(filteredAndSortedMeals.map(item => item.id));
      setSelectedItems(allItemIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkDelete = () => {
    selectedItems.forEach(itemId => {
      onRemoveMealPlan(itemId);
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
    <div className="space-y-4">
      {/* Quick stats overview - more compact */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Quick Overview</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implement detailed meal planning view
              toast({
                title: 'Coming Soon',
                description: 'Detailed meal planning view will be available soon.',
              });
            }}
            className="glass-button text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Details
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{mealStats.upcoming}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{mealStats.today}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">{mealStats.overdue}</div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">{mealStats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
        <div className="text-center pt-2 border-t border-border/50">
          <div className="text-2xl font-bold text-primary">{mealPlans.length}</div>
          <div className="text-sm text-muted-foreground">Total Meal Plans</div>
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
              onClick={() => handleSelectAll(selectedItems.size !== filteredAndSortedMeals.length)}
            >
              {selectedItems.size === filteredAndSortedMeals.length ? 'Deselect All' : 'Select All'}
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

      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search meal plans..."
              className="w-full bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
            <Select value={sortBy} onValueChange={(value: 'plannedDate' | 'name' | 'destinationTime') => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plannedDate">Planned Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="destinationTime">Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBy} onValueChange={(value: 'all' | 'upcoming' | 'overdue' | 'today') => setFilterBy(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meals</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Meal Plans List */}
      {filteredAndSortedMeals.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <div className="text-muted-foreground text-6xl mb-4">🍳</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No meal plans found</h3>
          <p className="text-muted-foreground">
            {mealPlans.length === 0 
              ? "Start by creating your first meal plan to stay organized."
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedMeals.map((meal) => (
            <div key={meal.id} className="relative">
              {isSelecting && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedItems.has(meal.id)}
                    onCheckedChange={(checked) => handleItemSelect(meal.id, checked as boolean)}
                    className="bg-white border-2 border-gray-300 shadow-sm"
                  />
                </div>
              )}
              <div className={`glass-card p-4 hover:shadow-md transition-all ${isOverdue(meal) ? 'border-red-500' : 'border-border'}`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-foreground text-lg">{meal.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${isOverdue(meal) ? 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400'}`}>
                    {isOverdue(meal) ? 'Overdue' : 'Planned'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {meal.plannedDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {meal.plannedDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {meal.destinationTime && (
                    <div className={`flex items-center text-sm ${isOverdue(meal) ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        {meal.destinationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {meal.notes && (
                  <div className="mb-4 p-2 bg-muted/50 rounded text-sm text-muted-foreground">
                    <strong>Notes:</strong> {meal.notes}
                  </div>
                )}

                {meal.ingredients && meal.ingredients.length > 0 && (
                  <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
                    <strong className="text-blue-700 dark:text-blue-300">Ingredients:</strong>
                    <div className="mt-1 text-blue-600 dark:text-blue-400">
                      {meal.ingredients.slice(0, 3).map((ingredient, index) => (
                        <span key={index} className="inline-block mr-2 mb-1">
                          {ingredient.name} ({ingredient.quantity} {ingredient.unit})
                        </span>
                      ))}
                      {meal.ingredients.length > 3 && (
                        <span className="text-blue-500 dark:text-blue-400">
                          +{meal.ingredients.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveToInventoryInit(meal)}
                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/20"
                    title={meal.ingredients && meal.ingredients.length > 0 
                      ? `Move to inventory and consume ${meal.ingredients.length} ingredients` 
                      : "Move to inventory"}
                  >
                    <PackagePlus className="w-4 h-4 mr-1" />
                    To Inventory
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <span className="ml-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1 rounded">
                        {meal.ingredients.length}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditMealPlan(meal)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddReminder(meal)}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                  >
                    <BellPlus className="w-4 h-4 mr-1" />
                    Add Reminder
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Meal Plan</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove "{meal.name}" from your meal plans? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onRemoveMealPlan(meal.id)} className="bg-red-600 hover:bg-red-700">
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMeal && (
        <MoveToInventoryModal
          isOpen={moveToInventoryModalOpen}
          onClose={() => {
            setMoveToInventoryModalOpen(false);
            setSelectedMeal(null);
          }}
          onSubmit={handleMoveToInventoryConfirm}
          initialData={{
            name: selectedMeal.name,
            notes: selectedMeal.notes,
            plannedDate: selectedMeal.plannedDate,
            ingredients: selectedMeal.ingredients
          }}
        />
      )}


    </div>
  );
};