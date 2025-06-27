
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const useApiTokens = () => {
  const { user } = useAuth();
  const [hasGeminiToken, setHasGeminiToken] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkForToken = async () => {
    if (!user) {
      setHasGeminiToken(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_api_tokens')
        .select('id')
        .eq('user_id', user.id)
        .eq('token_name', 'gemini')
        .maybeSingle();

      if (error) throw error;

      setHasGeminiToken(!!data);
    } catch (error: any) {
      console.error('Error checking for token:', error);
      toast({
        title: 'Error checking API token',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveToken = async (token: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase.rpc('store_api_token', {
        token_name: 'gemini',
        api_token: token,
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
      return data?.encrypted_token || null;
    } catch (error: any) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  useEffect(() => {
    checkForToken();
  }, [user]);

  return {
    hasGeminiToken,
    loading,
    saveToken,
    getToken,
    refreshTokenStatus: checkForToken,
  };
};
