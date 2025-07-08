# AI Recommendations Cooldown Implementation

## Overview

This implementation adds a 10-hour cooldown period for AI recommendations to prevent excessive API calls and improve performance. Recommendations will only be generated if:

1. No recommendations exist for the user
2. The last recommendations are older than 10 hours
3. There have been inventory changes since the last recommendation generation

## Key Features

### 1. Smart Caching System
- **Cache Storage**: Recommendations are stored in the `ai_recommendations` table
- **Cache Retrieval**: Recent recommendations are loaded from cache instead of regenerating
- **Cache Invalidation**: Cache is cleared when inventory changes are detected

### 2. Inventory Change Detection
- **Action History Tracking**: Uses the `action_history` table to detect inventory changes
- **Real-time Monitoring**: Checks for changes since the last recommendation generation
- **Automatic Refresh**: Forces new recommendations when inventory is modified

### 3. Time-based Cooldown
- **10-Hour Window**: Recommendations are considered fresh for 10 hours
- **Graceful Degradation**: Falls back to cached recommendations when appropriate
- **User Feedback**: Provides clear messaging when using cached recommendations

## Implementation Details

### Frontend Changes (`src/hooks/useAIRecommendations.tsx`)

#### New Functions:
- `shouldGenerateRecommendations()`: Checks if new recommendations should be generated
- `loadCachedRecommendations()`: Loads recent recommendations from cache
- `clearCacheOnInventoryChange()`: Clears cache when inventory changes

#### Key Logic:
```typescript
// Check if recommendations are older than 10 hours
const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
if (lastGeneratedAt < tenHoursAgo) {
  return true; // Generate new recommendations
}

// Check for inventory changes since last generation
const recentActions = await supabase
  .from('action_history')
  .select('created_at')
  .eq('user_id', userId)
  .gte('created_at', lastGeneratedAt.toISOString());
```

### Backend Changes (`supabase/functions/ai-recommendations/index.ts`)

#### New Methods:
- `shouldGenerateRecommendations()`: Server-side cooldown check
- Enhanced caching logic in the main handler

#### Cache Management:
```typescript
// Save recommendations to cache when generated
await supabase.from('ai_recommendations').upsert({
  user_id: userId,
  recommendation_type: 'comprehensive',
  recommendations: result,
  generated_at: result.metadata?.generatedAt,
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
});
```

## Database Schema

### `ai_recommendations` Table
```sql
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL, -- 'comprehensive'
  recommendations JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 day')
);
```

### `action_history` Table
```sql
CREATE TABLE public.action_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'add' or 'remove'
  item_name TEXT NOT NULL,
  item_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

## User Experience

### When Recommendations Are Fresh (< 10 hours, no inventory changes):
- Users see cached recommendations immediately
- No API calls are made
- Clear messaging: "Using recent recommendations - no new analysis needed"

### When Recommendations Are Stale (> 10 hours):
- New recommendations are generated automatically
- Full AI analysis is performed
- Results are cached for future use

### When Inventory Changes Are Detected:
- Cache is cleared automatically
- New recommendations are generated
- Fresh analysis reflects current inventory state

## Benefits

1. **Reduced API Costs**: Minimizes unnecessary AI API calls
2. **Improved Performance**: Faster loading with cached recommendations
3. **Better User Experience**: Immediate response with fresh data
4. **Intelligent Updates**: Only regenerates when meaningful changes occur
5. **Resource Efficiency**: Reduces server load and processing time

## Monitoring and Debugging

### Console Logs:
- `"Skipping recommendation generation - recent recommendations available and no inventory changes"`
- `"Loading cached recommendations from: [timestamp]"`
- `"Cache cleared due to inventory changes"`

### Error Handling:
- Graceful fallback to generation if cache operations fail
- Comprehensive error logging for debugging
- User-friendly error messages

## Future Enhancements

1. **Configurable Cooldown**: Allow users to adjust the 10-hour window
2. **Smart Notifications**: Alert users when recommendations are refreshed
3. **Analytics**: Track recommendation usage and effectiveness
4. **A/B Testing**: Compare performance with different cooldown periods