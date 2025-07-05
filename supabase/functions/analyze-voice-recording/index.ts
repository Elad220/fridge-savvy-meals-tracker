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

  async transcribeAudio(request: AIRequest): Promise<AIResponse> {
    this.validateCredentials();

    if (!request.audioData) {
      throw new Error('Audio data is required for transcription');
    }

    try {
      // Extract base64 data and mime type from data URL
      const [header, base64Data] = request.audioData.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'audio/wav';

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
        throw new Error('No content generated from audio transcription');
      }

      return this.createResponse(content, request.model || 'gemini-2.0-flash');
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

// Anthropic Provider doesn't support audio transcription
class AnthropicProvider extends BaseAIProvider {
  readonly provider = 'anthropic' as const;
  readonly supportedFeatures = {
    textGeneration: true,
    imageAnalysis: true,
    audioTranscription: false,
  };

  async transcribeAudio(request: AIRequest): Promise<AIResponse> {
    throw new Error('Audio transcription is not supported by Anthropic Claude. Please use Gemini or OpenAI for audio features.');
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

  private async findAudioCapableProvider(): Promise<AIProvider> {
    const audioCapableProviders: AIProvider[] = ['gemini', 'openai'];
    
    // First try the user's selected provider if it supports audio
    const selectedProvider = await this.getCurrentProvider();
    if (audioCapableProviders.includes(selectedProvider)) {
      const credentials = await this.getProviderCredentials(selectedProvider);
      if (credentials) {
        return selectedProvider;
      }
    }

    // Otherwise, find any provider that supports audio and has credentials
    for (const provider of audioCapableProviders) {
      const credentials = await this.getProviderCredentials(provider);
      if (credentials) {
        return provider;
      }
    }

    throw new Error('No audio-capable AI provider configured. Please set up Gemini or OpenAI for voice recording features.');
  }

  async analyzeVoiceRecording(audioData: string, replyLanguage: string): Promise<any> {
    const provider = await this.findAudioCapableProvider();
    const credentials = await this.getProviderCredentials(provider);

    if (!credentials) {
      throw new Error(`No credentials found for ${provider}. Please configure your API token in settings.`);
    }

    const providerInstance = AIProviderFactory.createProvider(provider, credentials);

    if (!providerInstance.supportedFeatures.audioTranscription) {
      throw new Error(`${provider} does not support audio transcription. Please select Gemini or OpenAI for audio features.`);
    }

    // Create the prompt for voice analysis with dynamic language
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

    const request: AIRequest = {
      prompt,
      audioData,
      temperature: 0.4,
      maxTokens: 4096,
    };

    const response = await providerInstance.transcribeAudio!(request);
    
    console.log(`Voice recording analyzed using ${provider} (${response.model})`);
    
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
    const result = await aiService.analyzeVoiceRecording(audio, replyLanguage);

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
    console.error('Error in analyze-voice-recording function:', error);
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