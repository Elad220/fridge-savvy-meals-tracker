import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { AIProvider, AI_PROVIDERS } from '@/types/aiProvider';
import { AIProviderFactory } from '@/lib/ai-providers/factory';

export const useApiTokens = () => {
  const { user } = useAuth();
  const [providerTokens, setProviderTokens] = useState<Record<string, boolean>>({});
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('gemini');
  const [loading, setLoading] = useState(true);
  // Preference: Whether AI recommendations are enabled for the user. Default to true so feature works out-of-the-box.
  const [aiRecommendationsEnabled, setAiRecommendationsEnabled] = useState<boolean>(true);

  // Legacy support - check if user has Gemini token
  const hasGeminiToken = providerTokens['gemini'] || false;

  const checkForTokens = useCallback(async () => {
    if (!user) {
      setProviderTokens({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check for tokens for all supported providers
      const supportedProviders = AIProviderFactory.getSupportedProviders();
      const tokenChecks = await Promise.all(
        supportedProviders.map(async (provider) => {
          const { data } = await supabase
            .from('user_api_tokens')
            .select('id')
            .eq('user_id', user.id)
            .eq('token_name', provider)
            .maybeSingle();
          
          return { provider, hasToken: !!data };
        })
      );

      const tokens: Record<string, boolean> = {};
      tokenChecks.forEach(({ provider, hasToken }) => {
        tokens[provider] = hasToken;
      });

      setProviderTokens(tokens);

      // Auto-select the first provider that has a token, or default to Gemini
      const providerWithToken = supportedProviders.find(provider => tokens[provider]);
      if (providerWithToken && !tokens[selectedProvider]) {
        setSelectedProvider(providerWithToken);
      }

    } catch (error: any) {
      console.error('Error checking for tokens:', error);
      setProviderTokens({});
      toast({
        title: 'Error checking API tokens',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedProvider]);

  const saveToken = async (provider: AIProvider, token: string, additionalData?: Record<string, string>) => {
    if (!user) return false;

    try {
      // For providers with additional fields, store as JSON
      const tokenData = additionalData 
        ? JSON.stringify({ apiKey: token, ...additionalData })
        : token;

      const { error } = await supabase.rpc('store_api_token', {
        p_token_name: provider,
        p_api_token: tokenData,
      });

      if (error) throw error;

      setProviderTokens(prev => ({ ...prev, [provider]: true }));
      toast({
        title: 'API token saved',
        description: `Your ${AI_PROVIDERS[provider].name} API token has been saved securely.`,
      });
      return true;
    } catch (error: any) {
      console.error('Error saving token:', error);
      toast({
        title: 'Error saving API token',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeToken = async (provider: AIProvider) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_api_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token_name', provider);

      if (error) throw error;

      setProviderTokens(prev => ({ ...prev, [provider]: false }));
      toast({
        title: 'API token removed',
        description: `Your ${AI_PROVIDERS[provider].name} API token has been removed.`,
      });
      return true;
    } catch (error: any) {
      console.error('Error removing token:', error);
      toast({
        title: 'Error removing API token',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getProviderCredentials = async (provider: AIProvider): Promise<any | null> => {
    if (!user) return null;

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
    } catch (error: any) {
      console.error('Error getting provider credentials:', error);
      return null;
    }
  };

  const saveLanguage = async (language: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase.rpc('store_api_token', {
        p_token_name: 'ai_language',
        p_api_token: language,
      });

      if (error) throw error;

      toast({
        title: 'Language preference saved',
        description: `AI responses will now be in ${language}.`,
      });
      return true;
    } catch (error: any) {
      console.error('Error saving language:', error);
      toast({
        title: 'Error saving language preference',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getLanguage = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_decrypted_api_token', { p_token_name: 'ai_language' });

      if (error) throw error;
      return data || 'English';
    } catch (error: any) {
      console.error('Error getting language:', error);
      return 'English';
    }
  };

  const saveSelectedProvider = async (provider: AIProvider) => {
    if (!user) return false;

    try {
      const { error } = await supabase.rpc('store_api_token', {
        p_token_name: 'selected_ai_provider',
        p_api_token: provider,
      });

      if (error) throw error;
      setSelectedProvider(provider);
      return true;
    } catch (error: any) {
      console.error('Error saving selected provider:', error);
      return false;
    }
  };

  const getSelectedProvider = async (): Promise<AIProvider> => {
    if (!user) return 'gemini';

    try {
      const { data, error } = await supabase
        .rpc('get_decrypted_api_token', { p_token_name: 'selected_ai_provider' });

      if (error) throw error;
      return (data as AIProvider) || 'gemini';
    } catch (error: any) {
      console.error('Error getting selected provider:', error);
      return 'gemini';
    }
  };

  // Load saved provider selection on mount
  useEffect(() => {
    let isMounted = true;

    const loadProvider = async () => {
      if (user && isMounted) {
        const savedProvider = await getSelectedProvider();
        setSelectedProvider(savedProvider);
      }
    };

    loadProvider();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Check tokens when user or provider changes
  useEffect(() => {
    let isMounted = true;

    const checkTokens = async () => {
      if (isMounted) {
        await checkForTokens();
      }
    };

    checkTokens();
    return () => { isMounted = false; };
  }, [user?.id, checkForTokens]);

  // Load saved AI recommendations preference on mount
  useEffect(() => {
    let isMounted = true;

    const loadPreference = async () => {
      if (user && isMounted) {
        const enabled = await getAiRecommendationsEnabled();
        setAiRecommendationsEnabled(enabled);
      }
    };

    loadPreference();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // ================= AI Recommendations Preference =================
  const saveAiRecommendationsEnabled = async (enabled: boolean) => {
    if (!user) return false;

    try {
      const { error } = await supabase.rpc('store_api_token', {
        p_token_name: 'ai_recommendations_enabled',
        p_api_token: enabled ? 'true' : 'false',
      });

      if (error) throw error;

      setAiRecommendationsEnabled(enabled);
      toast({
        title: 'Preference saved',
        description: `AI recommendations have been ${enabled ? 'enabled' : 'disabled'}.`,
      });
      return true;
    } catch (error: any) {
      console.error('Error saving AI recommendations preference:', error);
      toast({
        title: 'Error saving preference',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getAiRecommendationsEnabled = async (): Promise<boolean> => {
    if (!user) return true; // default enabled for unauthenticated scenario

    try {
      const { data, error } = await supabase.rpc('get_decrypted_api_token', {
        p_token_name: 'ai_recommendations_enabled',
      });

      if (error) throw error;

      // If not set, default to true
      if (data === null || data === undefined) return true;

      return data === 'true';
    } catch (error: any) {
      console.error('Error getting AI recommendations preference:', error);
      return true;
    }
  };

  // Memoize the returned object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Legacy support for existing components
    hasGeminiToken,
    
    // New multi-provider support
    providerTokens,
    selectedProvider,
    setSelectedProvider: saveSelectedProvider,
    hasAnyToken: Object.values(providerTokens).some(Boolean),
    hasTokenForProvider: (provider: AIProvider) => providerTokens[provider] || false,
    
    // Token management
    loading,
    saveToken: (token: string, additionalData?: Record<string, string>) => 
      saveToken(selectedProvider, token, additionalData),
    saveTokenForProvider: saveToken,
    removeToken: () => removeToken(selectedProvider),
    removeTokenForProvider: removeToken,
    getProviderCredentials,
    
    // Language and preferences
    saveLanguage,
    getLanguage,
    
    // AI Recommendations preference
    aiRecommendationsEnabled,
    saveAiRecommendationsEnabled,
    
    // Utility
    refreshTokenStatus: checkForTokens,
  }), [
    hasGeminiToken,
    providerTokens,
    selectedProvider,
    loading,
    checkForTokens,
    aiRecommendationsEnabled,
  ]);
};
