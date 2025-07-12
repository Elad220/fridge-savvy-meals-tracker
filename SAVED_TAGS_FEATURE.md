# Saved Tags Feature

## Overview

The Saved Tags feature allows users to save and quickly reuse tags across their food items, recipes, and meal plans. This improves efficiency by eliminating the need to retype commonly used tags.

## Features

### 1. Automatic Tag Saving
- Tags are automatically saved when added to any item (food, recipe, or meal)
- Tags are categorized by type: `food`, `recipe`, `meal`, or `general`
- Usage counts track how frequently each tag is used

### 2. Quick Tag Selection
- Click the bookmark icon (📖) next to the tag input to see saved tags
- Saved tags are displayed in a popover with usage counts
- Click on any saved tag to add it to the current item
- Tags are filtered by category for better organization

### 3. Tag Management
- **Favorites**: Click the star icon (⭐) to mark tags as favorites
- **Delete**: Click the trash icon (🗑️) to remove saved tags
- **Usage Tracking**: See how many times each tag has been used

### 4. Categories
- **Food**: Tags for food items (e.g., "organic", "frozen", "pantry")
- **Recipe**: Tags for recipes (e.g., "breakfast", "vegetarian", "quick")
- **Meal**: Tags for meal plans (e.g., "weeknight", "special occasion")
- **General**: Tags that can be used across all categories

## Database Schema

### saved_tags Table
```sql
CREATE TABLE public.saved_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_category TEXT NOT NULL DEFAULT 'general',
  usage_count INTEGER DEFAULT 1,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, tag_name, tag_category)
);
```

## Components

### TagInput Component
A reusable component that provides:
- Tag input with auto-save functionality
- Saved tags popover with management options
- Category-based filtering
- Favorite and delete actions

**Props:**
- `value`: Array of current tags
- `onChange`: Callback when tags change
- `category`: Tag category ('food', 'recipe', 'meal', 'general')
- `placeholder`: Input placeholder text
- `label`: Label for the tag input
- `maxTags`: Maximum number of tags allowed
- `showSavedTags`: Whether to show saved tags (default: true)
- `allowNewTags`: Whether to allow adding new tags (default: true)

### useSavedTags Hook
Custom hook for managing saved tags:

**Methods:**
- `addSavedTag(tagName, category)`: Add or update a saved tag
- `updateSavedTag(id, updates)`: Update a saved tag
- `deleteSavedTag(id)`: Delete a saved tag
- `toggleFavorite(id)`: Toggle favorite status
- `getPopularTags(limit)`: Get most used tags
- `getFavoriteTags()`: Get favorite tags

## Usage Examples

### Basic Tag Input
```tsx
import { TagInput } from '@/components/TagInput';

const [tags, setTags] = useState<string[]>([]);

<TagInput
  value={tags}
  onChange={setTags}
  category="food"
  placeholder="Add food tag"
  label="Food Tags"
/>
```

### Tag Input with Limits
```tsx
<TagInput
  value={tags}
  onChange={setTags}
  category="recipe"
  maxTags={5}
  placeholder="Add recipe tag"
  label="Recipe Tags (Max 5)"
/>
```

### Tag Input without Saved Tags
```tsx
<TagInput
  value={tags}
  onChange={setTags}
  showSavedTags={false}
  placeholder="Add tag"
  label="Tags"
/>
```

## Integration

The feature has been integrated into:
- `AddItemForm`: For food items and meal plans
- `EditItemForm`: For editing food items
- `AddRecipeForm`: For creating recipes
- `EditRecipeForm`: For editing recipes

## Migration

To set up the saved tags feature, run the database migration:

```bash
npx supabase db push
```

This will create the `saved_tags` table with proper indexes and RLS policies.

## Future Enhancements

1. **Tag Suggestions**: AI-powered tag suggestions based on item names
2. **Tag Analytics**: Dashboard showing tag usage patterns
3. **Tag Sharing**: Share tag collections between users
4. **Bulk Tag Operations**: Add/remove tags from multiple items at once
5. **Tag Hierarchies**: Parent-child relationships between tags
6. **Tag Synonyms**: Alternative names for the same tag concept

## Testing

The feature can be tested using the `SavedTagsDemo` component which showcases:
- Different tag categories
- Tag management functionality
- UI interactions
- Feature highlights

## Security

- Row Level Security (RLS) ensures users can only access their own saved tags
- All database operations are properly authenticated
- Input validation prevents malicious tag names
- Rate limiting prevents abuse of tag creation