# Multi-Provider AI Implementation

This document describes the implementation of multiple GenAI provider support, extending beyond the original Gemini-only integration.

## Overview

The application now supports multiple AI providers for recipe generation, photo analysis, and voice recording analysis:

- ✅ **Google Gemini** (Original implementation)
- ✅ **OpenAI GPT** (Text generation, image analysis, audio transcription)
- ✅ **Anthropic Claude** (Text generation, image analysis)
- 🚧 **AWS Bedrock** (Planned)
- 🚧 **Azure OpenAI** (Planned)

## Architecture

### Core Components

#### 1. Type Definitions (`src/types/aiProvider.ts`)
- `AIProvider` - Union type for supported providers
- `AIProviderConfig` - Configuration for each provider
- `AIRequest/AIResponse` - Standardized request/response interfaces
- `ProviderCredentials` - Credential management interface
- `AI_PROVIDERS` - Configuration object for all providers

#### 2. Provider Implementations (`src/lib/ai-providers/`)
- `base.ts` - Abstract base class for all providers
- `gemini.ts` - Google Gemini implementation
- `openai.ts` - OpenAI implementation  
- `anthropic.ts` - Anthropic Claude implementation
- `factory.ts` - Provider factory for creating instances

#### 3. AI Service Layer (`src/lib/ai-service/aiService.ts`)
- Unified API for interacting with any provider
- Automatic provider selection based on user preferences
- Credential management and validation
- Error handling and fallbacks

#### 4. UI Components
- `MultiProviderSettings.tsx` - Comprehensive settings interface
- Updated `useApiTokens.tsx` hook with multi-provider support
- Backward compatibility with existing components

### Provider Capabilities

| Provider | Text Generation | Image Analysis | Audio Transcription |
|----------|----------------|----------------|-------------------|
| Gemini   | ✅             | ✅             | ✅                |
| OpenAI   | ✅             | ✅             | ✅                |
| Anthropic| ✅             | ✅             | ❌                |

## Usage

### Frontend Integration

```typescript
import { aiService } from '@/lib/ai-service/aiService';

// Generate text using the selected provider
const response = await aiService.generateText(
  "Generate a recipe for pasta with tomatoes"
);

// Analyze an image with a specific provider
const analysis = await aiService.analyzeImage(
  "What ingredients do you see in this photo?",
  imageDataUrl,
  { provider: 'openai', model: 'gpt-4o' }
);

// Check provider capabilities
const capabilities = await aiService.checkProviderCapabilities('anthropic');
```

### Backend Integration (Supabase Functions)

The new multi-provider system can be implemented in Supabase Edge Functions. See `supabase/functions/generate-recipes-multi/index.ts` for a complete example.

Key features:
- Automatic provider selection based on user preferences
- Graceful fallbacks and error handling
- Usage tracking and metadata
- Backward compatibility with existing API

## Configuration

### Provider Setup

Users can configure multiple providers in the Settings interface:

1. **Google Gemini**
   - API Key from Google AI Studio
   - Models: gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash

2. **OpenAI**
   - API Key from OpenAI Platform
   - Models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo

3. **Anthropic Claude**
   - API Key from Anthropic Console
   - Models: claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus

### Advanced Configuration

Some providers support additional configuration:

```typescript
// AWS Bedrock (when implemented)
{
  apiKey: "AKIA...",
  secretKey: "...",
  region: "us-east-1"
}

// Azure OpenAI (when implemented)
{
  apiKey: "...",
  endpoint: "https://your-resource.openai.azure.com/",
  deployment: "gpt-4o"
}
```

## Database Schema

The existing `user_api_tokens` table supports the new system:

```sql
-- Existing table structure supports multiple providers
CREATE TABLE public.user_api_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    token_name TEXT NOT NULL DEFAULT 'gemini',
    encrypted_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- New token names:
-- 'gemini' - Google Gemini API key
-- 'openai' - OpenAI API key  
-- 'anthropic' - Anthropic API key
-- 'selected_ai_provider' - User's preferred provider
-- 'ai_language' - User's preferred language
```

## Migration Guide

### From Gemini-Only to Multi-Provider

The implementation maintains full backward compatibility:

1. **Existing Gemini tokens** continue to work unchanged
2. **Legacy API calls** automatically use Gemini
3. **Existing components** work without modification
4. **Database schema** requires no changes

### Component Updates

To leverage new features, update components:

