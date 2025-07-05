import { Clock, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionHistoryItem } from '@/hooks/useActionHistory';
import { formatDistanceToNow } from 'date-fns';

interface RecentActionsCardProps {
  actions: ActionHistoryItem[];
  loading: boolean;
}

export const RecentActionsCard = ({ actions, loading }: RecentActionsCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            Recent Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2">
                <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            Recent Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent actions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          Recent Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action) => (
            <div 
              key={action.id} 
              className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
            >
              {action.actionType === 'add' ? (
                <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              <span className="flex-1">
                <span className="font-medium">
                  {action.actionType === 'add' ? 'Added' : 'Removed'}
                </span>{' '}
                <span className="text-foreground">{action.itemName}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(action.createdAt, { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};