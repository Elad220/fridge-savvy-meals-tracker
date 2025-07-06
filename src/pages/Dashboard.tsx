import { useAuth } from '@/hooks/useAuth';
import { useFoodItems } from '@/hooks/useFoodItems';
import { useActionHistory } from '@/hooks/useActionHistory';
import { AIRecommendations } from '@/components/AIRecommendations';
import { RecentActionsCard } from '@/components/RecentActionsCard';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Brain, TrendingUp, Clock } from 'lucide-react';
import { useMemo } from 'react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { foodItems } = useFoodItems(user?.id);
  const { recentActions, loading: historyLoading, refetch: refetchHistory } = useActionHistory(user?.id);

  const handleLogout = async () => {
    await signOut();
  };

  // Calculate dashboard stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiringSoon = foodItems.filter(item => {
      const eatByDate = new Date(item.eatByDate);
      eatByDate.setHours(0, 0, 0, 0);
      const diffTime = eatByDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    }).length;

    const totalItems = foodItems.length;
    const cookedMeals = foodItems.filter(item => item.label === 'cooked meal').length;
    const rawMaterials = foodItems.filter(item => item.label === 'raw material').length;

    return {
      totalItems,
      expiringSoon,
      cookedMeals,
      rawMaterials,
      recentActionsCount: recentActions.length
    };
  }, [foodItems, recentActions]);

  return (
    <div className="min-h-screen bg-background">
        <Header 
          user={user ? {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          } : null}
          onLogout={handleLogout}
          activeTab="inventory"
          onTabChange={() => {}}
        />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Your food management insights and recommendations</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/20 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalItems}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-950/20 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.expiringSoon}</p>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-950/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.cookedMeals}</p>
                  <p className="text-sm text-muted-foreground">Cooked Meals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-950/20 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.rawMaterials}</p>
                  <p className="text-sm text-muted-foreground">Raw Materials</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <AIRecommendations
          userId={user?.id || ''}
          foodItems={foodItems}
          actionHistory={recentActions}
        />

        {/* Recent Actions */}
        <RecentActionsCard actions={recentActions} loading={historyLoading} />
      </div>
    </div>
  );
};

export default Dashboard;