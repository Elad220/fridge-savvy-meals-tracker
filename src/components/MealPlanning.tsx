
import { MealPlan } from '@/types';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface MealPlanningProps {
  mealPlans: MealPlan[];
  onRemoveMealPlan: (id: string) => void;
  onAddMealPlan: (meal: Omit<MealPlan, 'id' | 'userId'>) => void;
}

export const MealPlanning = ({ mealPlans, onRemoveMealPlan }: MealPlanningProps) => {
  const sortedMealPlans = [...mealPlans].sort((a, b) => {
    if (!a.plannedDate && !b.plannedDate) return 0;
    if (!a.plannedDate) return 1;
    if (!b.plannedDate) return -1;
    return a.plannedDate.getTime() - b.plannedDate.getTime();
  });

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{mealPlans.length}</div>
          <div className="text-sm text-gray-600">Total Planned Meals</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-blue-700">
            {mealPlans.filter(meal => meal.plannedDate && meal.plannedDate >= new Date()).length}
          </div>
          <div className="text-sm text-blue-600">Upcoming Meals</div>
        </div>
      </div>

      {/* Meal Plans List */}
      {sortedMealPlans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-gray-400 text-6xl mb-4">🍳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No meal plans yet</h3>
          <p className="text-gray-600 mb-4">Start planning your meals to stay organized and reduce food waste.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMealPlans.map((meal) => (
            <div key={meal.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 text-lg">{meal.name}</h3>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  Planned
                </span>
              </div>

              {meal.plannedDate && (
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {meal.plannedDate.toLocaleDateString()}
                    {meal.plannedDate >= new Date() ? (
                      <span className="ml-2 text-blue-600 font-medium">
                        ({Math.ceil((meal.plannedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                      </span>
                    ) : (
                      <span className="ml-2 text-gray-500 font-medium">(Past)</span>
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
