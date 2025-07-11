import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle specific auth events
        if (event === 'SIGNED_IN' && session?.user) {
          // Only show welcome message for actual sign-ins, not session restoration or email confirmations
          const isEmailConfirmation = window.location.search.includes('token_hash');
          
          // Don't show toast if this is the initial load (session restoration)
          if (!isEmailConfirmation && !isInitialLoad) {
            toast({
              title: 'Welcome!',
              description: `Signed in as ${session.user.email}`,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: 'Signed out',
            description: 'You have been signed out successfully.',
          });
        }
        
        // Mark that initial load is complete
        setIsInitialLoad(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Mark that initial load is complete after checking existing session
      setIsInitialLoad(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Sign Out Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
  };
};
