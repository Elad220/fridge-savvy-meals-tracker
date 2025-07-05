
import { FoodItem, FreshnessStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Trash2, MapPin, Calendar, Package, Edit, Utensils, Carrot } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface FoodItemCardProps {
  item: FoodItem;
  onRemove: () => void;
  onEdit: () => void;
}

export const FoodItemCard = ({ item, onRemove, onEdit }: FoodItemCardProps) => {
  type StatusConfig = {
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeColor: string;
    label: string;
  };

  const statusConfig: Record<FreshnessStatus, StatusConfig> = {
    fresh: {
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-300',
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      label: 'Fresh'
    },
    'use-soon': {
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      label: 'Use Soon'
    },
    'use-or-throw': {
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      borderColor: 'border-orange-300 dark:border-orange-700',
      textColor: 'text-orange-700 dark:text-orange-300',
      badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/80 dark:text-orange-200',
      label: 'Use or Throw'
    },
    expired: {
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-900',
      textColor: 'text-red-600 dark:text-red-400',
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200',
      label: 'Expired'
    }
  };

  // Calculate days until expiry (negative if already expired)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiryDate = new Date(item.eatByDate);
  expiryDate.setHours(0, 0, 0, 0);
  
  const timeDiff = expiryDate.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  // Determine status based on days until expiry
  let status: FreshnessStatus;
  if (daysUntilExpiry < 0) {
    status = 'expired';
  } else if (daysUntilExpiry === 0) {
    status = 'use-or-throw';
  } else if (daysUntilExpiry <= 2) {  // Changed from 3 to 2 to make 'fresh' start at 3+ days
    status = 'use-soon';
  } else {
    status = 'fresh';
  }
  
  const config = statusConfig[status];

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-4 transition-all hover:shadow-md dark:hover:shadow-lg`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
        <span className={`${config.badgeColor} px-2 py-1 rounded-full text-xs font-medium`}>
          {config.label}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-muted-foreground">
          {item.label === 'cooked meal' ? (
            <Utensils className="w-4 h-4 mr-2 text-amber-600" />
          ) : (
            <Carrot className="w-4 h-4 mr-2 text-green-600" />
          )}
          <span className="font-medium">
            {item.label === 'cooked meal' ? 'Cooked Meal' : 'Raw Material'}
          </span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            Eat by: {item.eatByDate.toLocaleDateString()}
            {daysUntilExpiry >= 0 ? (
              <span className={`ml-2 ${config.textColor} font-medium`}>
                ({daysUntilExpiry === 0 ? 'Today' : daysUntilExpiry === 1 ? 'Tomorrow' : `${daysUntilExpiry} days`})
              </span>
            ) : (
              <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                ({Math.abs(daysUntilExpiry)} days ago)
              </span>
            )}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Package className="w-4 h-4 mr-2" />
          <span>{item.amount} {item.unit}</span>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{item.storageLocation}</span>
        </div>
      </div>

      {item.notes && (
        <div className="mb-4 p-2 bg-background/50 rounded text-sm text-muted-foreground">
          <strong>Notes:</strong> {item.notes}
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Cooked: {item.dateCookedStored.toLocaleDateString()}
        </span>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
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
                <AlertDialogAction onClick={onRemove} className="bg-red-600 hover:bg-red-700">
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
