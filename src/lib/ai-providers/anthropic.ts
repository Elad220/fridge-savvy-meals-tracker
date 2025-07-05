import { BaseAIProvider } from './base';
import { AIRequest, AIResponse } from '@/types/aiProvider';

export class AnthropicProvider extends BaseAIProvider {
  readonly provider = 'anthropic' as const;
  readonly supportedFeatures = {
    textGeneration: true,
    imageAnalysis: true,
    audioTranscription: false, // Claude doesn't support audio transcription directly
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

  async transcribeAudio(request: AIRequest): Promise<AIResponse> {
    throw new Error('Audio transcription is not supported by Anthropic Claude. Please use a different provider for audio features.');
  }
}