import { AIProvider, ProviderCredentials } from '@/types/aiProvider';
import { BaseAIProvider } from './base';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';

export class AIProviderFactory {
  static createProvider(provider: AIProvider, credentials: ProviderCredentials): BaseAIProvider {
    switch (provider) {
      case 'gemini':
        return new GeminiProvider(credentials);
      case 'openai':
        return new OpenAIProvider(credentials);
      case 'anthropic':
        return new AnthropicProvider(credentials);
      case 'aws-bedrock':
        throw new Error('AWS Bedrock provider not yet implemented');
      case 'azure-openai':
        throw new Error('Azure OpenAI provider not yet implemented');
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  static getSupportedProviders(): AIProvider[] {
    return ['gemini', 'openai', 'anthropic'];
  }

  static isProviderSupported(provider: AIProvider): boolean {
    return this.getSupportedProviders().includes(provider);
  }
}