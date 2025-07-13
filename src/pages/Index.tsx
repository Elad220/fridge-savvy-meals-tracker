import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Bookmark, Camera, Mic, Brain, TrendingUp, Users, Zap, CheckCircle, ArrowRight, Star, Shield, Clock, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFoodItems } from '@/hooks/useFoodItems';
import { useMealPlans } from '@/hooks/useMealPlans';
import { useActionHistory } from '@/hooks/useActionHistory';
import { AddItemForm } from '@/components/AddItemForm';
import { EditItemForm } from '@/components/EditItemForm';
import { EditMealPlanForm } from '@/components/EditMealPlanForm';
import { InventoryDashboard } from '@/components/InventoryDashboard';
import { MealPlanning } from '@/components/MealPlanning';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PhotoAnalysis } from '@/components/PhotoAnalysis';
import { PhotoAnalysisButton } from '@/components/PhotoAnalysisButton';
import Settings from '@/components/Settings';
import { VoiceRecording } from '@/components/VoiceRecording';
import { VoiceRecordingButton } from '@/components/VoiceRecordingButton';
import { FoodItem, MealPlan, FoodItemLabel } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { AIRecommendations } from '@/components/AIRecommendations';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { toast } from '@/hooks/use-toast';
import { useApiTokens } from '@/hooks/useApiTokens';
import { DashboardWindow } from '@/components/DashboardWindow';
import { ActionHistoryItem } from '@/hooks/useActionHistory';
import { RecipeGenerator } from '@/components/RecipeGenerator';
import { MealPlanVoiceRecordingButton } from '@/components/MealPlanVoiceRecordingButton';
import { MealPlanVoiceRecording } from '@/components/MealPlanVoiceRecording';
import { SavedRecipes } from '@/components/SavedRecipes';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPhotoAnalysis, setShowPhotoAnalysis] = useState(false);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [showMealPlanVoiceRecording, setShowMealPlanVoiceRecording] = useState(false);
  const [showSavedRecipes, setShowSavedRecipes] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'meals' | 'settings'>('inventory');
  const [isDashboardWindowOpen, setIsDashboardWindowOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<{
    recentActions?: ActionHistoryItem[];
    historyLoading?: boolean;
    userId?: string;
    statusCounts?: {
      total: number;
      fresh: number;
      'use-soon': number;
      'use-or-throw': number;
      expired: number;
    };
  } | null>(null);

  const { recentActions, loading: historyLoading, refetch: refetchHistory } = useActionHistory(user?.id);
  const { updateConsumptionPattern, updateMealCombination, clearCacheOnInventoryChange } = useAIRecommendations(user?.id);
  const { foodItems, loading: foodLoading, addFoodItem, updateFoodItem, removeFoodItem, refetch } = useFoodItems(user?.id, clearCacheOnInventoryChange, refetchHistory);
  const { mealPlans, loading: mealLoading, addMealPlan, updateMealPlan, removeMealPlan } = useMealPlans(user?.id);
  const { aiRecommendationsEnabled } = useApiTokens();

  // Dashboard window event listener
  useEffect(() => {
    const handleOpenDashboardWindow = (event: CustomEvent) => {
      setDashboardData(event.detail);
      setIsDashboardWindowOpen(true);
    };

    window.addEventListener('openDashboardWindow', handleOpenDashboardWindow as EventListener);
    return () => {
      window.removeEventListener('openDashboardWindow', handleOpenDashboardWindow as EventListener);
    };
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'meals') {
      setActiveTab('meals');
    } else {
      setActiveTab('inventory');
    }
  }, [searchParams]);

  // Enhanced parallax and glassmorphism effects
  useEffect(() => {
    if (!user && !authLoading) { // Only run on landing page when auth is loaded
      // Small delay to ensure DOM is fully rendered
      const initAnimations = () => {
        const observerOptions = {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
            }
          });
        }, observerOptions);

        // Observe all animated elements
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        animatedElements.forEach((el) => {
          observer.observe(el);
        });

        // Parallax scroll handler with proper data-parallax validation
        let ticking = false;
        
        const handleScroll = () => {
          if (!ticking) {
            requestAnimationFrame(() => {
              const scrolled = window.pageYOffset;
              const parallaxElements = document.querySelectorAll('[data-parallax], .parallax-bg');
              
              parallaxElements.forEach((el) => {
                // Get speed from data-parallax attribute or use default
                const parallaxSpeed = el.getAttribute('data-parallax');
                const speed = parallaxSpeed ? parseFloat(parallaxSpeed) : 0.3;
                
                // Validate speed to prevent NaN
                if (!isNaN(speed) && isFinite(speed)) {
                  const yPos = -(scrolled * speed);
                  (el as HTMLElement).style.transform = `translate3d(0, ${yPos}px, 0)`;
                }
              });

              // Handle glassmorphism blur effects
              const glassElements = document.querySelectorAll('[data-glass]');
              const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
              const scrollProgress = Math.min(scrolled / maxScroll, 1);
              
              glassElements.forEach((el) => {
                // Calculate blur based on scroll progress (more blur as you scroll down)
                const maxBlur = 16; // Maximum blur in pixels
                const minBlur = 0; // Minimum blur in pixels
                const blurValue = minBlur + (scrollProgress * (maxBlur - minBlur));
                
                // Apply both CSS custom property and backdrop filter for consistent glassmorphism
                (el as HTMLElement).style.setProperty('--glass-blur', `${blurValue}px`);
                (el as HTMLElement).style.backdropFilter = `blur(${blurValue}px)`;
              });
              
              ticking = false;
            });
            ticking = true;
          }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
      };

      const timeoutId = setTimeout(initAnimations, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [user, authLoading]);

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-950/20 dark:via-blue-950/20 dark:to-purple-950/20 overflow-hidden">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                FoodTracker
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-6 py-2 rounded-xl transition-all duration-200 hover:shadow-lg"
              >
                Sign In
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 py-20 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-800 dark:text-green-200 text-sm font-medium mb-6 animate-on-scroll">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Smart Food Management
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight animate-on-scroll">
                  Never Let Food
                  <span className="block bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Go to Waste
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed animate-on-scroll">
                  Track your meals, manage expiration dates, and plan ahead with our intelligent food inventory system. Save money and reduce waste.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8 animate-on-scroll">
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-10 py-4 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-2 hover:scale-105"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    data-glass
                    className="glass-button px-8 py-4 text-lg font-semibold rounded-xl border-2 hover:bg-muted/50 transition-all duration-200"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Watch Demo
                  </Button>
                </div>
                
                <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" />
                    Free to start
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-emerald-500 mr-2" />
                    No credit card
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-emerald-500 mr-2" />
                    Setup in 2 minutes
                  </div>
                </div>
              </div>

              {/* Right Content - Hero Image */}
              <div className="relative">
                {/* Floating elements with parallax */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-500/20 rounded-full blur-sm float-animation" data-parallax="0.1"></div>
                <div className="absolute top-1/3 -right-6 w-8 h-8 bg-blue-500/20 rounded-full blur-sm float-animation-delayed" data-parallax="0.2"></div>
                <div className="absolute bottom-1/4 -left-8 w-6 h-6 bg-purple-500/20 rounded-full blur-sm float-animation" data-parallax="0.15"></div>
                <div className="absolute -bottom-6 right-1/3 w-10 h-10 bg-orange-500/20 rounded-full blur-sm float-animation-delayed" data-parallax="0.25"></div>
                
                <div className="relative z-10 hover-lift">
                  <img 
                    src="/hero-image.svg" 
                    alt="Food Management App Interface"
                    className="w-full h-auto rounded-2xl shadow-2xl"
                  />
                </div>
                {/* Background decoration */}
                <div className="absolute -inset-4 bg-gradient-to-r from-green-200 to-blue-200 dark:from-green-800/20 dark:to-blue-800/20 rounded-3xl opacity-20 blur-xl pulse-slow"></div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Demo Section */}
        <section className="py-20 bg-white/50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-on-scroll">
                See AI Food Tracking in Action
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-on-scroll">
                Watch how our intelligent system scans, analyzes, and organizes your food automatically
              </p>
              <div className="flex justify-center">
                <div className="relative max-w-2xl w-full animate-on-scroll">
                  {/* Floating AI elements */}
                  <div className="absolute -top-8 left-8 w-6 h-6 bg-purple-500/30 rounded-full blur-sm float-animation opacity-60"></div>
                  <div className="absolute -top-4 right-12 w-4 h-4 bg-green-500/30 rounded-full blur-sm float-animation-delayed opacity-60"></div>
                  <div className="absolute bottom-8 -left-6 w-8 h-8 bg-blue-500/30 rounded-full blur-sm float-animation opacity-60"></div>
                  <div className="absolute bottom-4 -right-8 w-5 h-5 bg-orange-500/30 rounded-full blur-sm float-animation-delayed opacity-60"></div>
                  
                  <div className="hover-lift">
                    <img 
                      src="/food-tracking-animation.svg" 
                      alt="AI Food Tracking Animation"
                      className="w-full h-auto rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-green-200 to-blue-200 dark:from-green-800/20 dark:to-blue-800/20 rounded-3xl opacity-20 blur-xl pulse-slow"></div>
                  
                  {/* AI Badge */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Powered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-24 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Smart Features for
                <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Smarter Living
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our AI-powered platform combines cutting-edge technology with intuitive design to revolutionize how you manage food.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div 
                className="group relative p-8 rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:-translate-y-2"
                data-parallax="0.1"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Smart Photo Analysis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Simply take a photo of your food and let our AI automatically identify ingredients, 
                  estimate quantities, and log them to your inventory.
                </p>
              </div>

              {/* Feature 2 */}
              <div 
                className="group relative p-8 rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:-translate-y-2"
                data-parallax="0.15"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Voice Commands</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Use natural voice commands to add items, create meal plans, and update your inventory 
                  hands-free while cooking or shopping.
                </p>
              </div>

              {/* Feature 3 */}
              <div 
                className="group relative p-8 rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:-translate-y-2"
                data-parallax="0.2"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">AI Recommendations</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get personalized meal suggestions, recipe recommendations, and shopping lists 
                  based on your preferences and current inventory.
                </p>
              </div>

              {/* Feature 4 */}
              <div 
                className="group relative p-8 rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:-translate-y-2"
                data-parallax="0.25"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Waste Reduction</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track expiration dates, get alerts for items that need to be used soon, 
                  and reduce food waste by up to 40% with smart inventory management.
                </p>
              </div>

              {/* Feature 5 */}
              <div 
                className="group relative p-8 rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:-translate-y-2"
                data-parallax="0.3"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Family Sharing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Share your inventory with family members, coordinate meal planning, 
                  and ensure everyone stays on the same page with real-time updates.
                </p>
              </div>

              {/* Feature 6 */}
              <div 
                className="group relative p-8 rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:-translate-y-2"
                data-parallax="0.35"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Bookmark className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Recipe Management</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Save favorite recipes, generate shopping lists automatically, 
                  and discover new dishes based on ingredients you have available.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Parallax Meal Planning Section */}
        <section className="relative py-32 overflow-hidden">
          <div 
            className="parallax-bg absolute inset-0 bg-cover bg-center opacity-30 parallax-smooth"
            data-parallax="0.3"
            style={{
              backgroundImage: "url('/meal-planning-parallax.svg')",
              transform: "translateZ(0)", // Enable GPU acceleration for smooth parallax
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-blue-900/80"></div>
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-on-scroll">
              Smart Meal Planning with AI
            </h2>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed animate-on-scroll">
              Our AI analyzes your inventory, suggests recipes, creates shopping lists, and helps you plan nutritious meals that minimize waste and maximize flavor.
            </p>
                          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20" data-glass>
                  <div className="text-3xl mb-4">🧠</div>
                  <h3 className="text-xl font-bold mb-2">AI Recipe Matching</h3>
                  <p className="text-white/80">Intelligent suggestions based on your ingredients and preferences</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20" data-glass>
                  <div className="text-3xl mb-4">📱</div>
                  <h3 className="text-xl font-bold mb-2">Photo Analysis</h3>
                  <p className="text-white/80">Snap photos to instantly identify and catalog your food items</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20" data-glass>
                  <div className="text-3xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold mb-2">Smart Alerts</h3>
                  <p className="text-white/80">Never let food expire with intelligent timing notifications</p>
                </div>
              </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-on-scroll">
                Proven Results from Real Users
              </h2>
              <p className="text-xl text-muted-foreground animate-on-scroll">
                Join thousands who have transformed their food management
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="group hover:scale-105 transition-transform duration-300 animate-on-scroll">
                <div className="text-5xl font-bold text-green-600 mb-2 group-hover:text-green-500">40%</div>
                <div className="text-muted-foreground font-medium">Food waste reduction</div>
                <div className="text-sm text-green-600 mt-2">↗️ Significant impact</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300 animate-on-scroll">
                <div className="text-5xl font-bold text-green-600 mb-2 group-hover:text-green-500">$200</div>
                <div className="text-muted-foreground font-medium">Average monthly savings</div>
                <div className="text-sm text-green-600 mt-2">💰 Real money saved</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300 animate-on-scroll">
                <div className="text-5xl font-bold text-green-600 mb-2 group-hover:text-green-500">50k+</div>
                <div className="text-muted-foreground font-medium">Meals tracked</div>
                <div className="text-sm text-green-600 mt-2">📊 Growing community</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300 animate-on-scroll">
                <div className="text-5xl font-bold text-green-600 mb-2 group-hover:text-green-500">2 min</div>
                <div className="text-muted-foreground font-medium">Setup time</div>
                <div className="text-sm text-green-600 mt-2">⚡ Quick start</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-on-scroll">
              Ready to transform your food management?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto animate-on-scroll">
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

        {/* Footer */}
        <footer className="relative py-12 px-4 border-t border-white/10 dark:border-white/5">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  FoodTracker
                </span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
                <span>Contact</span>
              </div>
            </div>
          </div>
        </footer>
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

  // Unit conversion utility
  const convertUnit = (quantity: number, fromUnit: string, toUnit: string): number | null => {
    const normalizedFromUnit = fromUnit.toLowerCase().trim();
    const normalizedToUnit = toUnit.toLowerCase().trim();

    // If units are the same, no conversion needed
    if (normalizedFromUnit === normalizedToUnit) {
      return quantity;
    }

    // Weight conversions
    const weightConversions: Record<string, Record<string, number>> = {
      'g': { 'kg': 0.001, 'lb': 0.00220462, 'oz': 0.035274 },
      'kg': { 'g': 1000, 'lb': 2.20462, 'oz': 35.274 },
      'lb': { 'g': 453.592, 'kg': 0.453592, 'oz': 16 },
      'oz': { 'g': 28.3495, 'kg': 0.0283495, 'lb': 0.0625 }
    };

    // Volume conversions
    const volumeConversions: Record<string, Record<string, number>> = {
      'ml': { 'l': 0.001, 'cup': 0.00422675, 'tbsp': 0.067628, 'tsp': 0.202884 },
      'l': { 'ml': 1000, 'cup': 4.22675, 'tbsp': 67.628, 'tsp': 202.884 },
      'cup': { 'ml': 236.588, 'l': 0.236588, 'tbsp': 16, 'tsp': 48 },
      'tbsp': { 'ml': 14.7868, 'l': 0.0147868, 'cup': 0.0625, 'tsp': 3 },
      'tsp': { 'ml': 4.92892, 'l': 0.00492892, 'cup': 0.0208333, 'tbsp': 0.333333 }
    };

    // Check weight conversions
    if (weightConversions[normalizedFromUnit] && weightConversions[normalizedFromUnit][normalizedToUnit]) {
      return quantity * weightConversions[normalizedFromUnit][normalizedToUnit];
    }

    // Check volume conversions
    if (volumeConversions[normalizedFromUnit] && volumeConversions[normalizedFromUnit][normalizedToUnit]) {
      return quantity * volumeConversions[normalizedFromUnit][normalizedToUnit];
    }

    // Check reverse conversions
    if (weightConversions[normalizedToUnit] && weightConversions[normalizedToUnit][normalizedFromUnit]) {
      return quantity / weightConversions[normalizedToUnit][normalizedFromUnit];
    }

    if (volumeConversions[normalizedToUnit] && volumeConversions[normalizedToUnit][normalizedFromUnit]) {
      return quantity / volumeConversions[normalizedToUnit][normalizedFromUnit];
    }

    // If no conversion is possible, return null
    return null;
  };

  // Check if units are compatible (can be converted)
  const areUnitsCompatible = (unit1: string, unit2: string): boolean => {
    const normalizedUnit1 = unit1.toLowerCase().trim();
    const normalizedUnit2 = unit2.toLowerCase().trim();

    // Same units are always compatible
    if (normalizedUnit1 === normalizedUnit2) {
      return true;
    }

    // Check if conversion is possible
    return convertUnit(1, normalizedUnit1, normalizedUnit2) !== null;
  };

  const consumeIngredients = async (meal: MealPlan) => {
    if (!meal.ingredients || meal.ingredients.length === 0) {
      return { consumedItems: [], insufficientItems: [] };
    }

    const consumedItems: string[] = [];
    const insufficientItems: string[] = [];

    // Helper function to get fresh inventory data
    const getFreshInventory = async () => {
      // Get fresh data directly from the database
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('eat_by_date', { ascending: true });

      if (error) {
        console.error('Error fetching fresh inventory:', error);
        return foodItems; // Fallback to current state
      }

      // Transform the data to match FoodItem format
      const freshItems: FoodItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        dateCookedStored: new Date(item.date_cooked_stored),
        eatByDate: new Date(item.eat_by_date),
        amount: item.amount || 1,
        unit: item.unit || 'item',
        storageLocation: item.storage_location,
        label: (item.label || 'raw material') as FoodItemLabel,
        notes: item.notes || undefined,
        userId: item.user_id,
        freshnessDays: item.freshness_days || 4,
      }));

      return freshItems;
    };

    // Helper function for precise ingredient matching
    const isExactMatch = (itemName: string, ingredientName: string): boolean => {
      const normalizedItemName = itemName.toLowerCase().trim();
      const normalizedIngredientName = ingredientName.toLowerCase().trim();
      
      // Exact match
      if (normalizedItemName === normalizedIngredientName) {
        return true;
      }
      
      // Check if ingredient name is a complete word in item name
      const itemWords = normalizedItemName.split(/\s+/);
      const ingredientWords = normalizedIngredientName.split(/\s+/);
      
      // If ingredient has multiple words, all must be present in item
      if (ingredientWords.length > 1) {
        return ingredientWords.every(word => 
          itemWords.some(itemWord => itemWord === word || itemWord.startsWith(word))
        );
      }
      
      // For single word ingredients, check for exact word match or common variations
      const ingredientWord = ingredientWords[0];
      
      // Direct word match
      if (itemWords.includes(ingredientWord)) {
        return true;
      }
      
      // Check for common variations (e.g., "tomato" vs "tomatoes")
      const commonVariations: Record<string, string[]> = {
        'tomato': ['tomatoes'],
        'potato': ['potatoes'],
        'onion': ['onions'],
        'carrot': ['carrots'],
        'pepper': ['peppers'],
        'garlic': ['garlic'],
        'salt': ['salt'],
        'sugar': ['sugar'],
        'flour': ['flour'],
        'oil': ['oil'],
        'butter': ['butter'],
        'milk': ['milk'],
        'egg': ['eggs'],
        'chicken': ['chicken'],
        'beef': ['beef'],
        'pork': ['pork'],
        'fish': ['fish'],
        'rice': ['rice'],
        'pasta': ['pasta'],
        'bread': ['bread'],
        'עגבניה': ['עגבניות'],
        'עגבנייה': ['עגבניות'],
        'תפוח אדמה': ['תפוחי אדמה'],
        'בצל': ['בצלים'],
        'גזר': ['גזרים'],
        'פלפל': ['פלפלים'],
        'שום': ['שום'],
        'מלח': ['מלח'],
        'סוכר': ['סוכר'],
        'קמח': ['קמח'],
        'שמן': ['שמנים'],
        'חמאה': ['חמאה'],
        'חלב': ['חלב'],
        'ביצה': ['ביצים'],
        'עוף': ['עוף'],
        'בשר': ['בשר'],
        'דג': ['דגים'],
        'אורז': ['אורז'],
        'פסטה': ['פסטה'],
        'לחם': ['לחם'],
        'מלפפון': ['מלפפונים'],
        'חסה': ['חסה'],
        'כרוב': ['כרוב'],
        'תות': ['תותים'],
        'תות שדה': ['תותי שדה'],
        'בננה': ['בננות'],
        'תפוח': ['תפוחים'],
        'אגס': ['אגסים'],
        'תות עץ': ['תותי עץ'],
        'ענבים': ['ענב'],
        'תפוז': ['תפוזים'],
        'לימון': ['לימונים'],
        'אבוקדו': ['אבוקדו'],
        'זית': ['זיתים'],
        'שמן זית': ['שמן זית'],
        'חמאת בוטנים': ['חמאת בוטנים'],
        'דבש': ['דבש'],
        'ריבה': ['ריבה'],
        'גבינה': ['גבינות'],
        'יוגורט': ['יוגורט'],
        'גלידה': ['גלידה'],
        'שוקולד': ['שוקולד'],
        'ביסקוויט': ['ביסקוויטים'],
        'עוגה': ['עוגות'],
        'עוגיה': ['עוגיות'],
        'פאי': ['פאי'],
        'קרואסון': ['קרואסנים'],
        'בייגל': ['בייגלים'],
        'פיתה': ['פיתות'],
        'לחמניה': ['לחמניות'],
        'בגט': ['בגטים'],
        'טוסט': ['טוסט'],
        'פנקייק': ['פנקייק'],
        'וופל': ['וופלים'],
        'דונאט': ['דונאטים'],
        'מאפין': ['מאפינים'],
        'בראוניז': ['בראוניז'],
      };
      
      // Check if ingredient is a base form and item contains a variation
      for (const [base, variations] of Object.entries(commonVariations)) {
        if (base === ingredientWord && variations.some(variation => itemWords.includes(variation))) {
          return true;
        }
        if (variations.includes(ingredientWord) && itemWords.includes(base)) {
          return true;
        }
      }
      
      // Check for item name starting with ingredient (but not the reverse to avoid "salt" matching "salted butter")
      if (normalizedItemName.startsWith(ingredientWord + ' ') || 
          normalizedItemName.endsWith(' ' + ingredientWord) ||
          normalizedItemName.includes(' ' + ingredientWord + ' ')) {
        return true;
      }
      
      return false;
    };

    for (const ingredient of meal.ingredients) {
      // Get fresh inventory data for each ingredient
      const currentInventory = await getFreshInventory();
      
      // Find matching items using precise matching
      const matchingItems = currentInventory.filter(item => 
        isExactMatch(item.name, ingredient.name)
      );

      if (matchingItems.length === 0) {
        insufficientItems.push(ingredient.name);
        continue;
      }

      // Sort by expiration date (use oldest first)
      matchingItems.sort((a, b) => a.eatByDate.getTime() - b.eatByDate.getTime());

      let remainingQuantity = ingredient.quantity;
      let consumed = false;

      for (const item of matchingItems) {
        if (remainingQuantity <= 0) break;

        // Check if units are compatible using proper unit conversion
        if (!areUnitsCompatible(item.unit, ingredient.unit)) {
          continue;
        }

        // Convert item quantity to ingredient unit for comparison
        const convertedItemQuantity = convertUnit(item.amount, item.unit, ingredient.unit);
        if (convertedItemQuantity === null) {
          continue;
        }

        const consumeQuantity = Math.min(remainingQuantity, convertedItemQuantity);

        if (consumeQuantity > 0) {
          // Convert consumed quantity back to item's unit for inventory update
          const consumedInItemUnit = convertUnit(consumeQuantity, ingredient.unit, item.unit);
          if (consumedInItemUnit === null) {
            continue;
          }

          const newAmount = item.amount - consumedInItemUnit;
          
          if (newAmount <= 0) {
            // Remove the item completely
            await removeFoodItem(item.id);
          } else {
            // Update the item with reduced amount
            const updatedItem = { ...item, amount: newAmount };
            await updateFoodItem(updatedItem);
          }

          remainingQuantity -= consumeQuantity;
          consumed = true;
          consumedItems.push(`${ingredient.name} (${consumeQuantity} ${ingredient.unit})`);
          
          // Get fresh inventory after each modification to avoid stale data
          await getFreshInventory();
        }
      }

      if (!consumed || remainingQuantity > 0) {
        insufficientItems.push(ingredient.name);
      }
    }

    // Return results instead of showing toasts immediately
    return { consumedItems, insufficientItems };
  };

  const handleMoveToInventory = async (meal: MealPlan, foodItem: Omit<FoodItem, 'id' | 'userId'>) => {
    // Consume ingredients from inventory
    const { consumedItems, insufficientItems } = await consumeIngredients(meal);
    
    // Add the food item to inventory (suppress toast since we'll show a comprehensive one)
    addFoodItem(foodItem, true);
    
    // Remove from meal plans
    removeMealPlan(meal.id);
    
    // Clear AI recommendations cache to force refresh
    clearCacheOnInventoryChange();
    
    // Show comprehensive results to user
    if (consumedItems.length > 0 && insufficientItems.length === 0) {
      toast({
        title: 'Meal moved to inventory',
        description: `Successfully consumed ingredients: ${consumedItems.join(', ')}`,
      });
    } else if (consumedItems.length > 0 && insufficientItems.length > 0) {
      toast({
        title: 'Meal moved to inventory',
        description: `Consumed: ${consumedItems.join(', ')}. Missing: ${insufficientItems.join(', ')}`,
        variant: 'destructive',
      });
    } else if (consumedItems.length === 0 && insufficientItems.length > 0) {
      toast({
        title: 'Meal moved to inventory',
        description: `No ingredients consumed. Missing: ${insufficientItems.join(', ')}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Meal moved to inventory',
        description: 'Meal plan successfully moved to inventory.',
      });
    }
  };

  const handleOpenPhotoAnalysis = () => {
    setShowPhotoAnalysis(true);
  };

  const handleOpenVoiceRecording = () => {
    setShowVoiceRecording(true);
  };

  const handleOpenMealPlanVoiceRecording = () => {
    setShowMealPlanVoiceRecording(true);
  };

  const handleMealPlanVoiceRecordingComplete = (mealPlan: Omit<MealPlan, 'id' | 'userId'>) => {
    addMealPlan(mealPlan);
    setShowMealPlanVoiceRecording(false);
  };

  const handlePhotoAnalysisComplete = (item: Omit<FoodItem, 'id' | 'userId'>) => {
    addFoodItem(item);
    
    // Update consumption pattern for raw materials
    if (item.label === 'raw material') {
      updateConsumptionPattern({
        ...item,
        id: '', // Will be generated
        userId: user.id
      });
    }
    
    // Clear AI recommendations cache to force refresh
    clearCacheOnInventoryChange();
    
    setShowPhotoAnalysis(false);
  };

  const handleBulkPhotoAnalysisComplete = (items: Omit<FoodItem, 'id' | 'userId'>[]) => {
    items.forEach(item => {
      addFoodItem(item);
      
      // Update consumption pattern for raw materials
      if (item.label === 'raw material') {
        updateConsumptionPattern({
          ...item,
          id: '', // Will be generated
          userId: user.id
        });
      }
    });
    
    // Clear AI recommendations cache to force refresh
    clearCacheOnInventoryChange();
    
    setShowPhotoAnalysis(false);
  };

  const handleVoiceRecordingComplete = (items: Omit<FoodItem, 'id' | 'userId'>[]) => {
    items.forEach(item => {
      addFoodItem(item);
      
      // Update consumption pattern for raw materials
      if (item.label === 'raw material') {
        updateConsumptionPattern({
          ...item,
          id: '', // Will be generated
          userId: user.id
        });
      }
    });
    
    // Clear AI recommendations cache to force refresh
    clearCacheOnInventoryChange();
    
    setShowVoiceRecording(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return (
          <div className="space-y-6">
            {/* AI Recommendations Section */}
            
            <InventoryDashboard
              foodItems={foodItems}
              onRemoveItem={removeFoodItem}
              onEditItem={setEditingItem}
              onAddItem={addFoodItem}
              userId={user.id}
              onNavigateToSettings={() => setActiveTab('settings')}
              recentActions={recentActions}
              historyLoading={historyLoading}
              refetchHistory={refetchHistory}
            />
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
            userId={user.id}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
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
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {activeTab === 'inventory' ? 'Add Food Item' : 'Add Meal Plan'}
                </Button>
                {activeTab === 'inventory' && user.id && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <PhotoAnalysisButton
                      onOpen={handleOpenPhotoAnalysis}
                      onNavigateToSettings={() => setActiveTab('settings')}
                      disabled={false}
                      className="sm:w-auto"
                    />
                    <VoiceRecordingButton
                      onOpen={handleOpenVoiceRecording}
                      onNavigateToSettings={() => setActiveTab('settings')}
                      disabled={false}
                      className="sm:w-auto"
                    />
                  </div>
                )}
                {activeTab === 'meals' && user.id && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <RecipeGenerator 
                      foodItems={foodItems} 
                      onAddMealPlan={addMealPlan} 
                      onNavigateToSettings={() => setActiveTab('settings')} 
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowSavedRecipes(true)}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/30"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      Saved Recipes
                    </Button>
                    <MealPlanVoiceRecordingButton
                      onOpen={handleOpenMealPlanVoiceRecording}
                      onNavigateToSettings={() => setActiveTab('settings')}
                      disabled={false}
                      className="sm:w-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {renderContent()}

        {showAddForm && activeTab !== 'settings' && (
          <AddItemForm
            type={activeTab}
            onSubmit={activeTab === 'inventory' ? addFoodItem : addMealPlan}
            onClose={() => setShowAddForm(false)}
            onMealCombinationUpdate={updateMealCombination}
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

        {showPhotoAnalysis && (
          <PhotoAnalysis
            isOpen={showPhotoAnalysis}
            onClose={() => setShowPhotoAnalysis(false)}
            onAnalysisComplete={handlePhotoAnalysisComplete}
            onBulkAnalysisComplete={handleBulkPhotoAnalysisComplete}
            userId={user.id}
          />
        )}

        {showVoiceRecording && (
          <VoiceRecording
            isOpen={showVoiceRecording}
            onClose={() => setShowVoiceRecording(false)}
            onAnalysisComplete={handleVoiceRecordingComplete}
            userId={user.id}
          />
        )}

        {showMealPlanVoiceRecording && (
          <MealPlanVoiceRecording
            isOpen={showMealPlanVoiceRecording}
            onClose={() => setShowMealPlanVoiceRecording(false)}
            onAnalysisComplete={handleMealPlanVoiceRecordingComplete}
            userId={user.id}
          />
        )}

        {/* Dashboard Window */}
        {isDashboardWindowOpen && dashboardData && (
          <DashboardWindow
            isOpen={isDashboardWindowOpen}
            onClose={() => setIsDashboardWindowOpen(false)}
            recentActions={dashboardData.recentActions || recentActions}
            historyLoading={dashboardData.historyLoading || historyLoading}
            userId={dashboardData.userId || user.id}
            statusCounts={dashboardData.statusCounts || {
              total: 0,
              fresh: 0,
              'use-soon': 0,
              'use-or-throw': 0,
              expired: 0
            }}
          />
        )}

        {/* Saved Recipes */}
        <SavedRecipes
          isOpen={showSavedRecipes}
          onClose={() => setShowSavedRecipes(false)}
          onAddMealPlan={addMealPlan}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
