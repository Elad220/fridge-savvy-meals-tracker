# AI-Powered Food Recommendations Implementation

## Overview
This document describes the implementation of intelligent item recommendations using GenAI that analyzes comprehensive database data to provide personalized suggestions.

## Key Improvements

### 1. Database-Driven Analysis
- **Direct Database Queries**: The system now queries the database directly instead of relying on UI data
- **Comprehensive Data Sources**: Analyzes food_items, action_history, consumption_patterns, meal_combinations, user_preferences, and meal_plans
- **Real-time Data**: Always uses the most current data from the database

### 2. GenAI-Powered Recommendations
- **Intelligent Analysis**: Uses AI providers (OpenAI, Anthropic, Gemini) to analyze patterns and trends
- **Contextual Understanding**: AI understands consumption patterns, meal preferences, and inventory health
- **Personalized Suggestions**: Recommendations are tailored to individual user behavior and preferences

### 3. Enhanced Features

#### Shopping Recommendations
- Based on consumption patterns and current inventory
- Considers seasonal trends and meal planning
- Provides confidence levels for recommendations
- Suggests optimal quantities based on usage patterns

#### Low Stock Alerts
- Intelligent prediction of when items will run out
- Considers consumption rate and current stock
- Provides urgency levels (high/medium/low)
- Suggests recommended restock quantities

#### Meal Suggestions
- AI-generated meal ideas based on available ingredients
- Considers dietary preferences and restrictions
- Provides difficulty levels and prep times
- Explains why each meal is recommended

#### Insights & Analytics
- **Consumption Trends**: Analysis of eating patterns over time
- **Inventory Health**: Overall assessment of current stock levels
- **Shopping Patterns**: Analysis of purchasing behavior
- **Meal Preferences**: Identification of favorite meal types
- **General Suggestions**: AI-powered improvement recommendations

#### Next Actions
- Specific, actionable recommendations
- Prioritized by importance (high/medium/low)
- Clear reasoning for each suggestion

## Technical Implementation

### 1. Edge Function: `ai-recommendations`
- **Location**: `supabase/functions/ai-recommendations/index.ts`
- **Purpose**: Analyzes database data and generates AI-powered recommendations
- **Multi-Provider Support**: Works with OpenAI, Anthropic, and Gemini
- **Comprehensive Analysis**: Queries all relevant user data

### 2. Updated Hook: `useAIRecommendations`
- **Location**: `src/hooks/useAIRecommendations.tsx`
- **Database-First**: Queries database directly instead of using UI props
- **Caching**: Implements 24-hour caching for performance
- **Error Handling**: Robust error handling with user feedback

### 3. Enhanced Component: `AIRecommendations`
- **Location**: `src/components/AIRecommendations.tsx`
- **Four Tabs**: Shopping, Meals, Insights, and Actions
- **Rich UI**: Displays confidence levels, urgency, and detailed reasoning
- **Interactive**: Users can add items to shopping list directly

### 4. Database Schema

#### Core Tables:
- `ai_recommendations`: Caches AI-generated recommendations
- `consumption_patterns`: Tracks item usage patterns
- `meal_combinations`: Stores frequently prepared meals
- `user_preferences`: User dietary and shopping preferences

#### Supporting Tables:
- `food_items`: Current inventory
- `action_history`: User actions (add/remove items)
- `meal_plans`: Planned meals

## AI Analysis Process

### 1. Data Collection
The AI service queries:
- Current inventory with amounts and units
- Recent action history (last 100 actions)
- Consumption patterns and purchase history
- Meal combinations and frequencies
- User preferences and dietary restrictions
- Meal plans and planned dates

### 2. AI Processing
The AI analyzes:
- **Consumption Patterns**: How often items are used
- **Inventory Gaps**: Items frequently used but low in stock
- **Meal Preferences**: Common meal combinations and ingredients
- **Shopping Behavior**: Purchase frequency and quantities
- **Seasonal Trends**: Time-based consumption patterns

### 3. Recommendation Generation
The AI provides:
- **Shopping List**: Items to purchase with quantities and reasoning
- **Low Stock Alerts**: Items running low with urgency levels
- **Meal Suggestions**: Recipes based on available ingredients
- **Insights**: Analysis of patterns and trends
- **Next Actions**: Specific improvements to implement

## User Experience

### 1. Automatic Analysis
- Recommendations are generated automatically when users visit the inventory page
- Cached for 24 hours to ensure fast loading
- Refreshed when significant data changes occur

### 2. Smart Notifications
- Low stock alerts appear as dismissible pop-ups
- Urgency levels help users prioritize restocking
- Direct integration with shopping list functionality

### 3. Actionable Insights
- Clear reasoning for each recommendation
- Confidence levels help users understand AI certainty
- Specific next actions guide user improvements

### 4. Learning System
- The more users interact, the better recommendations become
- AI learns from consumption patterns and meal preferences
- Recommendations adapt to changing user behavior

## Configuration

### 1. AI Provider Selection
Users can choose between:
- **OpenAI**: GPT-4o-mini for text generation
- **Anthropic**: Claude-3-5-haiku for analysis
- **Gemini**: Gemini-2.0-flash for recommendations

### 2. Language Preferences
- AI responses are generated in the user's preferred language
- Supports multiple languages for international users

### 3. Caching Strategy
- Recommendations cached for 24 hours
- Automatic refresh when inventory changes significantly
- Manual refresh option available

## Performance Optimizations

### 1. Efficient Queries
- Database queries are optimized with proper indexing
- Parallel processing of different recommendation types
- Client-side caching reduces server load

### 2. AI Provider Management
- Fallback mechanisms if primary provider fails
- Rate limiting and error handling
- Efficient token usage for cost optimization

### 3. User Experience
- Loading states provide clear feedback
- Error handling with helpful messages
- Responsive design for all device types

## Future Enhancements

### 1. Advanced Features
- **Recipe Integration**: Suggest recipes based on available ingredients
- **Seasonal Adjustments**: Account for seasonal consumption patterns
- **Nutritional Balance**: Ensure recommended items maintain dietary balance
- **Multi-user Households**: Share recommendations across household members

### 2. AI Improvements
- **Predictive Analytics**: Forecast future consumption needs
- **Smart Meal Planning**: AI-generated weekly meal plans
- **Waste Reduction**: Suggestions to minimize food waste
- **Cost Optimization**: Budget-aware shopping recommendations

### 3. Integration Features
- **Shopping List Export**: Export to popular shopping apps
- **Calendar Integration**: Sync meal plans with calendar
- **Voice Commands**: Voice-activated shopping list management
- **Smart Notifications**: Push notifications for low stock alerts

## Usage

The AI recommendations appear automatically on the inventory page. Users can:
- View intelligent shopping recommendations based on consumption patterns
- See and dismiss low stock alerts with urgency levels
- Browse AI-suggested meals with difficulty ratings
- Review detailed insights about their consumption patterns
- Follow specific next actions to improve their food management

The system continuously learns from user behavior, providing increasingly personalized and accurate recommendations over time.