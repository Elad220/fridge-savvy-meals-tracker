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

  abstract transcribeAudio?(request: AIRequest): Promise<AIResponse>;

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
    console.error(`Error in ${this.provider} ${operation}:`, error);
    if (error.status) {
      throw { status: error.status, message: error.message || `Failed to ${operation}` };
    }
    throw new Error(`Failed to ${operation}: ${error.message || error}`);
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

  async transcribeAudio(request: AIRequest): Promise<AIResponse> {
    this.validateCredentials();

    if (!request.audioData) {
      throw new Error('Audio data is required for transcription');
    }

    try {
      // Handle both data URL format and raw base64 format
      let base64Data: string;
      let mimeType: string;

      if (request.audioData.includes(',')) {
        // Data URL format: data:audio/wav;base64,<data>
        const [header, data] = request.audioData.split(',');
        base64Data = data;
        mimeType = header.match(/data:([^;]+)/)?.[1] || 'audio/webm';
      } else {
        // Raw base64 format (what frontend sends)
        base64Data = request.audioData;
        mimeType = 'audio/webm';
      }

      // Validate base64 data
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Invalid audio data: empty or malformed');
      }

      // For Gemini, we need to use a model that supports audio
      // Try different models that support audio transcription
      const models = ['gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let lastError: any = null;

      for (const model of models) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': this.credentials.apiKey,
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    text: request.prompt
                  },
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
                maxOutputTokens: request.maxTokens || 4096,
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw { status: response.status, message: errorText };
          }

          const data = await response.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!content) {
            throw new Error('No content generated from audio');
          }

          return this.createResponse(content, model);
        } catch (error) {
          lastError = error;
          console.warn(`Failed with model ${model}:`, error);
          continue;
        }
      }

      // If all models failed, throw the last error
      throw lastError || new Error('All audio transcription models failed');
    } catch (error) {
      this.handleError(error, 'audio transcription');
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

  async transcribeAudio(request: AIRequest): Promise<AIResponse> {
    this.validateCredentials();

    if (!request.audioData) {
      throw new Error('Audio data is required for transcription');
    }

    try {
      // For OpenAI, we need to use Whisper for transcription first, then GPT for analysis
      // Convert data URL to blob
      const [header, base64Data] = request.audioData.split(',');
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Create FormData for Whisper API
      const formData = new FormData();
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      formData.append('file', blob, 'audio.wav');
      formData.append('model', 'whisper-1');

      // First, transcribe the audio using Whisper
      const whisperResponse = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
        throw { status: whisperResponse.status, message: await whisperResponse.text() };
      }

      const whisperData = await whisperResponse.json();
      const transcription = whisperData.text;

      if (!transcription) {
        throw new Error('No transcription generated');
      }

      // Then, analyze the transcription using GPT
      const analysisPrompt = `${request.prompt}

Here is the transcribed text from the audio recording:
"${transcription}"

Please analyze this transcription and provide the requested response format.`;

      const gptResponse = await fetch(`${this.baseUrl}/chat/completions`, {
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
              content: analysisPrompt
            }
          ],
          temperature: request.temperature || 0.4,
          max_tokens: request.maxTokens || 4096,
        }),
      });

      if (!gptResponse.ok) {
        throw { status: gptResponse.status, message: await gptResponse.text() };
      }

      const gptData = await gptResponse.json();
      const content = gptData.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No analysis generated from audio transcription');
      }

      return {
        content,
        model: gptData.model,
        provider: this.provider,
        usage: {
          inputTokens: gptData.usage?.prompt_tokens,
          outputTokens: gptData.usage?.completion_tokens,
        }
      };
    } catch (error) {
      this.handleError(error, 'audio transcription');
    }
  }
}

// Anthropic Provider implementation
class AnthropicProvider extends BaseAIProvider {
  readonly provider = 'anthropic' as const;
  readonly supportedFeatures = {
    textGeneration: true,
    imageAnalysis: true,
    audioTranscription: false, // Anthropic doesn't support audio transcription yet
  };

  async transcribeAudio(request: AIRequest): Promise<AIResponse> {
    throw new Error('Anthropic does not support audio transcription');
  }
}

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
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  static getSupportedProviders(): AIProvider[] {
    return ['gemini', 'openai', 'anthropic'];
  }
}

class AIService {
  constructor(private supabase: any) {}

  private async getCurrentProvider(): Promise<AIProvider> {
    const { data: selectedProvider } = await this.supabase.rpc('get_decrypted_api_token', {
      p_token_name: 'selected_ai_provider'
    });
    
    if (selectedProvider && ['gemini', 'openai', 'anthropic'].includes(selectedProvider)) {
      return selectedProvider as AIProvider;
    }
    
    // Default to gemini if no provider is selected
    return 'gemini';
  }

  private async getProviderCredentials(provider: AIProvider): Promise<ProviderCredentials | null> {
    const { data: apiKey } = await this.supabase.rpc('get_decrypted_api_token', {
      p_token_name: provider
    });

    if (!apiKey) {
      return null;
    }

    return { apiKey };
  }

