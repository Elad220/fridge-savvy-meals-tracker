
import { FoodItem, FreshnessStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Trash2, MapPin, Calendar, Package, Edit, Utensils, Carrot } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface FoodItemCardProps {
  item: FoodItem;
  onRemove: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  compact?: boolean;
  isExpanded?: boolean;
}

export const FoodItemCard = ({ item, onRemove, onEdit, compact = true, isExpanded = false }: FoodItemCardProps) => {
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
    <div className={`glass-card p-2 md:p-3 transition-all duration-200 hover:scale-105 ${config.borderColor} border-2 min-w-0 relative ${isExpanded ? 'ring-2 ring-green-400/50' : ''} h-[220px] flex flex-col`}> 
      {!compact && (item.notes || (item.tags && item.tags.length > 0)) && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      )}
      <div className="flex justify-between items-start mb-2 flex-shrink-0 min-h-10">
        <div className="flex items-center gap-1 max-w-[70%]">
          {item.label === 'cooked meal' ? (
            <Utensils className="w-3 h-3 text-amber-600 flex-shrink-0" />
          ) : (
            <Carrot className="w-3 h-3 text-green-600 flex-shrink-0" />
          )}
          <h3 className="font-semibold text-foreground text-sm leading-tight">{item.name}</h3>
        </div>
        <span className={`${config.badgeColor} px-1.5 py-0.5 rounded-full text-[10px] font-medium`}>
          {config.label}
        </span>
      </div>

      <div className="space-y-1 mb-2 flex-shrink-0 h-14">
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 mr-1" />
          <span>
            {item.eatByDate.toLocaleDateString()}
            {daysUntilExpiry >= 0 ? (
              <span className={`ml-1 ${config.textColor} font-medium`}>
                ({daysUntilExpiry === 0 ? 'Today' : daysUntilExpiry === 1 ? 'Tomorrow' : `${daysUntilExpiry}d`})
              </span>
            ) : (
              <span className="ml-1 text-red-600 dark:text-red-400 font-medium">
                ({Math.abs(daysUntilExpiry)}d ago)
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <Package className="w-3 h-3 mr-1" />
          <span>{item.amount} {item.unit}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 mr-1" />
          <span>{item.storageLocation}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto max-h-20">
        {item.notes && (
          <div className="mb-2 p-1.5 bg-background/50 rounded text-xs text-muted-foreground">
            <strong>Notes:</strong> {item.notes}
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-1 flex-shrink-0 h-10">
        <span className="text-xs text-muted-foreground">
          {item.dateCookedStored.toLocaleDateString()}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(e);
            }}
            className="w-6 h-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30"
            title="Edit"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="w-6 h-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                title="Remove"
              >
                <Trash2 className="w-3 h-3" />
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
                <AlertDialogAction onClick={(e) => {
                  e.stopPropagation();
                  onRemove(e);
                }} className="bg-red-600 hover:bg-red-700">
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
