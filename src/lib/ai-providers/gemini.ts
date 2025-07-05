import { BaseAIProvider } from './base';
import { AIRequest, AIResponse } from '@/types/aiProvider';

export class GeminiProvider extends BaseAIProvider {
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