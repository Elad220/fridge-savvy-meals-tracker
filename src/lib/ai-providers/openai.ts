import { BaseAIProvider } from './base';
import { AIRequest, AIResponse } from '@/types/aiProvider';

export class OpenAIProvider extends BaseAIProvider {
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

  async transcribeAudio(request: AIRequest): Promise<AIResponse> {
    this.validateCredentials();

    if (!request.audioData) {
      throw new Error('Audio data is required for transcription');
    }

    try {
      // Convert data URL to blob
      const [header, base64Data] = request.audioData.split(',');
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });

      const formData = new FormData();
      formData.append('file', blob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('prompt', request.prompt || '');

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw { status: response.status, message: await response.text() };
      }

      const data = await response.json();
      const content = data.text;

      if (!content) {
        throw new Error('No transcription generated');
      }

      // If there's additional processing needed based on the prompt, we can do it here
      // For now, we'll return the transcription as-is
      return this.createResponse(content, 'whisper-1');
    } catch (error) {
      this.handleError(error, 'audio transcription');
    }
  }
}