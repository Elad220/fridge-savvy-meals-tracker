import { MealPlan, FoodItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Edit, Clock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RecipeGenerator } from './RecipeGenerator';

interface MealPlanningProps {
  mealPlans: MealPlan[];
  foodItems: FoodItem[];
  onRemoveMealPlan: (id: string) => void;
  onAddMealPlan: (meal: Omit<MealPlan, 'id' | 'userId'>) => void;
  onEditMealPlan: (meal: MealPlan) => void;
  onNavigateToSettings: () => void;
}

export const MealPlanning = ({ mealPlans, foodItems, onRemoveMealPlan, onAddMealPlan, onEditMealPlan, onNavigateToSettings }: MealPlanningProps) => {
  const sortedMealPlans = [...mealPlans].sort((a, b) => {
    if (!a.plannedDate && !b.plannedDate) return 0;
    if (!a.plannedDate) return 1;
    if (!b.plannedDate) return -1;
    return a.plannedDate.getTime() - b.plannedDate.getTime();
  });

  const isOverdue = (meal: MealPlan) => {
    if (!meal.destinationTime) return false;
    // Check if the planned date is today or in the past, and the time is also in the past.
    const now = new Date();
    const plannedDateTime = meal.destinationTime;
    return now > plannedDateTime;
  }

  return (
    <div className="space-y-6">
      {/* Recipe Generator */}
      <RecipeGenerator foodItems={foodItems} onAddMealPlan={onAddMealPlan} onNavigateToSettings={onNavigateToSettings} />

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-foreground">{mealPlans.length}</div>
          <div className="text-sm text-muted-foreground">Total Planned Meals</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {mealPlans.filter(meal => meal.plannedDate && meal.plannedDate >= new Date()).length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-500">Upcoming Meals</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
            {mealPlans.filter(isOverdue).length}
          </div>
          <div className="text-sm text-red-600 dark:text-red-500">Overdue Meals</div>
        </div>
      </div>

      {/* Meal Plans List */}
      {sortedMealPlans.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg shadow-sm border">
          <div className="text-muted-foreground text-6xl mb-4">🍳</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No meal plans yet</h3>
          <p className="text-muted-foreground mb-4">Start planning your meals to stay organized and reduce food waste.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMealPlans.map((meal) => (
            <div key={meal.id} className={`bg-card border-2 rounded-lg p-4 hover:shadow-md transition-all ${isOverdue(meal) ? 'border-red-500' : 'border-border'}`}>
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

              <div className="flex justify-end gap-2">
                 <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditMealPlan(meal)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
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
          ))}
        </div>
      )}
    </div>
  );
};