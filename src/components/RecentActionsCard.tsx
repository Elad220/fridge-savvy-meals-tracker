import { Clock, Plus, Trash2, Pencil } from 'lucide-react';
import { ActionHistoryItem } from '@/hooks/useActionHistory';
import { formatDistanceToNow } from 'date-fns';

interface RecentActionsCardProps {
  actions: ActionHistoryItem[];
  loading: boolean;
}

export const RecentActionsCard = ({ actions, loading }: RecentActionsCardProps) => {
  if (loading) {
  return (
    <div className="glass-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <Clock className="w-4 h-4" />
        Recent Actions
      </h3>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <div className="w-4 h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded flex-1 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
  }

  if (actions.length === 0) {
  return (
    <div className="glass-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <Clock className="w-4 h-4" />
        Recent Actions
      </h3>
      <p className="text-sm text-muted-foreground">No recent actions</p>
    </div>
  );
  }

  return (
    <div className="glass-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <Clock className="w-4 h-4" />
        Recent Actions
      </h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <div 
            key={action.id} 
            className="flex items-center gap-2 p-2 rounded-md bg-background/10 text-sm"
          >
              {action.actionType === 'add' && action.itemDetails?.isUpdate ? (
                <Pencil className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : action.actionType === 'add' ? (
                <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              <span className="flex-1">
                <span className="font-medium">
                  {action.actionType === 'add' && action.itemDetails?.isUpdate 
                    ? 'Updated' 
                    : action.actionType === 'add' 
                    ? 'Added' 
                    : 'Removed'}
                </span>{' '}
                <span className="text-foreground">{action.itemName}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(action.createdAt, { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
    </div>
  );
};