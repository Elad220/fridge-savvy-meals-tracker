# Quantity Field Structure Changes

## Overview
This document outlines the changes made to convert the `quantity` field from a free text field to a structured approach with separate `amount` (number) and `unit` (string) fields.

## Changes Made

### 1. Type Definitions (`src/types/index.ts`)
- **Updated `FoodItem` interface**:
  - Removed: `quantity: string`
  - Added: `amount: number` and `unit: string`
- **Added `FOOD_UNITS` constant** with comprehensive list of common food units:
  - Pieces: `pcs`, `pieces`, `item`, `items`
  - Containers: `small container`, `medium container`, `large container`, `small bowl`, `medium bowl`, `large bowl`, `small pot`, `medium pot`, `large pot`
  - Packaging: `dozen`, `pack`, `packs`, `packet`, `packets`
  - Servings: `serving`, `servings`, `portion`, `portions`
  - Volume: `cup`, `cups`, `tbsp`, `tsp`, `ml`, `l`, `liter`, `liters`
  - Weight: `g`, `gr`, `gram`, `grams`, `kg`, `kilogram`, `kilograms`, `oz`, `ounce`, `ounces`, `lb`, `lbs`, `pound`, `pounds`
  - Portions: `slice`, `slices`, `half`, `quarter`, `third`
  - Containers: `bag`, `bags`, `box`, `boxes`, `bottle`, `bottles`, `can`, `cans`, `jar`, `jars`, `tube`, `tubes`

### 2. Form Components Updated

#### `AddItemForm.tsx`
- Replaced single quantity input with:
  - Amount: Number input with decimal support (step="0.1", min="0.1")
  - Unit: Dropdown select with all available units
- Added validation for amount field (must be positive number)
- Updated default values: `amount: '1'`, `unit: 'serving'`

#### `EditItemForm.tsx`
- Same structure as AddItemForm
- Converts existing item's amount/unit to string for form handling
- Added validation for amount field

#### `PhotoAnalysisEditForm.tsx`
- Updated to use amount and unit fields
- Added support for AI-estimated quantity (`estimated_amount` and `estimated_unit`)
- Defaults to AI estimates or fallback values

#### `MoveToInventoryModal.tsx`
- Updated to use amount and unit structure
- Default values: `amount: '1'`, `unit: 'serving'`

### 3. Display Components Updated

#### `FoodItemCard.tsx`
- Updated quantity display from `{item.quantity}` to `{item.amount} {item.unit}`

### 4. Data Handling Updated

#### `useFoodItems.tsx` Hook
- **fetchFoodItems**: Updated to map database fields to new structure with defaults
- **addFoodItem**: Updated to insert amount and unit fields
- **updateFoodItem**: Updated to update amount and unit fields
- **Action logging**: Updated to format quantity as `"${amount} ${unit}"` for consistency

#### `InventoryDashboard.tsx`
- Updated hardcoded quantity value to use amount and unit structure

### 5. Photo Analysis Function Updated

#### `supabase/functions/analyze-photo/index.ts`
- **Enhanced AI prompt** to estimate quantity information
- **Added new response fields**:
  - `estimated_amount`: Number (e.g., 1, 2, 0.5)
  - `estimated_unit`: String from predefined list
- **Updated prompt instructions** to guide AI in quantity estimation
- **Added fallback values** for missing quantity estimates

### 6. Database Migration

#### `supabase/migrations/20250115000000-update-quantity-to-amount-unit.sql`
- **Added new columns**: `amount DECIMAL(10,2)`, `unit VARCHAR(50)`
- **Data migration logic**: Attempts to parse existing quantity strings
  - Extracts numeric values for amount
  - Extracts unit text or defaults to 'item'
- **Cleanup**: Removes old quantity column

## Database Schema Changes
```sql
-- Before
quantity VARCHAR(255)

-- After
amount DECIMAL(10,2) NOT NULL
unit VARCHAR(50) NOT NULL
```

## UI/UX Improvements
1. **Better Data Consistency**: Structured data instead of free text
2. **Improved Analytics**: Can now aggregate by units, calculate totals
3. **Better User Experience**: Dropdown selection prevents typos
4. **Enhanced AI Integration**: AI can now estimate quantities more accurately

## Next Steps Required
1. **Run Database Migration**: Apply the migration to update the schema
2. **Test All Forms**: Ensure all CRUD operations work correctly
3. **Verify Data Display**: Check that all quantity displays show correctly
4. **Test Photo Analysis**: Verify AI quantity estimation works properly
5. **User Testing**: Test the new UI for usability

## Backward Compatibility
- The migration attempts to parse existing quantity strings
- Unparseable quantities default to `1 item`
- All existing functionality is preserved with improved structure

## Benefits
- **Structured Data**: Enables better reporting and analytics
- **Consistency**: Standardized units prevent user errors
- **AI Integration**: Better photo analysis with quantity estimation
- **Scalability**: Easy to add new units or modify existing ones
- **Data Integrity**: Numeric amounts enable calculations and comparisons