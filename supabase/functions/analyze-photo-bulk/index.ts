import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type AIProvider = 'openai' | 'anthropic' | 'gemini';

interface AIRequest {
  prompt: string;
  imageData?: string;
  audioData?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

interface AIResponse {
  content: string;
  model?: string;
  provider: AIProvider;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

interface ProviderCredentials {
  apiKey: string;
  [key: string]: string;
}

// Base AI Provider class
abstract class BaseAIProvider {
  protected credentials: ProviderCredentials;
  abstract readonly provider: AIProvider;
  abstract readonly supportedFeatures: {
    textGeneration: boolean;
    imageAnalysis: boolean;
    audioTranscription: boolean;
  };

  constructor(credentials: ProviderCredentials) {
    this.credentials = credentials;
  }

  abstract analyzeImage(request: AIRequest): Promise<AIResponse>;

  protected validateCredentials(): void {
    if (!this.credentials.apiKey) {
      throw new Error(`API key is required for ${this.provider}`);
    }
  }

  protected createResponse(content: string, model?: string): AIResponse {
    return {
      content,
      model,
      provider: this.provider,
    };
  }

  protected handleError(error: any, operation: string): never {
    console.error(`${this.provider} ${operation} error:`, error);
    
    if (error.status === 401 || error.status === 403) {
      throw new Error(`Invalid API credentials for ${this.provider}. Please check your API key.`);
    }
    
    if (error.status === 429) {
      throw new Error(`Rate limit exceeded for ${this.provider}. Please try again later.`);
    }
    
    if (error.status >= 500) {
      throw new Error(`${this.provider} service is currently unavailable. Please try again later.`);
    }
    
    throw new Error(`${this.provider} ${operation} failed: ${error.message || 'Unknown error'}`);
  }
}

// Gemini Provider implementation
class GeminiProvider extends BaseAIProvider {
  readonly provider = 'gemini' as const;
  readonly supportedFeatures = {
    textGeneration: true,
    imageAnalysis: true,
    audioTranscription: true,
  };