  private async findAudioCapableProvider(): Promise<AIProvider> {
    const providers = AIProviderFactory.getSupportedProviders();
    
    for (const provider of providers) {
      const credentials = await this.getProviderCredentials(provider);
      if (credentials) {
        const providerInstance = AIProviderFactory.createProvider(provider, credentials);
        if (providerInstance.supportedFeatures.audioTranscription) {
          return provider;
        }
      }
    }
    
    throw new Error('No audio-capable provider found. Please configure Gemini or OpenAI.');
  }

  async analyzeMealPlanVoiceRecording(audioData: string, replyLanguage: string): Promise<any> {
    const provider = await this.findAudioCapableProvider();
    const credentials = await this.getProviderCredentials(provider);

    if (!credentials) {
      throw new Error(`No credentials found for ${provider}. Please configure your API token in settings.`);
    }

    const providerInstance = AIProviderFactory.createProvider(provider, credentials);

    if (!providerInstance.supportedFeatures.audioTranscription) {
      throw new Error(`${provider} does not support audio transcription. Please select Gemini or OpenAI for audio features.`);
    }

    // Create the prompt for meal plan voice analysis
    const prompt = `Analyze this audio recording where the user is describing a meal they want to prepare or plan. 

The user is speaking about a meal they want to cook, prepare, or plan for. Extract the meal details and preparation instructions.

Please respond in this EXACT JSON format:
{
  "meal": {
    "name": "Descriptive name of the meal",
    "plannedDate": "YYYY-MM-DD" OR null (if no specific date mentioned),
    "destinationTime": "HH:MM" OR null (if no specific time mentioned),
    "notes": "Any additional notes about the meal, ingredients, or preparation method"
  },
  "ingredients": [
    {
      "name": "Ingredient name",
      "quantity": number,
      "unit": "one of: item, items, piece, pieces, serving, servings, cup, cups, tbsp, tsp, ml, l, liter, liters, g, gr, gram, grams, kg, kilogram, kilograms, oz, ounce, ounces, lb, lbs, pound, pounds, slice, slices, dozen, pack, packs, packet, packets, bag, bags, box, boxes, bottle, bottles, can, cans, jar, jars, tube, tubes",
      "notes": "Any specific notes about this ingredient"
    }
  ],
  "preparationSteps": [
    "Step 1 description",
    "Step 2 description",
    "Step 3 description"
  ],
  "confidence": "high/medium/low based on audio clarity and how clearly the meal was described"
}

Important notes:
- Extract the meal name, planned date (if mentioned), and destination time (if mentioned)
- Include any preparation notes or special instructions mentioned
- List all ingredients mentioned with their quantities and units
- Provide step-by-step preparation instructions if mentioned
- For dates, use YYYY-MM-DD format (use today's date if no specific date mentioned)
- For times, use HH:MM format in 24-hour time
- If no specific date/time is mentioned, use null for those fields
- Write all text in ${replyLanguage}
- If you cannot clearly understand the audio, still try to extract what you can and indicate lower confidence`;

    const request: AIRequest = {
      prompt,
      audioData,
      temperature: 0.4,
      maxTokens: 4096,
    };

    const response = await providerInstance.transcribeAudio!(request);
    
    console.log(`Meal plan voice recording analyzed using ${provider} (${response.model})`);
    
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

    // Get the user's preferred language
    const { data: languageData } = await supabase.rpc('get_decrypted_api_token', {
      p_token_name: 'ai_language'
    });
    const replyLanguage = languageData || 'English';

    // Create AI service instance
    const aiService = new AIService(supabase);

    // Analyze voice recording using the best available provider
    const result = await aiService.analyzeMealPlanVoiceRecording(audio, replyLanguage);

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
        meal: {
          name: "Meal Plan",
          plannedDate: null,
          destinationTime: null,
          notes: "Voice detected meal plan"
        },
        ingredients: [],
        preparationSteps: [],
        confidence: "low"
      };
    }

    // Ensure the response has the required fields and format
    if (!analysisResult.meal) {
      analysisResult.meal = {
        name: "Meal Plan",
        plannedDate: null,
        destinationTime: null,
        notes: "Voice detected meal plan"
      };
    }

    if (!analysisResult.ingredients || !Array.isArray(analysisResult.ingredients)) {
      analysisResult.ingredients = [];
    }

    if (!analysisResult.preparationSteps || !Array.isArray(analysisResult.preparationSteps)) {
      analysisResult.preparationSteps = [];
    }

    // Validate and fix meal data
    analysisResult.meal = {
      name: analysisResult.meal.name || "Meal Plan",
      plannedDate: analysisResult.meal.plannedDate || null,
      destinationTime: analysisResult.meal.destinationTime || null,
      notes: analysisResult.meal.notes || "Voice detected meal plan"
    };

    // Validate and fix ingredients
    analysisResult.ingredients = analysisResult.ingredients.map(ingredient => ({
      name: ingredient.name || "Ingredient",
      quantity: ingredient.quantity || 1,
      unit: ingredient.unit || "item",
      notes: ingredient.notes || ""
    }));

    if (!analysisResult.confidence) {
      analysisResult.confidence = "medium";
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
    console.error('Error in analyze-meal-plan-voice function:', error);
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