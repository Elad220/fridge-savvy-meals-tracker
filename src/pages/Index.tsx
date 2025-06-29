import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { InventoryDashboard } from '@/components/InventoryDashboard';
import { AddItemForm } from '@/components/AddItemForm';
import { EditItemForm } from '@/components/EditItemForm';
import { EditMealPlanForm } from '@/components/EditMealPlanForm';
import { MealPlanning } from '@/components/MealPlanning';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { FoodItem, MealPlan } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useFoodItems } from '@/hooks/useFoodItems';
import { useMealPlans } from '@/hooks/useMealPlans';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'meals'>('inventory');

  const { foodItems, loading: foodLoading, addFoodItem, updateFoodItem, removeFoodItem } = useFoodItems(user?.id);
  const { mealPlans, loading: mealLoading, addMealPlan, updateMealPlan, removeMealPlan } = useMealPlans(user?.id);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 flex flex-col">
        <div className="flex-1">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-5xl font-bold text-foreground mb-6">
                Food Prep & Fridge Manager
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Track your cooked meals, manage expiration dates, and reduce food waste with our intelligent inventory system.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-card rounded-lg shadow-sm border">
                  <div className="text-green-500 text-2xl mb-3">🥗</div>
                  <h3 className="font-semibold mb-2 text-foreground">Track Food Items</h3>
                  <p className="text-sm text-muted-foreground">Log cooked meals with expiration dates and storage locations</p>
                </div>
                <div className="p-6 bg-card rounded-lg shadow-sm border">
                  <div className="text-yellow-500 text-2xl mb-3">⏰</div>
                  <h3 className="font-semibold mb-2 text-foreground">Smart Alerts</h3>
                  <p className="text-sm text-muted-foreground">Visual indicators for items that need to be eaten soon</p>
                </div>
                <div className="p-6 bg-card rounded-lg shadow-sm border">
                  <div className="text-blue-500 text-2xl mb-3">📋</div>
                  <h3 className="font-semibold mb-2 text-foreground">Meal Planning</h3>
                  <p className="text-sm text-muted-foreground">Plan future meals and organize your cooking schedule</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/auth')}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const headerUser = {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  };

  const handleEditFoodItem = (updatedItem: FoodItem) => {
    updateFoodItem(updatedItem);
    setEditingItem(null);
  };

  const handleEditMealPlan = (updatedMealPlan: MealPlan) => {
    updateMealPlan(updatedMealPlan);
    setEditingMealPlan(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        user={headerUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-foreground">
            {activeTab === 'inventory' ? 'Food Inventory' : 'Meal Planning'}
          </h2>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'inventory' ? 'Add Food Item' : 'Add Meal Plan'}
          </Button>
        </div>

        {activeTab === 'inventory' ? (
          <InventoryDashboard
            foodItems={foodItems}
            onRemoveItem={removeFoodItem}
            onEditItem={setEditingItem}
            onAddItem={addFoodItem}
            userId={user.id}
          />
        ) : (
          <MealPlanning
            mealPlans={mealPlans}
            foodItems={foodItems}
            onRemoveMealPlan={removeMealPlan}
            onAddMealPlan={addMealPlan}
            onEditMealPlan={setEditingMealPlan}
          />
        )}

        {showAddForm && (
          <AddItemForm
            type={activeTab}
            onSubmit={activeTab === 'inventory' ? addFoodItem : addMealPlan}
            onClose={() => setShowAddForm(false)}
          />
        )}

        {editingItem && (
          <EditItemForm
            item={editingItem}
            onSubmit={handleEditFoodItem}
            onClose={() => setEditingItem(null)}
          />
        )}

        {editingMealPlan && (
          <EditMealPlanForm
            item={editingMealPlan}
            onSubmit={handleEditMealPlan}
            onClose={() => setEditingMealPlan(null)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
