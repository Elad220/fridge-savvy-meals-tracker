import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const useApiTokens = () => {
  const { user } = useAuth();
  const [hasGeminiToken, setHasGeminiToken] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkForToken = useCallback(async () => {
    // Skip if no user
    if (!user) {
      setHasGeminiToken(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data } = await supabase
        .from('user_api_tokens')
        .select('id')
        .eq('user_id', user.id)
        .eq('token_name', 'gemini')
        .maybeSingle()
        .throwOnError();

      setHasGeminiToken(!!data);
    } catch (error: any) {
      console.error('Error checking for token:', error);
      setHasGeminiToken(false);
      // Only show error if we had a token before
      if (hasGeminiToken) {
        toast({
          title: 'Error checking API token',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, hasGeminiToken]);

  const saveToken = async (token: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase.rpc('store_api_token', {
        p_token_name: 'gemini',
        p_api_token: token,
      });

      if (error) throw error;

      setHasGeminiToken(true);
      toast({
        title: 'API token saved',
        description: 'Your Gemini API token has been saved securely.',
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

  const removeToken = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_api_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token_name', 'gemini');

      if (error) throw error;

      setHasGeminiToken(false);
      toast({
        title: 'API token removed',
        description: 'Your Gemini API token has been removed.',
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

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_api_tokens')
        .select('encrypted_token')
        .eq('user_id', user.id)
        .eq('token_name', 'gemini')
        .maybeSingle();

      if (error) throw error;
      return data?.encrypted_token ? '•••••••••••••••••••••••••••••••••••••••••••••' : null;
    } catch (error: any) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  // Only check token when user.id changes
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const checkToken = async () => {
      if (isMounted) {
        await checkForToken();
      }
    };

    checkToken();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user?.id, checkForToken]);

  // Memoize the returned object to prevent unnecessary re-renders
  return useMemo(() => ({
    hasGeminiToken,
    loading,
    saveToken,
    removeToken,
    getToken,
    refreshTokenStatus: checkForToken,
  }), [hasGeminiToken, loading, checkForToken]);
};