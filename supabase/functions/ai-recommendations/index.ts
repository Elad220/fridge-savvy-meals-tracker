import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type AIProvider = 'openai' | 'anthropic' | 'gemini';

interface AIRequest {
  prompt: string;
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
            parts: [
              { text: request.prompt }
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
        throw new Error('No content generated from text generation');
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
        throw new Error('No content generated from text generation');
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
          temperature: request.temperature || 0.4,
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
        throw new Error('No content generated from text generation');
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

// AI Recommendations Service
class AIRecommendationsService {
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

  private async getUserData(userId: string) {
    try {
      // Get all relevant user data from database
      const [
        { data: foodItems, error: foodError },
        { data: actionHistory, error: actionError },
        { data: consumptionPatterns, error: consumptionError },
        { data: mealCombinations, error: mealError },
        { data: userPreferences, error: preferenceError },
        { data: mealPlans, error: planError }
      ] = await Promise.all([
        this.supabase
          .from('food_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        this.supabase
          .from('action_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100),
        this.supabase
          .from('consumption_patterns')
          .select('*')
          .eq('user_id', userId),
        this.supabase
          .from('meal_combinations')
          .select('*')
          .eq('user_id', userId)
          .order('frequency', { ascending: false }),
        this.supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single(),
        this.supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', userId)
          .order('planned_date', { ascending: false })
          .limit(50)
      ]);

      // Log any errors but don't fail completely
      if (foodError) console.error('Error fetching food items:', foodError);
      if (actionError) console.error('Error fetching action history:', actionError);
      if (consumptionError) console.error('Error fetching consumption patterns:', consumptionError);
      if (mealError) console.error('Error fetching meal combinations:', mealError);
      if (preferenceError) console.error('Error fetching user preferences:', preferenceError);
      if (planError) console.error('Error fetching meal plans:', planError);

      return {
        foodItems: foodItems || [],
        actionHistory: actionHistory || [],
        consumptionPatterns: consumptionPatterns || [],
        mealCombinations: mealCombinations || [],
        userPreferences: userPreferences || {},
        mealPlans: mealPlans || []
      };
    } catch (error) {
      console.error('Error in getUserData:', error);
      // Return empty data if there's an error
      return {
        foodItems: [],
        actionHistory: [],
        consumptionPatterns: [],
        mealCombinations: [],
        userPreferences: {},
        mealPlans: []
      };
    }
  }

  async generateRecommendations(userId: string): Promise<any> {
    const provider = await this.getCurrentProvider();
    const credentials = await this.getProviderCredentials(provider);

    if (!credentials) {
      throw new Error(`No credentials found for ${provider}. Please configure your API token in settings.`);
    }

    const providerInstance = AIProviderFactory.createProvider(provider, credentials);
    const userData = await this.getUserData(userId);

    // Get user's preferred language
    const { data: languageData } = await this.supabase.rpc('get_decrypted_api_token', {
      p_token_name: 'ai_language'
    });
    const replyLanguage = languageData || 'English';

    // Generate comprehensive analysis prompt
    const analysisPrompt = this.buildAnalysisPrompt(userData, replyLanguage);

    try {
      const response = await providerInstance.generateText({
        prompt: analysisPrompt,
        temperature: 0.3,
        maxTokens: 4096,
      });

      let analysisResult;
      try {
        const jsonStart = response.content.indexOf('{');
        const jsonEnd = response.content.lastIndexOf('}') + 1;
        const jsonText = response.content.slice(jsonStart, jsonEnd);
        analysisResult = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('Failed to parse AI recommendations');
      }

      return {
        ...analysisResult,
        metadata: {
          provider,
          model: response.model,
          usage: response.usage,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(userData: any, language: string): string {
    const { foodItems, actionHistory, consumptionPatterns, mealCombinations, userPreferences, mealPlans } = userData;

    // Filter for raw ingredients only (not cooked meals)
    const rawIngredients = foodItems.filter((item: any) => 
      item.item_type === 'raw_material' || !item.item_type
    );

    // Calculate current inventory summary
    const currentInventory = rawIngredients.reduce((acc: any, item: any) => {
      const key = item.name.toLowerCase();
      if (!acc[key]) {
        acc[key] = {
          name: item.name,
          totalAmount: 0,
          unit: item.unit,
          items: []
        };
      }
      acc[key].totalAmount += parseFloat(item.amount) || 0;
      acc[key].items.push(item);
      return acc;
    }, {});

    // Calculate consumption patterns
    const consumptionSummary = consumptionPatterns.reduce((acc: any, pattern: any) => {
      acc[pattern.item_name.toLowerCase()] = {
        averageRate: pattern.average_consumption_rate,
        timesPurchased: pattern.times_purchased,
        typicalQuantity: pattern.typical_quantity,
        typicalUnit: pattern.typical_unit,
        lastPurchase: pattern.last_purchase_date
      };
      return acc;
    }, {});

    // Calculate recent activity patterns
    const recentActivity = actionHistory.slice(0, 20).map((action: any) => ({
      type: action.action_type,
      item: action.item_name,
      date: action.created_at,
      details: action.item_details
    }));

    // Build meal insights
    const mealInsights = mealCombinations.map((meal: any) => ({
      name: meal.meal_name,
      ingredients: meal.ingredients,
      frequency: meal.frequency,
      lastPrepared: meal.last_prepared
    }));

    return `Analyze the following user data and provide intelligent recommendations for food management and shopping. Respond in ${language}.

User Data:
- Current Inventory (Raw Ingredients Only): ${JSON.stringify(Object.values(currentInventory))}
- Consumption Patterns: ${JSON.stringify(consumptionSummary)}
- Recent Activity: ${JSON.stringify(recentActivity)}
- Meal Combinations: ${JSON.stringify(mealInsights)}
- User Preferences: ${JSON.stringify(userPreferences)}
- Meal Plans: ${JSON.stringify(mealPlans)}

Please provide a comprehensive analysis in this EXACT JSON format:
{
  "shopping_recommendations": [
    {
      "name": "item name",
      "quantity": number,
      "unit": "unit",
      "reason": "detailed reasoning",
      "priority": "high/medium/low",
      "confidence": "high/medium/low"
    }
  ],
  "low_stock_alerts": [
    {
      "item_name": "item name",
      "current_amount": number,
      "unit": "unit",
      "days_until_out": number,
      "recommended_amount": number,
      "urgency": "high/medium/low"
    }
  ],
  "meal_suggestions": [
    {
      "name": "meal name",
      "ingredients": ["ingredient1", "ingredient2"],
      "prep_time": "estimated time",
      "difficulty": "easy/medium/hard",
      "reason": "why this meal is suggested"
    }
  ],
  "insights": {
    "consumption_trends": "analysis of consumption patterns",
    "inventory_health": "overall inventory status",
    "shopping_patterns": "analysis of shopping behavior",
    "meal_preferences": "identified meal preferences",
    "suggestions": "general improvement suggestions"
  },
  "next_actions": [
    {
      "action": "action description",
      "priority": "high/medium/low",
      "reason": "why this action is recommended"
    }
  ]
}

Guidelines:
1. Focus on items that are frequently consumed but low in stock
2. Consider seasonal patterns and meal planning
3. Suggest meals based on available ingredients
4. Provide actionable insights for better food management
5. Consider user preferences and dietary restrictions
6. Analyze consumption patterns to predict future needs
7. Suggest items that complement current inventory
8. Consider expiration dates and freshness
9. Provide specific quantities based on typical usage patterns
10. Include confidence levels for recommendations
11. IMPORTANT: Only generate low stock alerts for raw ingredients (not cooked meals). The current inventory data only includes raw ingredients.`;
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
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Missing required field: userId'
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

    // Create AI recommendations service
    const aiService = new AIRecommendationsService(supabase);

    try {
      // Generate AI-powered recommendations
      const result = await aiService.generateRecommendations(userId);

      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      
      // Return a fallback response instead of failing completely
      const fallbackResult = {
        shopping_recommendations: [],
        low_stock_alerts: [],
        meal_suggestions: [],
        insights: {
          consumptionTrends: "Unable to analyze consumption patterns at this time.",
          inventoryHealth: "Please check your inventory manually.",
          shoppingPatterns: "No shopping pattern data available.",
          mealPreferences: "No meal preference data available.",
          suggestions: "Try adding some food items to get personalized recommendations."
        },
        next_actions: [
          {
            action: "Add some food items to your inventory",
            priority: "medium",
            reason: "This will help the AI provide better recommendations"
          }
        ],
        metadata: {
          provider: 'fallback',
          model: 'none',
          usage: undefined,
          error: error.message
        }
      };

      return new Response(JSON.stringify(fallbackResult), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error in ai-recommendations function:', error);
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