import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, TrendingUp, Lightbulb, AlertTriangle } from 'lucide-react';
import { useUserActions } from '@/hooks/useUserActions';
import { UserAction } from '@/types';

interface ActionHistoryProps {
  userId: string;
}

export const ActionHistory = ({ userId }: ActionHistoryProps) => {
  const {
    recentActions,
    actionStats,
    actionPatterns,
    loading,
    getSuggestions,
    getFrequentlyAddedItems,
    getFrequentlyWastedItems,
  } = useUserActions(userId);

  const [selectedAction, setSelectedAction] = useState<UserAction | null>(null);

  const suggestions = getSuggestions();
  const frequentlyAdded = getFrequentlyAddedItems();
  const frequentlyWasted = getFrequentlyWastedItems();

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'add':
        return '➕';
      case 'remove':
        return '🗑️';
      case 'update':
        return '📝';
      case 'move':
        return '🔄';
      default:
        return '📋';
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'add':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'remove':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'move':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Action History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Action History & Insights
        </CardTitle>
        <CardDescription>
          Track your food management patterns and get personalized suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="suggestions">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Actions</h3>
              <Badge variant="secondary">{recentActions.length} actions</Badge>
            </div>
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-3">
                {recentActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedAction(action)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl">{getActionTypeIcon(action.actionType)}</div>
                      <div>
                        <div className="font-medium">{action.entityName}</div>
                        <div className="text-sm text-muted-foreground">
                          {action.entityType.replace('_', ' ')} • {formatDate(action.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Badge className={getActionTypeColor(action.actionType)}>
                      {action.actionType}
                    </Badge>
                  </div>
                ))}
                {recentActions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent actions found. Start adding food items to see your history!
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Action Statistics</h3>
              <Badge variant="secondary">Last 30 days</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {actionStats.map((stat) => (
                <Card key={`${stat.actionType}-${stat.entityType}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-xl">{getActionTypeIcon(stat.actionType)}</div>
                      <div className="font-medium capitalize">
                        {stat.actionType} {stat.entityType.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{stat.actionCount}</div>
                    <div className="text-sm text-muted-foreground">
                      Last: {formatDate(stat.mostRecentAction)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {actionStats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No statistics available yet. Use the app for a while to see patterns!
              </div>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Usage Patterns</h3>
              <Badge variant="secondary">Last 90 days</Badge>
            </div>
            <div className="space-y-4">
              {frequentlyAdded.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Frequently Added Items
                  </h4>
                  <div className="space-y-2">
                    {frequentlyAdded.slice(0, 5).map((pattern) => (
                      <div key={pattern.entityName} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div>
                          <div className="font-medium">{pattern.entityName}</div>
                          <div className="text-sm text-muted-foreground">
                            Added {pattern.actionCount} times
                            {pattern.avgDaysBetweenActions && (
                              <span> • Every {Math.round(pattern.avgDaysBetweenActions)} days</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">{pattern.actionCount}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {frequentlyWasted.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Frequently Removed Items
                  </h4>
                  <div className="space-y-2">
                    {frequentlyWasted.slice(0, 5).map((pattern) => (
                      <div key={pattern.entityName} className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-900/20">
                        <div>
                          <div className="font-medium">{pattern.entityName}</div>
                          <div className="text-sm text-muted-foreground">
                            Removed {pattern.actionCount} times
                          </div>
                        </div>
                        <Badge variant="destructive">{pattern.actionCount}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {frequentlyAdded.length === 0 && frequentlyWasted.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No patterns detected yet. Keep using the app to see your usage patterns!
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Personalized Insights</h3>
              <Badge variant="secondary">{suggestions.length} suggestions</Badge>
            </div>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-green-500 mt-0.5" />
                      <div className="text-sm">{suggestion}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {suggestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No suggestions available yet. Keep adding food items to get personalized insights!
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};