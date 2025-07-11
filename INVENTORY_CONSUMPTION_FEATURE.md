# Inventory Consumption Feature

## Overview

The "Move to Inventory" feature in the meal plans view now includes automatic inventory consumption functionality. When a user moves a meal plan to inventory, the system will automatically attempt to deduct the required ingredients from the user's current inventory.

## How It Works

### 1. Ingredient Matching
The system uses a sophisticated matching algorithm to find inventory items that correspond to the meal plan ingredients:

- **Exact matches**: Direct name matches (e.g., "tomato" matches "tomato")
- **Word variations**: Handles common variations (e.g., "tomato" matches "tomatoes")
- **Multi-word ingredients**: Matches ingredients with multiple words (e.g., "olive oil" matches "extra virgin olive oil")
- **Common food variations**: Handles common food name variations like:
  - tomato/tomatoes
  - potato/potatoes
  - onion/onions
  - etc.

### 2. Unit Conversion
The system can convert between different units to match ingredients with inventory items:
- Weight units: grams, kilograms, ounces, pounds
- Volume units: milliliters, liters, cups, tablespoons, teaspoons
- Count units: pieces, items, servings, etc.

### 3. Consumption Process
When moving a meal plan to inventory:

1. **Check for ingredients**: If the meal plan has ingredients listed, the system will attempt to consume them
2. **Match inventory items**: Find matching items in the user's inventory
3. **Convert units**: Convert between different units if necessary
4. **Deduct quantities**: Reduce the amount of matching inventory items
5. **Remove empty items**: Completely remove inventory items if their quantity reaches zero
6. **Provide feedback**: Show toast notifications for successfully consumed items and insufficient ingredients

## User Interface Enhancements

### Meal Plan Cards
- **Ingredient display**: Meal plan cards now show the first 3 ingredients with a "+X more" indicator
- **Visual indicator**: Ingredients are displayed in a blue-themed section
- **Button enhancement**: The "To Inventory" button shows a count badge when ingredients are present

### Move to Inventory Modal
- **Ingredient preview**: The modal shows a list of ingredients that will be consumed
- **Clear feedback**: Users can see exactly what will be deducted from their inventory
- **Information alert**: An info box displays the ingredients that will be consumed

## Technical Implementation

### Key Functions

#### `consumeIngredients(meal: MealPlan)`
Located in `src/pages/Index.tsx`, this function:
- Fetches fresh inventory data from the database
- Matches ingredients with inventory items using precise matching
- Converts units between different measurement systems
- Deducts consumed quantities from inventory
- Provides user feedback through toast notifications

#### `handleMoveToInventory(meal: MealPlan, foodItem: Omit<FoodItem, 'id' | 'userId'>)`
This function orchestrates the entire process:
1. Calls `consumeIngredients(meal)` to deduct ingredients
2. Adds the cooked meal to inventory
3. Removes the meal plan
4. Clears AI recommendations cache

### Unit Conversion System
The system includes comprehensive unit conversion capabilities:
- **Weight conversions**: g ↔ kg ↔ oz ↔ lb
- **Volume conversions**: ml ↔ l ↔ cups ↔ tbsp ↔ tsp
- **Count conversions**: pieces ↔ items ↔ servings

### Error Handling
- **Insufficient ingredients**: Users are notified when there aren't enough ingredients in inventory
- **Unit incompatibility**: Items with incompatible units are skipped
- **Database errors**: Graceful fallback to current state if database operations fail

## User Experience

### Before Moving to Inventory
Users can see:
- Which ingredients will be consumed (in the modal)
- How many ingredients are in the meal plan (badge on button)
- A preview of the ingredients in the meal plan card

### During the Process
The system:
- Shows progress through toast notifications
- Handles errors gracefully
- Provides clear feedback about what was consumed

### After Moving to Inventory
Users receive:
- Success notifications for consumed ingredients
- Warnings for insufficient ingredients
- Updated inventory reflecting the consumed items

## Benefits

1. **Automatic inventory management**: No need to manually track ingredient consumption
2. **Reduced food waste**: Helps users use ingredients before they expire
3. **Better meal planning**: Users can see what ingredients they need
4. **Improved accuracy**: Sophisticated matching prevents incorrect deductions
5. **Clear feedback**: Users always know what's happening with their inventory

## Future Enhancements

Potential improvements could include:
- **Shopping list generation**: Automatically add missing ingredients to shopping list
- **Recipe suggestions**: Suggest recipes based on available ingredients
- **Expiration warnings**: Alert users when ingredients are about to expire
- **Batch operations**: Allow moving multiple meal plans at once
- **Ingredient substitution**: Suggest alternatives when ingredients are not available 