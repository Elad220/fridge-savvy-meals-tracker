import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const replyLanguage = 'Hebrew';
const year = new Date().getFullYear()
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { images, image, userId } = await req.json();
    // Backward compatibility: handle both single image and multiple images
    const imageArray = images || (image ? [
      image
    ] : []);
    if (!userId || imageArray.length === 0) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: userId and at least one image'
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
    // Get the decrypted API token using the new function
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
    // Use the decrypted token
    const apiToken = tokenData;
    console.log('Successfully retrieved decrypted API token for photo analysis');
    // Create the prompt for Gemini
    const prompt = `Analyze these ${imageArray.length} photos of the same food item from different angles and provide the following information:

1. Identify what food item this is and suggest a concise, descriptive name
2. Determine if this is a cooked meal or a raw ingredient/material
3. If it's NOT a cooked meal (i.e., it's a packaged food or raw ingredient), look for any visible expiration dates, best-by dates, or use-by dates on packaging or labels

Please respond in this EXACT JSON format:
{
  "suggested_name": "Brief descriptive name of the food item",
  "item_type": "cooked_meal" OR "raw_material",
  "expiration_date": "YYYY-MM-DD format if found and applicable, otherwise null",
  "confidence": "high/medium/low based on image clarity and visibility of details"
}

Important notes:
- For item_type, use "cooked_meal" for prepared/cooked foods, "raw_material" for ingredients/packaged foods
- Some products may only contain a day and month expiration date in the format DD-MM or DD/MM. In such cases, assume the year is ${year}.
- Only include expiration_date if you can clearly see a date on packaging and the item is NOT a cooked meal
- Be conservative with expiration dates - only include if clearly visible and readable
- You have been provided multiple photos of the same item from different angles - use all available images to make the most accurate determination possible
- Write the item name in ${replyLanguage}`;
    // Prepare the request payload with all images
    const contents = [
      {
        parts: [
          {
            text: prompt
          },
          // Add all images to the request
          ...imageArray.map((img)=>{
            const imageData = img.replace(/^data:image\/[a-z]+;base64,/, '');
            return {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData
              }
            };
          })
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
        error: 'Failed to analyze photo. Please check your API token.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    const geminiData = await geminiResponse.json();
    console.log('Gemini photo analysis response received successfully');
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
        suggested_name: "Food Item",
        item_type: "raw_material",
        expiration_date: null,
        confidence: "low"
      };
    }
    return new Response(JSON.stringify(analysisResult), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in analyze-photo function:', error);
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