```typescript
// Old way (still works)
const { hasGeminiToken, saveToken } = useApiTokens();

// New way (recommended)
const { 
  selectedProvider, 
  hasTokenForProvider, 
  saveTokenForProvider 
} = useApiTokens();
```

### Supabase Function Updates

Update existing functions to use the new architecture:

```typescript
// Old way - hardcoded Gemini
const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/...`);

// New way - dynamic provider
const aiService = new AIService(supabase);
const response = await aiService.generateRecipes(ingredients, language);
```

## Error Handling

The system provides comprehensive error handling:

1. **Provider-specific errors** (rate limits, authentication)
2. **Feature compatibility** (audio transcription not supported by Claude)
3. **Graceful fallbacks** to default provider
4. **User-friendly error messages**

```typescript
try {
  const result = await aiService.transcribeAudio(prompt, audioData);
} catch (error) {
  if (error.message.includes('does not support audio transcription')) {
    // Suggest alternative provider
    showNotification('Please select OpenAI or Gemini for audio features');
  }
}
```

## Testing

### Provider Testing

Each provider can be tested independently:

```typescript
// Test provider functionality
const capabilities = await aiService.checkProviderCapabilities('openai');
expect(capabilities.available).toBe(true);
expect(capabilities.features.textGeneration).toBe(true);
```

### Integration Testing

Test the full flow with different providers:

```typescript
// Test recipe generation with different providers
const geminiResult = await aiService.generateText(prompt, { provider: 'gemini' });
const openaiResult = await aiService.generateText(prompt, { provider: 'openai' });
```

## Performance Considerations

1. **Provider Selection**: Cached after first retrieval
2. **Credential Management**: Encrypted storage in Supabase
3. **Error Recovery**: Automatic retry logic
4. **Rate Limiting**: Provider-specific handling

## Security

1. **Credential Encryption**: All API keys encrypted in database
2. **Token Validation**: Server-side validation before API calls
3. **Secure Transmission**: HTTPS for all provider communications
4. **Access Control**: User-scoped credential access

## Future Enhancements

### Planned Features

1. **AWS Bedrock Integration**
   - Multiple model families (Claude, Llama, etc.)
   - Region-specific deployments
   - Cost optimization

2. **Azure OpenAI Integration**
   - Enterprise-grade OpenAI models
   - Custom deployments
   - Enhanced security features

3. **Model Selection Interface**
   - Per-provider model selection
   - Performance/cost optimization
   - Feature-specific model recommendations

4. **Usage Analytics**
   - Token consumption tracking
   - Cost analysis
   - Performance metrics

### Advanced Features

1. **Provider Routing**
   - Automatic provider selection based on task
   - Load balancing across providers
   - Fallback chains

2. **Custom Prompts**
   - Provider-specific prompt optimization
   - Template management
   - A/B testing capabilities

## Troubleshooting

### Common Issues

1. **"Provider not supported"**
   - Check provider is in the supported list
   - Verify implementation exists

2. **"No credentials found"**
   - Ensure API token is saved in settings
   - Check token format and validity

3. **"Feature not supported"**
   - Verify provider capabilities
   - Use alternative provider for missing features

### Debug Mode

Enable detailed logging:

```typescript
// Set debug mode (development only)
localStorage.setItem('ai_debug', 'true');
```

## Contributing

### Adding New Providers

1. Create provider implementation in `src/lib/ai-providers/`
2. Add provider configuration to `AI_PROVIDERS`
3. Update factory and type definitions
4. Add tests and documentation
5. Update Supabase functions

### Provider Implementation Template

```typescript
export class NewProvider extends BaseAIProvider {
  readonly provider = 'new-provider' as const;
  readonly supportedFeatures = {
    textGeneration: true,
    imageAnalysis: false,
    audioTranscription: false,
  };

  async generateText(request: AIRequest): Promise<AIResponse> {
    // Implementation
  }
}
```

---

## Summary

The multi-provider AI system provides:

- ✅ **Flexibility**: Support for multiple AI providers
- ✅ **Compatibility**: Full backward compatibility with existing code
- ✅ **Extensibility**: Easy to add new providers
- ✅ **Reliability**: Comprehensive error handling and fallbacks
- ✅ **Security**: Encrypted credential management
- ✅ **User Experience**: Intuitive provider selection and configuration

The implementation allows users to choose their preferred AI provider while maintaining the same powerful features for recipe generation, photo analysis, and voice recording analysis.