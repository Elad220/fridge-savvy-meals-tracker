
import { FoodItem, FreshnessStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Trash2, MapPin, Calendar, Package } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface FoodItemCardProps {
  item: FoodItem;
  status: FreshnessStatus;
  onRemove: () => void;
}

export const FoodItemCard = ({ item, status, onRemove }: FoodItemCardProps) => {
  const statusConfig = {
    fresh: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      badgeColor: 'bg-green-100 text-green-800',
      label: 'Fresh'
    },
    'use-soon': {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      label: 'Use Soon'
    },
    expired: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      badgeColor: 'bg-red-100 text-red-800',
      label: 'Expired'
    }
  };

  const config = statusConfig[status];
  const daysUntilExpiry = Math.ceil((item.eatByDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-4 transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
        <span className={`${config.badgeColor} px-2 py-1 rounded-full text-xs font-medium`}>
          {config.label}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            Eat by: {item.eatByDate.toLocaleDateString()}
            {daysUntilExpiry >= 0 ? (
              <span className={`ml-2 ${config.textColor} font-medium`}>
                ({daysUntilExpiry === 0 ? 'Today' : daysUntilExpiry === 1 ? 'Tomorrow' : `${daysUntilExpiry} days`})
              </span>
            ) : (
              <span className="ml-2 text-red-600 font-medium">
                ({Math.abs(daysUntilExpiry)} days ago)
              </span>
            )}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Package className="w-4 h-4 mr-2" />
          <span>{item.quantity}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{item.storageLocation}</span>
        </div>
      </div>

      {item.notes && (
        <div className="mb-4 p-2 bg-white bg-opacity-50 rounded text-sm text-gray-700">
          <strong>Notes:</strong> {item.notes}
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Cooked: {item.dateCookedStored.toLocaleDateString()}
        </span>
        
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
  );
};
