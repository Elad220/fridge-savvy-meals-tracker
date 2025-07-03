import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { InventoryDashboard } from '@/components/InventoryDashboard';
import { AddItemForm } from '@/components/AddItemForm';
import { EditItemForm } from '@/components/EditItemForm';
import { EditMealPlanForm } from '@/components/EditMealPlanForm';
import { MealPlanning } from '@/components/MealPlanning';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PhotoAnalysisButton } from '@/components/PhotoAnalysisButton';
import { PhotoAnalysis } from '@/components/PhotoAnalysis';
import { FoodItem, MealPlan } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useFoodItems } from '@/hooks/useFoodItems';
import { useMealPlans } from '@/hooks/useMealPlans';
import Settings from '@/components/Settings'; // Import the new Settings component

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPhotoAnalysis, setShowPhotoAnalysis] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'meals' | 'settings'>('inventory');

  const { foodItems, loading: foodLoading, addFoodItem, updateFoodItem, removeFoodItem } = useFoodItems(user?.id);
  const { mealPlans, loading: mealLoading, addMealPlan, updateMealPlan, removeMealPlan } = useMealPlans(user?.id);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'meals') {
      setActiveTab('meals');
    } else {
      setActiveTab('inventory');
    }
  }, [searchParams]);

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
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 py-20 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-800 dark:text-green-200 text-sm font-medium mb-6">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Smart Food Management
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                  Never Let Food
                  <span className="text-transparent bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text block">
                    Go to Waste
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                  Track your meals, manage expiration dates, and plan ahead with our intelligent food inventory system. Save money and reduce waste.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-1"
                  >
                    Start Managing Food
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    className="px-8 py-4 text-lg font-semibold rounded-xl border-2 hover:bg-muted/50 transition-all duration-200"
                  >
                    Watch Demo
                  </Button>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Free to start
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    No credit card
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Setup in 2 minutes
                  </div>
                </div>
              </div>

              {/* Right Content - Hero Image */}
              <div className="relative">
                <div className="relative z-10">
                  <img 
                    src="/hero-image.svg" 
                    alt="Food Management App Interface"
                    className="w-full h-auto rounded-2xl shadow-2xl"
                  />
                </div>
                {/* Background decoration */}
                <div className="absolute -inset-4 bg-gradient-to-r from-green-200 to-blue-200 dark:from-green-800/20 dark:to-blue-800/20 rounded-3xl opacity-20 blur-xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white/50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Everything you need to manage your food
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our comprehensive platform helps you track, plan, and optimize your food consumption
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group p-8 bg-card rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Smart Food Tracking</h3>
                <p className="text-muted-foreground mb-4">
                  Log cooked meals with expiration dates, storage locations, and nutritional information to keep everything organized.
                </p>
                <div className="text-green-600 font-medium">Learn more →</div>
              </div>

              {/* Feature 2 */}
              <div className="group p-8 bg-card rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Expiration Alerts</h3>
                <p className="text-muted-foreground mb-4">
                  Get intelligent notifications when food is approaching expiration, helping you consume items before they spoil.
                </p>
                <div className="text-amber-600 font-medium">Learn more →</div>
              </div>

              {/* Feature 3 */}
              <div className="group p-8 bg-card rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Meal Planning</h3>
                <p className="text-muted-foreground mb-4">
                  Plan your meals in advance, organize your cooking schedule, and ensure you use ingredients efficiently.
                </p>
                <div className="text-blue-600 font-medium">Learn more →</div>
              </div>

              {/* Feature 4 */}
              <div className="group p-8 bg-card rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Photo Analysis</h3>
                <p className="text-muted-foreground mb-4">
                  Take photos of your meals and let AI automatically identify ingredients and suggest optimal storage methods.
                </p>
                <div className="text-purple-600 font-medium">Learn more →</div>
              </div>

              {/* Feature 5 */}
              <div className="group p-8 bg-card rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Waste Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Track your food waste patterns and get insights on how to improve your consumption habits and save money.
                </p>
                <div className="text-indigo-600 font-medium">Learn more →</div>
              </div>

              {/* Feature 6 */}
              <div className="group p-8 bg-card rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Recipe Suggestions</h3>
                <p className="text-muted-foreground mb-4">
                  Get personalized recipe recommendations based on ingredients you have, helping you create delicious meals.
                </p>
                <div className="text-teal-600 font-medium">Learn more →</div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">40%</div>
                <div className="text-muted-foreground">Food waste reduction</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">$200</div>
                <div className="text-muted-foreground">Average monthly savings</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">50k+</div>
                <div className="text-muted-foreground">Meals tracked</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">2 min</div>
                <div className="text-muted-foreground">Setup time</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to transform your food management?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who have already reduced food waste and saved money with our smart inventory system.
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-white text-green-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-1"
            >
              Start Your Free Account
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </div>
        </section>

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

  const handleMoveToInventory = (meal: MealPlan, foodItem: Omit<FoodItem, 'id' | 'userId'>) => {
    // Add the food item to inventory
    addFoodItem(foodItem);
    
    // Remove from meal plans
    removeMealPlan(meal.id);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return (
          <div className="space-y-6">
            <InventoryDashboard
              foodItems={foodItems}
              onRemoveItem={removeFoodItem}
              onEditItem={setEditingItem}
              userId={user.id}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
            {showPhotoAnalysis && (
              <PhotoAnalysis
                key={`photo-analysis-${user.id || 'no-user'}`}
                isOpen={showPhotoAnalysis}
                onClose={() => setShowPhotoAnalysis(false)}
                onAnalysisComplete={(item) => {
                  addFoodItem(item);
                  setShowPhotoAnalysis(false);
                }}
                userId={user.id}
              />
            )}
          </div>
        );
      case 'meals':
        return (
          <MealPlanning
            mealPlans={mealPlans}
            foodItems={foodItems}
            onRemoveMealPlan={removeMealPlan}
            onAddMealPlan={addMealPlan}
            onEditMealPlan={setEditingMealPlan}
            onNavigateToSettings={() => setActiveTab('settings')}
            onMoveToInventory={handleMoveToInventory}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
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
        {activeTab !== 'settings' && (
          <div className="space-y-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {activeTab === 'inventory' ? 'Food Inventory' : 'Meal Planning'}
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === 'inventory' ? 'Add Food Item' : 'Add Meal Plan'}
              </Button>
              {activeTab === 'inventory' && (
                <PhotoAnalysisButton
                  onOpen={() => setShowPhotoAnalysis(true)}
                  onNavigateToSettings={() => setActiveTab('settings')}
                  disabled={!user?.id}
                  className="w-full sm:w-auto"
                />
              )}
            </div>
          </div>
        )}

        {renderContent()}

        {showAddForm && activeTab !== 'settings' && (
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
