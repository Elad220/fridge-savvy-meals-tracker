import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TagInput } from '@/components/TagInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, Star, StarOff, Trash2 } from 'lucide-react';

export const SavedTagsDemo = () => {
  const [foodTags, setFoodTags] = useState<string[]>(['organic', 'frozen']);
  const [recipeTags, setRecipeTags] = useState<string[]>(['breakfast', 'vegetarian']);
  const [mealTags, setMealTags] = useState<string[]>(['quick', 'healthy']);

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Saved Tags Feature Demo</h1>
        <p className="text-muted-foreground">
          This feature allows you to save and quickly reuse tags across your food items, recipes, and meal plans.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Food Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              Food Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              value={foodTags}
              onChange={setFoodTags}
              category="food"
              placeholder="Add food tag"
              label="Food Tags"
            />
            <div className="mt-4">
              <h4 className="font-medium mb-2">Current Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {foodTags.map((tag, index) => (
                  <div key={index}>
                    <Badge variant="secondary">
                      {tag}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recipes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              Recipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              value={recipeTags}
              onChange={setRecipeTags}
              category="recipe"
              placeholder="Add recipe tag"
              label="Recipe Tags"
            />
            <div className="mt-4">
              <h4 className="font-medium mb-2">Current Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {recipeTags.map((tag, index) => (
                  <div key={index}>
                    <Badge variant="secondary">
                      {tag}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meal Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              Meal Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              value={mealTags}
              onChange={setMealTags}
              category="meal"
              placeholder="Add meal tag"
              label="Meal Tags"
            />
            <div className="mt-4">
              <h4 className="font-medium mb-2">Current Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {mealTags.map((tag, index) => (
                  <div key={index}>
                    <Badge variant="secondary">
                      {tag}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Highlights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                Saved Tags
              </h4>
              <p className="text-sm text-muted-foreground">
                Tags are automatically saved when you add them to items. Click the bookmark icon to see your saved tags.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Star className="w-4 h-4" />
                Favorites
              </h4>
              <p className="text-sm text-muted-foreground">
                Mark frequently used tags as favorites for quick access. Click the star icon to toggle favorites.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Tag Management
              </h4>
              <p className="text-sm text-muted-foreground">
                Remove saved tags you no longer need. Usage counts help identify your most popular tags.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Categories</h4>
              <p className="text-sm text-muted-foreground">
                Tags are organized by category (food, recipe, meal) for better organization and quick filtering.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};