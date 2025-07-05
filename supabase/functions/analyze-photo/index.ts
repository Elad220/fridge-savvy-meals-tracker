import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// AI Provider types and interfaces
type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'aws-bedrock' | 'azure-openai';

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

// Provider Factory
class AIProviderFactory {
  static createProvider(provider: AIProvider, credentials: ProviderCredentials): BaseAIProvider {
    switch (provider) {
      case 'gemini':
        return new GeminiProvider(credentials);
      case 'openai':
        return new OpenAIProvider(credentials);
      case 'anthropic':
        return new AnthropicProvider(credentials);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  static getSupportedProviders(): AIProvider[] {
    return ['gemini', 'openai', 'anthropic'];
  }
}

// AI Service class
class AIService {
  constructor(private supabase: any) {}

  private async getCurrentProvider(): Promise<AIProvider> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_decrypted_api_token', { p_token_name: 'selected_ai_provider' });

      if (error) throw error;
      return (data as AIProvider) || 'gemini';
    } catch (error) {
      console.error('Error getting selected provider, defaulting to gemini:', error);
      return 'gemini';
    }
  }

  private async getProviderCredentials(provider: AIProvider): Promise<ProviderCredentials | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_decrypted_api_token', { p_token_name: provider });

      if (error) throw error;
      
      if (!data) return null;

      // Try to parse as JSON for providers with additional fields
      try {
        return JSON.parse(data);
      } catch {
        // If not JSON, return as simple string (for backwards compatibility)
        return { apiKey: data };
      }
    } catch (error) {
      console.error('Error getting provider credentials:', error);
      return null;
    }
  }

  async analyzeImages(imageArray: string[], replyLanguage: string): Promise<any> {
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
    
    // Create the prompt for image analysis with dynamic language
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

    // For providers that handle multiple images differently
    if (provider === 'gemini') {
      // Gemini can handle multiple images in a single request
      const contents = [
        {
          parts: [
            { text: prompt },
            ...imageArray.map((img) => {
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

      const request: AIRequest = {
        prompt,
        imageData: imageArray[0], // Use first image as primary
        temperature: 0.4,
        maxTokens: 4096,
      };

      // Override for Gemini to use its special multi-image format
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${credentials.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      });

      if (!response.ok) {
        throw { status: response.status, message: await response.text() };
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No content generated from image analysis');
      }

      console.log(`Image analyzed using ${provider} (gemini-2.0-flash)`);
      
      return {
        content,
        provider,
        model: 'gemini-2.0-flash',
        usage: undefined,
      };
    } else {
      // For other providers, analyze the first image (most providers support single image)
      const request: AIRequest = {
        prompt,
        imageData: imageArray[0],
        temperature: 0.4,
        maxTokens: 4096,
      };

      const response = await providerInstance.analyzeImage(request);
      
      console.log(`Image analyzed using ${provider} (${response.model})`);
      
      return {
        content: response.content,
        provider: response.provider,
        model: response.model,
        usage: response.usage,
      };
    }
  }
}

const year = new Date().getFullYear();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { images, image, userId } = await req.json();
    // Backward compatibility: handle both single image and multiple images
    const imageArray = images || (image ? [image] : []);

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

    // Get the user's preferred language
    const { data: languageData } = await supabase.rpc('get_decrypted_api_token', {
      p_token_name: 'ai_language'
    });
    const replyLanguage = languageData || 'English';

    // Create AI service instance
    const aiService = new AIService(supabase);

    // Analyze images using the selected provider
    const result = await aiService.analyzeImages(imageArray, replyLanguage);

    // Try to parse the JSON response
    let analysisResult;
    try {
      // Clean the response text to extract JSON
      const jsonStart = result.content.indexOf('{');
      const jsonEnd = result.content.lastIndexOf('}') + 1;
      const jsonText = result.content.slice(jsonStart, jsonEnd);
      analysisResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      // Fallback: return structured data with basic info
      analysisResult = {
        suggested_name: "Food Item",
        item_type: "raw_material",
        expiration_date: null,
        estimated_amount: 1,
        estimated_unit: "item",
        confidence: "low"
      };
    }

    // Ensure the response has the required fields
    if (!analysisResult.estimated_amount) {
      analysisResult.estimated_amount = 1;
    }
    if (!analysisResult.estimated_unit) {
      analysisResult.estimated_unit = analysisResult.item_type === 'cooked_meal' ? 'serving' : 'item';
    }

    // Add metadata about the analysis
    const response = {
      ...analysisResult,
      metadata: {
        provider: result.provider,
        model: result.model,
        usage: result.usage,
      }
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in analyze-photo function:', error);
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
