import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Clock, AlertTriangle, ChefHat, TrendingUp, Sparkles, X, Lightbulb, CheckCircle } from 'lucide-react';
import { useAIRecommendations, LowStockAlert, Insight, NextAction } from '@/hooks/useAIRecommendations';
import { useToast } from '@/hooks/use-toast';

interface AIRecommendationsProps {
  userId: string;
  onAddToShoppingList?: (items: { name: string; quantity: number; unit: string }[]) => void;
}

export const AIRecommendations = ({ 
  userId, 
  onAddToShoppingList 
}: AIRecommendationsProps) => {
  console.log('AIRecommendations component rendered with userId:', userId);
  
  const { recommendations, loading, refreshRecommendations } = useAIRecommendations(userId);
  const { toast } = useToast();
  
  console.log('AIRecommendations hook result:', { recommendations, loading });
  
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Show low stock alerts as toast notifications
  useEffect(() => {
    if (recommendations?.lowStock && recommendations.lowStock.length > 0) {
      const nonDismissedAlerts = recommendations.lowStock.filter(
        alert => !dismissedAlerts.has(alert.itemName)
      );
      
      nonDismissedAlerts.forEach(alert => {
        // Only show alerts for raw ingredients (not cooked meals)
        if (alert.urgency === 'high' || alert.urgency === 'medium') {
          toast({
            title: `Low Stock Alert: ${alert.itemName}`,
            description: `You have ${alert.currentAmount} ${alert.unit} remaining (${alert.daysUntilOut} days left). Consider restocking ${alert.recommendedAmount} ${alert.unit}.`,
            variant: alert.urgency === 'high' ? 'destructive' : 'default',
            duration: 8000, // Show for 8 seconds
            action: (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDismissedAlerts(prev => new Set([...prev, alert.itemName]));
                    toast({
                      title: "Alert dismissed",
                      description: "You won't see this alert again for this item.",
                    });
                  }}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (onAddToShoppingList) {
                      onAddToShoppingList([{
                        name: alert.itemName,
                        quantity: alert.recommendedAmount,
                        unit: alert.unit
                      }]);
                      setDismissedAlerts(prev => new Set([...prev, alert.itemName]));
                      toast({
                        title: "Added to shopping list",
                        description: `${alert.itemName} has been added to your shopping list.`,
                      });
                    }
                  }}
                >
                  Add to List
                </Button>
              </div>
            ),
          });
          
          // Mark as dismissed to prevent showing again
          setDismissedAlerts(prev => new Set([...prev, alert.itemName]));
        }
      });
    }
  }, [recommendations?.lowStock, dismissedAlerts, toast, onAddToShoppingList]);

  const handleAddToShopping = (items: { name: string; quantity: number; unit: string }[]) => {
    if (onAddToShoppingList) {
      onAddToShoppingList(items);
    }
  };

  if (loading) {
    console.log('AIRecommendations: Showing loading state');
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
    console.log('AIRecommendations: No recommendations, returning null');
    return null;
  }

  console.log('AIRecommendations: Rendering recommendations:', recommendations);

  return (
    <>
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
              {(recommendations.shopping?.length ?? 0) === 0 ? (
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
              onClick={() => {
                console.log('Refresh button clicked');
                refreshRecommendations();
              }}
            >
              Refresh Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};