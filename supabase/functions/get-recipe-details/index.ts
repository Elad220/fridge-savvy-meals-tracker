
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipeName, ingredients, userId } = await req.json();

    if (!userId || !recipeName || !ingredients) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, recipeName, and ingredients' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user's API token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_api_tokens')
      .select('encrypted_token')
      .eq('user_id', userId)
      .eq('token_name', 'gemini')
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'No Gemini API token found. Please add your token first.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const apiToken = tokenData.encrypted_token;

    // Create the detailed prompt for Gemini
    const prompt = `Please provide detailed cooking instructions for "${recipeName}" using these ingredients: ${ingredients.join(', ')}.

    Include:
    1. Complete ingredient list with quantities
    2. Step-by-step cooking instructions
    3. Preparation time and cooking time
    4. Serving size
    5. Difficulty level
    6. Any helpful cooking tips
    
    Format the response as JSON with this structure:
    {
      "name": "Recipe Name",
      "prepTime": "15 minutes",
      "cookTime": "30 minutes",
      "servings": "4",
      "difficulty": "Easy",
      "ingredients": [
        "1 cup ingredient1",
        "2 tbsp ingredient2"
      ],
      "instructions": [
        "Step 1: Do this...",
        "Step 2: Do that..."
      ],
      "tips": [
        "Tip 1: Helpful advice...",
        "Tip 2: Another tip..."
      ]
    }`;

    // Make request to Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get recipe details. Please check your API token.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: 'No recipe details generated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Try to parse the JSON response
    let recipeDetails;
    try {
      // Clean the response text to extract JSON
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}') + 1;
      const jsonText = generatedText.slice(jsonStart, jsonEnd);
      recipeDetails = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      // Fallback: return structured data with the raw text
      recipeDetails = {
        name: recipeName,
        prepTime: "15 minutes",
        cookTime: "30 minutes",
        servings: "4",
        difficulty: "Medium",
        ingredients: ingredients.map(ing => `1 cup ${ing}`),
        instructions: [generatedText],
        tips: ["Check the generated instructions above for complete details."]
      };
    }

    return new Response(JSON.stringify(recipeDetails), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-recipe-details function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
