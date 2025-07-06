# AI-Powered Food Recommendations Implementation

## Overview
This document describes the implementation of smart item recommendations using GenAI based on actions history and current inventory.

## Features Implemented

### 1. Smart Item Recommendations
- **Shopping Recommendations**: Based on consumption patterns and frequently used items
- **Low Stock Alerts**: Pop-up notifications for raw ingredients running low
- **Meal Recommendations**: Commonly prepared meals based on history

### 2. Database Schema

#### New Tables:
- `user_preferences`: Stores user dietary preferences and habits
- `consumption_patterns`: Tracks item consumption rates and patterns
- `ai_recommendations`: Caches AI-generated recommendations
- `meal_combinations`: Stores frequently prepared meal combinations

### 3. Components

#### AIRecommendations Component (`src/components/AIRecommendations.tsx`)
- Main component displaying all recommendations
- Three tabs: Shopping, Meals, and Insights
- Low stock alert dialog with dismissal functionality

#### useAIRecommendations Hook (`src/hooks/useAIRecommendations.tsx`)
- Analyzes consumption patterns from action history
- Generates shopping recommendations for out-of-stock frequently used items
- Calculates low stock alerts based on consumption rate
- Manages meal combinations and frequencies

### 4. Key Features

#### Low Stock Alerts
- Only for raw ingredients (not cooked meals)
- Calculates days until out based on consumption rate
- Shows pop-up when items have less than 3 days of stock
- Allows dismissing alerts or adding to shopping list

#### Consumption Pattern Analysis
- Tracks how often items are consumed
- Calculates average consumption rate
- Updates patterns when new items are added

#### Meal Combinations
- Tracks ingredients used in cooked meals
- Records frequency of meal preparation
- Suggests commonly prepared meals

### 5. Integration Points

#### Index Page Updates
- Added AI recommendations component above inventory dashboard
- Integrated consumption pattern tracking in item addition
- Updated photo and voice analysis to track patterns

#### AddItemForm Enhancement
- Added ingredients field for cooked meals
- Tracks meal combinations when adding cooked meals

### 6. User Experience

1. **Automatic Analysis**: AI analyzes user's inventory and history automatically
2. **Smart Notifications**: Low stock alerts appear as dismissible pop-ups
3. **Actionable Insights**: Users can add recommended items to shopping list
4. **Learning System**: The more the user interacts, the better recommendations become

### 7. Technical Implementation

#### Caching Strategy
- Recommendations are cached for 24 hours
- Refreshed when inventory or history changes significantly

#### Performance Optimization
- Parallel processing of different recommendation types
- Efficient database queries with proper indexing
- Client-side calculation for real-time updates

### 8. Future Enhancements

1. **Recipe Integration**: Suggest recipes based on available ingredients
2. **Seasonal Adjustments**: Account for seasonal consumption patterns
3. **Multi-user Households**: Share recommendations across household members
4. **Shopping List Export**: Export recommendations to shopping apps
5. **Nutritional Balance**: Ensure recommended items maintain dietary balance

## Usage

The AI recommendations appear automatically on the inventory page. Users can:
- View shopping recommendations based on consumption patterns
- See and dismiss low stock alerts for raw ingredients
- Browse commonly prepared meals
- View consumption insights and patterns

The system learns from user behavior over time, improving recommendations as more data is collected.