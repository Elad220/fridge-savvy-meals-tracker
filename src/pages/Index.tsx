
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { InventoryDashboard } from '@/components/InventoryDashboard';
import { AddItemForm } from '@/components/AddItemForm';
import { EditItemForm } from '@/components/EditItemForm';
import { MealPlanning } from '@/components/MealPlanning';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { FoodItem, MealPlan, User } from '@/types';

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'meals'>('inventory');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);

  // Load sample data for demo
  useEffect(() => {
    if (currentUser) {
      setFoodItems([
        {
          id: '1',
          name: 'Chicken Stir-fry',
          dateCookedStored: new Date('2024-06-22'),
          eatByDate: new Date('2024-06-25'),
          quantity: '2 servings',
          storageLocation: 'Fridge - Top Shelf',
          notes: 'Contains bell peppers and broccoli',
          userId: currentUser.id,
        },
        {
          id: '2',
          name: 'Leftover Rice',
          dateCookedStored: new Date('2024-06-21'),
          eatByDate: new Date('2024-06-24'),
          quantity: 'Half a pot',
          storageLocation: 'Fridge - Middle Shelf',
          notes: 'Jasmine rice',
          userId: currentUser.id,
        },
      ]);

      setMealPlans([
        {
          id: '1',
          name: 'Beef Tacos',
          plannedDate: new Date('2024-06-26'),
          userId: currentUser.id,
        }
      ]);
    }
  }, [currentUser]);

  const handleAddFoodItem = (item: Omit<FoodItem, 'id' | 'userId'>) => {
    if (!currentUser) return;
    
    const newItem: FoodItem = {
      ...item,
      id: Date.now().toString(),
      userId: currentUser.id,
    };
    
    setFoodItems(prev => [...prev, newItem]);
    setShowAddForm(false);
  };

  const handleEditFoodItem = (updatedItem: FoodItem) => {
    setFoodItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    setEditingItem(null);
  };

  const handleRemoveItem = (id: string) => {
    setFoodItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddMealPlan = (meal: Omit<MealPlan, 'id' | 'userId'>) => {
    if (!currentUser) return;
    
    const newMeal: MealPlan = {
      ...meal,
      id: Date.now().toString(),
      userId: currentUser.id,
    };
    
    setMealPlans(prev => [...prev, newMeal]);
  };

  const handleRemoveMealPlan = (id: string) => {
    setMealPlans(prev => prev.filter(meal => meal.id !== id));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Food Prep & Fridge Manager
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Track your cooked meals, manage expiration dates, and reduce food waste with our intelligent inventory system.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="text-green-500 text-2xl mb-3">🥗</div>
                <h3 className="font-semibold mb-2">Track Food Items</h3>
                <p className="text-sm text-gray-600">Log cooked meals with expiration dates and storage locations</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="text-yellow-500 text-2xl mb-3">⏰</div>
                <h3 className="font-semibold mb-2">Smart Alerts</h3>
                <p className="text-sm text-gray-600">Visual indicators for items that need to be eaten soon</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="text-blue-500 text-2xl mb-3">📋</div>
                <h3 className="font-semibold mb-2">Meal Planning</h3>
                <p className="text-sm text-gray-600">Plan future meals and organize your cooking schedule</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAuthModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            >
              Get Started
            </Button>
          </div>
        </div>
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={setCurrentUser}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={currentUser} 
        onLogout={() => setCurrentUser(null)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
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
            onRemoveItem={handleRemoveItem}
            onEditItem={setEditingItem}
          />
        ) : (
          <MealPlanning 
            mealPlans={mealPlans}
            onRemoveMealPlan={handleRemoveMealPlan}
            onAddMealPlan={handleAddMealPlan}
          />
        )}

        {showAddForm && (
          <AddItemForm
            type={activeTab}
            onSubmit={activeTab === 'inventory' ? handleAddFoodItem : handleAddMealPlan}
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
      </main>
    </div>
  );
};

export default Index;
