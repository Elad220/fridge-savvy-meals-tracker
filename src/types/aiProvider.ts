export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'aws-bedrock' | 'azure-openai';

export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  description: string;
  website: string;
  tokenLabel: string;
  tokenPlaceholder: string;
  requiresApiKey: boolean;
  models?: string[];
  additionalFields?: {
    [key: string]: {
      label: string;
      placeholder: string;
      required: boolean;
      type: 'text' | 'select';
      options?: string[];
    };
  };
}

export interface AIRequest {
  prompt: string;
  imageData?: string;
  audioData?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIResponse {
  content: string;
  model?: string;
  provider: AIProvider;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface ProviderCredentials {
  apiKey: string;
  [key: string]: string; // For additional fields like endpoint, region, etc.
}

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI model with vision and text capabilities',
    website: 'https://ai.google.dev/',
    tokenLabel: 'Gemini API Key',
    tokenPlaceholder: 'Enter your Gemini API key...',
    requiresApiKey: true,
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models with advanced reasoning and vision capabilities',
    website: 'https://platform.openai.com/',
    tokenLabel: 'OpenAI API Key',
    tokenPlaceholder: 'sk-...',
    requiresApiKey: true,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude AI models with strong reasoning and safety features',
    website: 'https://console.anthropic.com/',
    tokenLabel: 'Anthropic API Key',
    tokenPlaceholder: 'sk-ant-...',
    requiresApiKey: true,
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  },
  'aws-bedrock': {
    id: 'aws-bedrock',
    name: 'AWS Bedrock',
    description: 'Access to multiple AI models through AWS infrastructure',
    website: 'https://aws.amazon.com/bedrock/',
    tokenLabel: 'AWS Access Key',
    tokenPlaceholder: 'AKIA...',
    requiresApiKey: true,
    models: ['anthropic.claude-3-5-sonnet-20241022-v2:0', 'anthropic.claude-3-haiku-20240307-v1:0', 'meta.llama3-2-90b-instruct-v1:0'],
    additionalFields: {
      secretKey: {
        label: 'AWS Secret Key',
        placeholder: 'Enter your AWS secret key...',
        required: true,
        type: 'text',
      },
      region: {
        label: 'AWS Region',
        placeholder: 'us-east-1',
        required: true,
        type: 'select',
        options: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
      },
    },
  },
  'azure-openai': {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    description: 'OpenAI models hosted on Microsoft Azure cloud',
    website: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service',
    tokenLabel: 'Azure API Key',
    tokenPlaceholder: 'Enter your Azure OpenAI API key...',
    requiresApiKey: true,
    models: ['gpt-4o', 'gpt-4', 'gpt-35-turbo'],
    additionalFields: {
      endpoint: {
        label: 'Azure Endpoint',
        placeholder: 'https://your-resource.openai.azure.com/',
        required: true,
        type: 'text',
      },
      deployment: {
        label: 'Deployment Name',
        placeholder: 'gpt-4o',
        required: true,
        type: 'text',
      },
    },
  },
};