  private getApiUrl(model: string = 'gemini-2.0-flash'): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.credentials.apiKey}`;
  }

  async analyzeImage(request: AIRequest): Promise<AIResponse> {
    this.validateCredentials();

    if (!request.imageData) {
      throw new Error('Image data is required for image analysis');
    }

    try {
      // Extract base64 data and mime type from data URL
      const [header, base64Data] = request.imageData.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';

      const response = await fetch(this.getApiUrl(request.model), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: request.prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: request.temperature || 0.4,
            maxOutputTokens: request.maxTokens || 8192,
          }
        }),
      });

      if (!response.ok) {
        throw { status: response.status, message: await response.text() };
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No content generated from image analysis');
      }

      return this.createResponse(content, request.model || 'gemini-2.0-flash');
    } catch (error) {
      this.handleError(error, 'image analysis');
    }
  }
}

// OpenAI Provider implementation
class OpenAIProvider extends BaseAIProvider {
  readonly provider = 'openai' as const;
  readonly supportedFeatures = {
    textGeneration: true,
    imageAnalysis: true,
    audioTranscription: true,
  };

  private readonly baseUrl = 'https://api.openai.com/v1';

  async analyzeImage(request: AIRequest): Promise<AIResponse> {
    this.validateCredentials();

    if (!request.imageData) {
      throw new Error('Image data is required for image analysis');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.credentials.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model || 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: request.prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: request.imageData
                  }
                }
              ]
            }
          ],
          temperature: request.temperature || 0.4,
          max_tokens: request.maxTokens || 4096,
        }),
      });

      if (!response.ok) {
        throw { status: response.status, message: await response.text() };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content generated from image analysis');
      }

      return {
        content,
        model: data.model,
        provider: this.provider,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
        }
      };
    } catch (error) {
      this.handleError(error, 'image analysis');
    }
  }
}

// Anthropic Provider implementation
class AnthropicProvider extends BaseAIProvider {
  readonly provider = 'anthropic' as const;
  readonly supportedFeatures = {
    textGeneration: true,
    imageAnalysis: true,
    audioTranscription: false,
  };

  private readonly baseUrl = 'https://api.anthropic.com/v1';

  async analyzeImage(request: AIRequest): Promise<AIResponse> {
    this.validateCredentials();

    if (!request.imageData) {
      throw new Error('Image data is required for image analysis');
    }

    try {
      // Extract base64 data and mime type from data URL
      const [header, base64Data] = request.imageData.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.credentials.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: request.model || 'claude-3-5-haiku-20241022',
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature || 0.4,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: request.prompt
                },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ]
        }),
      });

      if (!response.ok) {
        throw { status: response.status, message: await response.text() };
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (!content) {
        throw new Error('No content generated from image analysis');
      }

      return {
        content,
        model: data.model,
        provider: this.provider,
        usage: {
          inputTokens: data.usage?.input_tokens,
          outputTokens: data.usage?.output_tokens,
        }
      };
    } catch (error) {
      this.handleError(error, 'image analysis');
    }
  }
}

// AI Provider Factory
class AIProviderFactory {
  static createProvider(provider: AIProvider, credentials: ProviderCredentials): BaseAIProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(credentials);
      case 'anthropic':
        return new AnthropicProvider(credentials);
      case 'gemini':
        return new GeminiProvider(credentials);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
}

// AI Service class
class AIService {
  // Use 'any' for supabase client as a fallback
  constructor(private supabase: any) {}

  private async getCurrentProvider(): Promise<AIProvider> {
    const { data } = await this.supabase.rpc('get_decrypted_api_token', {
      p_token_name: 'selected_ai_provider'
    });
    return (data || 'gemini') as AIProvider;
  }

  private async getProviderCredentials(provider: AIProvider): Promise<ProviderCredentials | null> {
    const { data, error } = await this.supabase.rpc('get_decrypted_api_token', {
      p_token_name: provider
    });
    if (error) throw error;
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return { apiKey: data };
    }
  }

  async analyzeImagesBulk(imageArray: string[], replyLanguage: string): Promise<{ items: any[]; confidence: string }> {
    const provider = await this.getCurrentProvider();
    const credentials = await this.getProviderCredentials(provider);

    if (!credentials) {
      throw new Error(`No credentials found for ${provider}. Please configure your API token in settings.`);
    }

    const providerInstance = AIProviderFactory.createProvider(provider, credentials);

    if (!providerInstance.supportedFeatures.imageAnalysis) {
      throw new Error(`${provider} does not support image analysis. Please select a different provider.`);
    }

    const year = new Date().getFullYear();
    const prompt = `Analyze this photo of a food item and provide the following information:

1. Identify what food item this is and suggest a concise, descriptive name
2. Determine if this is a cooked meal or a raw ingredient/material
3. If it's NOT a cooked meal (i.e., it's a packaged food or raw ingredient), look for any visible expiration dates, best-by dates, or use-by dates on packaging or labels
4. Estimate the quantity (amount and unit) based on visual cues like container size, portion size, or packaging

Please respond in this EXACT JSON format:
{
  "name": "Brief descriptive name of the food item",
  "item_type": "cooked_meal" OR "raw_material",
  "quantity": number (e.g., 1, 2, 0.5),
  "unit": "one of: pcs, pieces, item, items, small container, medium container, large container, small bowl, medium bowl, large bowl, small pot, medium pot, large pot, dozen, pack, packs, packet, packets, serving, servings, portion, portions, cup, cups, tbsp, tsp, ml, l, liter, liters, g, gr, gram, grams, kg, kilogram, kilograms, oz, ounce, ounces, lb, lbs, pound, pounds, slice, slices, half, quarter, third, bag, bags, box, boxes, bottle, bottles, can, cans, jar, jars, tube, tubes",
  "estimated_freshness_days": number (estimated days until expiration - typical values: 1-2 for very perishable items like fish, 3-5 for vegetables, 7-14 for fruits, 30+ for canned goods)
}

Important notes:
- For item_type, use "cooked_meal" for prepared/cooked foods, "raw_material" for ingredients/packaged foods
- Some products may only contain a day and month expiration date in the format DD-MM or DD/MM. In such cases, assume the year is 
- For estimated_freshness_days, use typical shelf life for each item type:
  - Fresh meat/fish: 1-3 days
  - Dairy: 3-7 days  
  - Fresh vegetables: 3-7 days
  - Fresh fruits: 3-14 days
  - Bread: 3-5 days
  - Canned goods: 30+ days
  - Dry goods: 30+ days
- Write all item names in ${replyLanguage}
- If you cannot clearly identify the food item, still try to provide a reasonable estimate and indicate lower confidence`;

    const allItems: any[] = [];
    let totalConfidence = 'high';

    for (let i = 0; i < imageArray.length; i++) {
      try {
        const request: AIRequest = {
          prompt,
          imageData: imageArray[i],
          temperature: 0.4,
          maxTokens: 4096,
        };

        const response = await providerInstance.analyzeImage(request);
        let analysisResult;
        try {
          const jsonStart = response.content.indexOf('{');
          const jsonEnd = response.content.lastIndexOf('}') + 1;
          const jsonText = response.content.slice(jsonStart, jsonEnd);
          analysisResult = JSON.parse(jsonText);
        } catch (parseError: unknown) {
          console.error('Failed to parse JSON for image', i, ':', parseError);
          continue;
        }
        if (analysisResult.name && analysisResult.item_type) {
          allItems.push({
            name: analysisResult.name,
            item_type: analysisResult.item_type,
            quantity: analysisResult.quantity || 1,
            unit: analysisResult.unit || (analysisResult.item_type === 'cooked_meal' ? 'serving' : 'item'),
            estimated_freshness_days: analysisResult.estimated_freshness_days || 4,
          });
        }
        if (analysisResult.confidence === 'low') {
          totalConfidence = 'medium';
        }
      } catch (error: unknown) {
        console.error(`Error analyzing image ${i}:`, error);
      }
    }
    if (allItems.length === 0) {
      allItems.push({
        name: 'Food Item',
        item_type: 'raw_material',
        quantity: 1,
        unit: 'item',
        estimated_freshness_days: 4,
      });
      totalConfidence = 'low';
    }
    return {
      items: allItems,
      confidence: totalConfidence,
    };
  }

  async analyzeGroupsBulk(groups: string[][], replyLanguage: string): Promise<{ items: any[]; confidence: string }> {
    const provider = await this.getCurrentProvider();
    const credentials = await this.getProviderCredentials(provider);

    if (!credentials) {
      throw new Error(`No credentials found for ${provider}. Please configure your API token in settings.`);
    }

    const providerInstance = AIProviderFactory.createProvider(provider, credentials);

    if (!providerInstance.supportedFeatures.imageAnalysis) {
      throw new Error(`${provider} does not support image analysis. Please select a different provider.`);
    }

    const year = new Date().getFullYear();
    const allItems: any[] = [];
    let totalConfidence = 'high';

    for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
      const imageArray = groups[groupIdx];
      if (!imageArray || imageArray.length === 0) continue;
      try {
        const prompt = `Analyze these ${imageArray.length} photos of the same food item from different angles and provide the following information:

1. Identify what food item this is and suggest a concise, descriptive name
2. Determine if this is a cooked meal or a raw ingredient/material
3. If it's NOT a cooked meal (i.e., it's a packaged food or raw ingredient), look for any visible expiration dates, best-by dates, or use-by dates on packaging or labels
4. Estimate the quantity (amount and unit) based on visual cues like container size, portion size, or packaging

