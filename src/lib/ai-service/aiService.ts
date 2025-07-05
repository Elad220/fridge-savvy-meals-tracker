import { AIProvider, AIRequest, AIResponse, ProviderCredentials } from '@/types/aiProvider';
import { AIProviderFactory } from '@/lib/ai-providers/factory';
import { supabase } from '@/integrations/supabase/client';

export class AIService {
  private static instance: AIService;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async getCurrentProvider(): Promise<AIProvider> {
    try {
      const { data, error } = await supabase
        .rpc('get_decrypted_api_token', { p_token_name: 'selected_ai_provider' });

      if (error) throw error;
      return (data as AIProvider) || 'gemini';
    } catch (error) {
      console.error('Error getting selected provider:', error);
      return 'gemini';
    }
  }

  private async getProviderCredentials(provider: AIProvider): Promise<ProviderCredentials | null> {
    try {
      const { data, error } = await supabase
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

  private async createProviderInstance(provider?: AIProvider) {
    const selectedProvider = provider || await this.getCurrentProvider();
    const credentials = await this.getProviderCredentials(selectedProvider);

    if (!credentials) {
      throw new Error(`No credentials found for ${selectedProvider}. Please configure your API token in settings.`);
    }

    return AIProviderFactory.createProvider(selectedProvider, credentials);
  }

  async generateText(prompt: string, options?: {
    provider?: AIProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<AIResponse> {
    const providerInstance = await this.createProviderInstance(options?.provider);

    const request: AIRequest = {
      prompt,
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    };

    return providerInstance.generateText(request);
  }

  async analyzeImage(prompt: string, imageData: string, options?: {
    provider?: AIProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<AIResponse> {
    const providerInstance = await this.createProviderInstance(options?.provider);

    if (!providerInstance.supportedFeatures.imageAnalysis) {
      throw new Error(`${providerInstance.provider} does not support image analysis. Please select a different provider.`);
    }

    const request: AIRequest = {
      prompt,
      imageData,
      model: options?.model,
      temperature: options?.temperature || 0.4,
      maxTokens: options?.maxTokens,
    };

    return providerInstance.analyzeImage(request);
  }

  async transcribeAudio(prompt: string, audioData: string, options?: {
    provider?: AIProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<AIResponse> {
    const providerInstance = await this.createProviderInstance(options?.provider);

    if (!providerInstance.supportedFeatures.audioTranscription) {
      throw new Error(`${providerInstance.provider} does not support audio transcription. Please select a different provider.`);
    }

    const request: AIRequest = {
      prompt,
      audioData,
      model: options?.model,
      temperature: options?.temperature || 0.4,
      maxTokens: options?.maxTokens,
    };

    return providerInstance.transcribeAudio!(request);
  }

  async checkProviderCapabilities(provider?: AIProvider) {
    try {
      const selectedProvider = provider || await this.getCurrentProvider();
      const credentials = await this.getProviderCredentials(selectedProvider);

      if (!credentials) {
        return {
          available: false,
          provider: selectedProvider,
          features: {
            textGeneration: false,
            imageAnalysis: false,
            audioTranscription: false,
          },
        };
      }

      const providerInstance = AIProviderFactory.createProvider(selectedProvider, credentials);

      return {
        available: true,
        provider: selectedProvider,
        features: providerInstance.supportedFeatures,
      };
    } catch (error) {
      return {
        available: false,
        provider: provider || 'gemini',
        features: {
          textGeneration: false,
          imageAnalysis: false,
          audioTranscription: false,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export a singleton instance
export const aiService = AIService.getInstance();