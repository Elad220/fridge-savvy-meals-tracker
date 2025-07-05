import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { audio, userId } = await req.json();

    if (!userId || !audio) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: userId and audio'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }

    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Missing authorization header'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }

    // Initialize Supabase client with the user's token
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          authorization: authHeader
        }
      }
    });

    // Get the decrypted API token
    const { data: tokenData, error: tokenError } = await supabase.rpc('get_decrypted_api_token', {
      p_token_name: 'gemini'
    });

    if (tokenError || !tokenData) {
      console.error('Token error:', tokenError);
      return new Response(JSON.stringify({
        error: 'Invalid or missing API token. Please add your Gemini API token in the settings.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }

    // Get the user's preferred language
    const { data: languageData } = await supabase.rpc('get_decrypted_api_token', {
      p_token_name: 'ai_language'
    });
    const replyLanguage = languageData || 'English';

    // Use the decrypted token
    const apiToken = tokenData;
    console.log('Successfully retrieved decrypted API token for voice analysis');

    // Create the prompt for Gemini with dynamic language
    const prompt = `Analyze this audio recording where the user is describing food items they want to add to their inventory. 

The user is speaking about food items they've bought or want to track. Extract all the food items mentioned along with their quantities and details.

Please respond in this EXACT JSON format:
{
  "items": [
    {
      "name": "Brief descriptive name of the food item",
      "item_type": "cooked_meal" OR "raw_material",
      "quantity": number (e.g., 1, 2, 0.5),
      "unit": "one of: item, items, piece, pieces, serving, servings, cup, cups, tbsp, tsp, ml, l, liter, liters, g, gr, gram, grams, kg, kilogram, kilograms, oz, ounce, ounces, lb, lbs, pound, pounds, slice, slices, dozen, pack, packs, packet, packets, bag, bags, box, boxes, bottle, bottles, can, cans, jar, jars, tube, tubes",
      "estimated_freshness_days": number (estimated days until expiration - typical values: 1-2 for very perishable items like fish, 3-5 for vegetables, 7-14 for fruits, 30+ for canned goods)
    }
  ],
  "confidence": "high/medium/low based on audio clarity and how clearly the items were mentioned"
}

Important notes:
- For item_type, use "cooked_meal" for prepared/cooked foods, "raw_material" for ingredients/raw foods
- Extract ALL food items mentioned in the recording
- If quantities are not clearly specified, use reasonable defaults (1 for single items, appropriate amounts for bulk items)
- Choose the most appropriate unit from the provided list
- For estimated_freshness_days, use typical shelf life for each item type:
  - Fresh meat/fish: 1-3 days
  - Dairy: 3-7 days  
  - Fresh vegetables: 3-7 days
  - Fresh fruits: 3-14 days
  - Bread: 3-5 days
  - Canned goods: 30+ days
  - Dry goods: 30+ days
- Write all item names in ${replyLanguage}
- If you cannot clearly understand the audio, still try to extract what you can and indicate lower confidence`;

    // Prepare the request payload with audio
    const contents = [
      {
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: "audio/wav",
              data: audio
            }
          }
        ]
      }
    ];

    // Make request to Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({
        error: 'Failed to analyze voice recording. Please check your API token.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini voice analysis response received successfully');

    const generatedText = geminiData.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText) {
      return new Response(JSON.stringify({
        error: 'No analysis generated'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }

    // Try to parse the JSON response
    let analysisResult;
    try {
      // Clean the response text to extract JSON
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}') + 1;
      const jsonText = generatedText.slice(jsonStart, jsonEnd);
      analysisResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      // Fallback: return structured data with basic info
      analysisResult = {
        items: [
          {
            name: "Food Item",
            item_type: "raw_material",
            quantity: 1,
            unit: "item",
            estimated_freshness_days: 4
          }
        ],
        confidence: "low"
      };
    }

    // Ensure the response has the required fields and format
    if (!analysisResult.items || !Array.isArray(analysisResult.items)) {
      analysisResult.items = [
        {
          name: "Food Item",
          item_type: "raw_material",
          quantity: 1,
          unit: "item",
          estimated_freshness_days: 4
        }
      ];
    }

    // Validate and fix each item
    analysisResult.items = analysisResult.items.map(item => ({
      name: item.name || "Food Item",
      item_type: item.item_type || "raw_material",
      quantity: item.quantity || 1,
      unit: item.unit || "item",
      estimated_freshness_days: item.estimated_freshness_days || 4
    }));

    if (!analysisResult.confidence) {
      analysisResult.confidence = "medium";
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in analyze-voice-recording function:', error);
    return new Response(JSON.stringify({
      error: 'An unexpected error occurred',
      details: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});