Please respond in this EXACT JSON format:
{
  "suggested_name": "Brief descriptive name of the food item",
  "item_type": "cooked_meal" OR "raw_material",
  "expiration_date": "YYYY-MM-DD format if found and applicable, otherwise null",
  "estimated_amount": number (e.g., 1, 2, 0.5),
  "estimated_unit": "one of: pcs, pieces, item, items, small container, medium container, large container, small bowl, medium bowl, large bowl, small pot, medium pot, large pot, dozen, pack, packs, packet, packets, serving, servings, portion, portions, cup, cups, tbsp, tsp, ml, l, liter, liters, g, gr, gram, grams, kg, kilogram, kilograms, oz, ounce, ounces, lb, lbs, pound, pounds, slice, slices, half, quarter, third, bag, bags, box, boxes, bottle, bottles, can, cans, jar, jars, tube, tubes",
  "confidence": "high/medium/low based on image clarity and visibility of details"
}

Important notes:
- For item_type, use "cooked_meal" for prepared/cooked foods, "raw_material" for ingredients/packaged foods
- Some products may only contain a day and month expiration date in the format DD-MM or DD/MM. In such cases, assume the year is ${year}.
- Only include expiration_date if you can clearly see a date on packaging and the item is NOT a cooked meal
- Be conservative with expiration dates - only include if clearly visible and readable
- For estimated_amount, use your best judgment based on visual cues (e.g., if it looks like a single serving, use 1 with "serving"; if it's a small container, use 1 with "small container")
- Choose the most appropriate unit from the provided list - default to "serving" for cooked meals and "item" or "pcs" for individual items
- You have been provided multiple photos of the same item from different angles - use all available images to make the most accurate determination possible
- Write the item name in ${replyLanguage}`;
        const request: AIRequest = {
          prompt,
          imageData: imageArray[0],
          temperature: 0.4,
          maxTokens: 4096,
        };
        const response = await providerInstance.analyzeImage(request);
        let analysisResult;
        try {
          const jsonStart = response.content.indexOf('{');
          const jsonEnd = response.content.lastIndexOf('}') + 1;
          const jsonText = response.content.slice(jsonStart, jsonEnd);
          analysisResult = JSON.parse(jsonText);
        } catch (parseError: unknown) {
          console.error('Failed to parse JSON for group', groupIdx, ':', parseError);
          continue;
        }
        if (analysisResult.suggested_name && analysisResult.item_type) {
          allItems.push({
            suggested_name: analysisResult.suggested_name,
            item_type: analysisResult.item_type,
            expiration_date: analysisResult.expiration_date || null,
            estimated_amount: analysisResult.estimated_amount || 1,
            estimated_unit: analysisResult.estimated_unit || (analysisResult.item_type === 'cooked_meal' ? 'serving' : 'item'),
            confidence: analysisResult.confidence || 'medium',
          });
        }
        if (analysisResult.confidence === 'low') {
          totalConfidence = 'medium';
        }
      } catch (error: unknown) {
        console.error(`Error analyzing group ${groupIdx}:`, error);
      }
    }
    if (allItems.length === 0) {
      allItems.push({
        suggested_name: 'Food Item',
        item_type: 'raw_material',
        expiration_date: null,
        estimated_amount: 1,
        estimated_unit: 'item',
        confidence: 'low',
      });
      totalConfidence = 'low';
    }
    return {
      items: allItems,
      confidence: totalConfidence,
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { groups, userId } = await req.json();

    if (!userId || !groups || !Array.isArray(groups) || groups.length === 0) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: userId and at least one group'
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

    // Get the user's preferred language
    const { data: languageData } = await supabase.rpc('get_decrypted_api_token', {
      p_token_name: 'ai_language'
    });
    const replyLanguage = languageData || 'English';

    // Create AI service instance
    const aiService = new AIService(supabase);

    // Analyze groups using the selected provider
    const result = await aiService.analyzeGroupsBulk(groups, replyLanguage);

    // Add metadata about the analysis
    const response = {
      ...result,
      metadata: {
        provider: 'bulk_analysis',
        model: 'multiple',
        usage: undefined,
      }
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in analyze-photo-bulk function:', error);
    return new Response(JSON.stringify({
      error: 'An unexpected error occurred',
      details: error.message,
      provider: 'unknown'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
}); 