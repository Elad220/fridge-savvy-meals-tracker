import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Clock, AlertTriangle, ChefHat, TrendingUp, Sparkles, X, Lightbulb, CheckCircle } from 'lucide-react';
import { useAIRecommendations, LowStockAlert, Insight, NextAction } from '@/hooks/useAIRecommendations';

interface AIRecommendationsProps {
  userId: string;
  onAddToShoppingList?: (items: { name: string; quantity: number; unit: string }[]) => void;
}

export const AIRecommendations = ({ 
  userId, 
  onAddToShoppingList 
}: AIRecommendationsProps) => {
  const { recommendations, loading, refreshRecommendations } = useAIRecommendations(userId);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);
  const [selectedLowStockItem, setSelectedLowStockItem] = useState<LowStockAlert | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Show low stock alerts when they appear
  useEffect(() => {
    if (recommendations?.lowStock && recommendations.lowStock.length > 0) {
      const nonDismissedAlerts = recommendations.lowStock.filter(
        alert => !dismissedAlerts.has(alert.itemName)
      );
      if (nonDismissedAlerts.length > 0) {
        setSelectedLowStockItem(nonDismissedAlerts[0]);
        setShowLowStockAlert(true);
      }
    }
  }, [recommendations?.lowStock]);

  const handleDismissAlert = (itemName: string) => {
    setDismissedAlerts(prev => new Set([...prev, itemName]));
    setShowLowStockAlert(false);
    
    // Show next alert if available
    const remaining = recommendations?.lowStock.filter(
      alert => alert.itemName !== itemName && !dismissedAlerts.has(alert.itemName)
    );
    if (remaining && remaining.length > 0) {
      setTimeout(() => {
        setSelectedLowStockItem(remaining[0]);
        setShowLowStockAlert(true);
      }, 300);
    }
  };

  const handleAddToShopping = (items: { name: string; quantity: number; unit: string }[]) => {
    if (onAddToShoppingList) {
      onAddToShoppingList(items);
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Generating AI recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return null;
  }

  return (
    <>
      {/* Low Stock Alert Dialog */}
      <Dialog open={showLowStockAlert} onOpenChange={setShowLowStockAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alert
            </DialogTitle>
          </DialogHeader>
          {selectedLowStockItem && (
            <div className="space-y-4">
              <DialogDescription>
                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
                  <p className="font-semibold text-lg mb-2">{selectedLowStockItem.itemName}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    You have <span className="font-medium text-orange-600">{selectedLowStockItem.currentAmount} {selectedLowStockItem.unit}</span> remaining.
                    Based on your consumption patterns, this will last approximately <span className="font-medium text-orange-600">{selectedLowStockItem.daysUntilOut} days</span>.
                  </p>
                  <p className="text-sm">
                    Recommended to stock: <span className="font-medium">{selectedLowStockItem.recommendedAmount} {selectedLowStockItem.unit}</span>
                  </p>
                  {selectedLowStockItem.urgency && (
                    <Badge variant={selectedLowStockItem.urgency === 'high' ? 'destructive' : 'default'} className="mt-2">
                      {selectedLowStockItem.urgency} urgency
                    </Badge>
                  )}
                </div>
              </DialogDescription>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDismissAlert(selectedLowStockItem.itemName)}
                >
                  Dismiss
                </Button>
                <Button
                  onClick={() => {
                    handleAddToShopping([{
                      name: selectedLowStockItem.itemName,
                      quantity: selectedLowStockItem.recommendedAmount,
                      unit: selectedLowStockItem.unit
                    }]);
                    handleDismissAlert(selectedLowStockItem.itemName);
                  }}
                >
                  Add to Shopping List
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Recommendations Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="shopping" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="shopping" className="flex items-center gap-1">
                <ShoppingCart className="w-4 h-4" />
                Shopping
              </TabsTrigger>
              <TabsTrigger value="meals" className="flex items-center gap-1">
                <ChefHat className="w-4 h-4" />
                Meals
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Actions
              </TabsTrigger>
            </TabsList>

            {/* Shopping Recommendations */}
            <TabsContent value="shopping" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-3">
                Based on your consumption patterns and current inventory
              </div>
              {recommendations.shopping.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No shopping recommendations at this time. Your inventory looks well-stocked!
                </p>
              ) : (
                <div className="space-y-3">
                  {recommendations.shopping.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.reason}</p>
                        {item.confidence && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {item.confidence} confidence
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}>
                          {item.priority}
                        </Badge>
                        <span className="text-sm font-medium">{item.quantity} {item.unit}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddToShopping([item])}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Meal Recommendations */}
            <TabsContent value="meals" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-3">
                AI-suggested meals based on your preferences and available ingredients
              </div>
              {recommendations.meals.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  Start cooking meals to see personalized recommendations here!
                </p>
              ) : (
                <div className="grid gap-3">
                  {recommendations.meals.map((meal, index) => (
                    <div key={index} className="p-4 bg-secondary rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{meal.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {meal.prepTime}
                          </Badge>
                          {meal.difficulty && (
                            <Badge variant="secondary">
                              {meal.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {meal.reason && (
                        <p className="text-sm text-muted-foreground mb-2">{meal.reason}</p>
                      )}
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Ingredients:</p>
                        <div className="flex flex-wrap gap-1">
                          {meal.ingredients.map((ingredient, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Insights */}
            <TabsContent value="insights" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-3">
                AI analysis of your consumption patterns and inventory health
              </div>
              <div className="space-y-3">
                {/* Low Stock Summary */}
                {recommendations.lowStock.length > 0 && (
                  <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertTitle>Low Stock Items</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 space-y-1">
                        {recommendations.lowStock.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.itemName}</span>
                            <span className="text-orange-600 font-medium">
                              {item.daysUntilOut} days left
                            </span>
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* AI Insights */}
                {recommendations.insights && (
                  <div className="space-y-3">
                    {recommendations.insights.consumptionTrends && (
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Consumption Trends
                          </h4>
                          <p className="text-sm text-muted-foreground">{recommendations.insights.consumptionTrends}</p>
                        </CardContent>
                      </Card>
                    )}

                    {recommendations.insights.inventoryHealth && (
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Inventory Health
                          </h4>
                          <p className="text-sm text-muted-foreground">{recommendations.insights.inventoryHealth}</p>
                        </CardContent>
                      </Card>
                    )}

                    {recommendations.insights.shoppingPatterns && (
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Shopping Patterns
                          </h4>
                          <p className="text-sm text-muted-foreground">{recommendations.insights.shoppingPatterns}</p>
                        </CardContent>
                      </Card>
                    )}

                    {recommendations.insights.mealPreferences && (
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <ChefHat className="w-4 h-4" />
                            Meal Preferences
                          </h4>
                          <p className="text-sm text-muted-foreground">{recommendations.insights.mealPreferences}</p>
                        </CardContent>
                      </Card>
                    )}

                    {recommendations.insights.suggestions && (
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Suggestions
                          </h4>
                          <p className="text-sm text-muted-foreground">{recommendations.insights.suggestions}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Next Actions */}
            <TabsContent value="actions" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-3">
                Recommended actions to improve your food management
              </div>
              {recommendations.nextActions.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No specific actions recommended at this time.
                </p>
              ) : (
                <div className="space-y-3">
                  {recommendations.nextActions.map((action, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{action.action}</p>
                        <p className="text-sm text-muted-foreground mt-1">{action.reason}</p>
                      </div>
                      <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'secondary'}>
                        {action.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Generated at: {recommendations.generatedAt.toLocaleString()}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshRecommendations}
            >
              Refresh Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};