import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  abstract generateText(request: AIRequest): Promise<AIResponse>;

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

  async generateText(request: AIRequest): Promise<AIResponse> {
    this.validateCredentials();

    try {
      const response = await fetch(this.getApiUrl(request.model), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: request.prompt }]
          }],
          generationConfig: {
            temperature: request.temperature || 0.7,
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
        throw new Error('No content generated');
      }

      return this.createResponse(content, request.model || 'gemini-2.0-flash');
    } catch (error) {
      this.handleError(error, 'text generation');
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

  async generateText(request: AIRequest): Promise<AIResponse> {
    this.validateCredentials();

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
              content: request.prompt
            }
          ],
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4096,
        }),
      });

      if (!response.ok) {
        throw { status: response.status, message: await response.text() };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content generated');
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
      this.handleError(error, 'text generation');
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

  async generateText(request: AIRequest): Promise<AIResponse> {
    this.validateCredentials();

    try {
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
          temperature: request.temperature || 0.7,
          messages: [
            {
              role: 'user',
              content: request.prompt
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
        throw new Error('No content generated');
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
      this.handleError(error, 'text generation');
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

  async getRecipeDetails(recipeName: string, ingredients: string[], replyLanguage: string): Promise<any> {
    const provider = await this.getCurrentProvider();
    const credentials = await this.getProviderCredentials(provider);

    if (!credentials) {
      throw new Error(`No credentials found for ${provider}. Please configure your API token in settings.`);
    }

    const providerInstance = AIProviderFactory.createProvider(provider, credentials);

    // Create the detailed prompt for recipe generation with dynamic language
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
    }

    Please write all text content (recipe name, ingredients, instructions, and tips) in ${replyLanguage}.`;

    const request: AIRequest = {
      prompt,
      temperature: 0.7,
      maxTokens: 4096,
    };

    const response = await providerInstance.generateText(request);
    
    console.log(`Recipe details generated using ${provider} (${response.model})`);
    
    return {
      content: response.content,
      provider: response.provider,
      model: response.model,
      usage: response.usage,
    };
  }
}

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

    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Initialize Supabase client with the user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            authorization: authHeader,
          },
        },
      }
    );

    // Get the user's preferred language
    const { data: languageData } = await supabase.rpc('get_decrypted_api_token', {
      p_token_name: 'ai_language'
    });
    const replyLanguage = languageData || 'English';

    // Create AI service instance
    const aiService = new AIService(supabase);

    // Get recipe details using the selected provider
    const result = await aiService.getRecipeDetails(recipeName, ingredients, replyLanguage);

    // Try to parse the JSON response
    let recipeDetails;
    try {
      // Clean the response text to extract JSON
      const jsonStart = result.content.indexOf('{');
      const jsonEnd = result.content.lastIndexOf('}') + 1;
      const jsonText = result.content.slice(jsonStart, jsonEnd);
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
        instructions: [result.content],
        tips: ["Check the generated instructions above for complete details."]
      };
    }

    // Add metadata about the generation
    const response = {
      ...recipeDetails,
      metadata: {
        provider: result.provider,
        model: result.model,
        usage: result.usage,
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-recipe-details function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error.message,
        provider: 'unknown'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
