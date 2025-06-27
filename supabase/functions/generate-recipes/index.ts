
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
    const { ingredients, userId } = await req.json();

    if (!userId || !ingredients || !Array.isArray(ingredients)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId and ingredients array' }),
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

    // Create the prompt for Gemini
    const prompt = `Given these ingredients: ${ingredients.join(', ')}, 
    suggest 3 different recipes that can be made using some or all of these ingredients. 
    For each recipe, provide:
    1. Recipe name
    2. Brief description (1-2 sentences)
    3. Main ingredients needed from the list
    4. Estimated cooking time
    5. Difficulty level (Easy/Medium/Hard)
    
    Format the response as JSON with this structure:
    {
      "recipes": [
        {
          "name": "Recipe Name",
          "description": "Brief description",
          "ingredients": ["ingredient1", "ingredient2"],
          "cookingTime": "30 minutes",
          "difficulty": "Easy"
        }
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
        JSON.stringify({ error: 'Failed to generate recipes. Please check your API token.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: 'No recipes generated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Try to parse the JSON response
    let recipes;
    try {
      // Clean the response text to extract JSON
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}') + 1;
      const jsonText = generatedText.slice(jsonStart, jsonEnd);
      recipes = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      // Fallback: return the raw text
      recipes = {
        recipes: [{
          name: "Generated Recipe",
          description: generatedText.substring(0, 200) + "...",
          ingredients: ingredients.slice(0, 3),
          cookingTime: "30 minutes",
          difficulty: "Medium"
        }]
      };
    }

    return new Response(JSON.stringify(recipes), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-recipes function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
