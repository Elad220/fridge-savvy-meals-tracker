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
        console.log('Session details:', session ? {
          access_token: session.access_token ? 'present' : 'missing',
          refresh_token: session.refresh_token ? 'present' : 'missing',
          expires_at: session.expires_at,
          user_id: session.user?.id
        } : 'no session');
        
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
          console.log('User signed out successfully');
          toast({
            title: 'Signed out',
            description: 'You have been signed out successfully.',
          });
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'USER_UPDATED') {
          console.log('User updated');
        }
        
        // Mark that initial load is complete
        setIsInitialLoad(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'session found' : 'no session');
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
      console.log('Starting sign out process...');
      
      // First, clear the local state immediately to prevent race conditions
      setUser(null);
      setSession(null);
      
      // Then perform the actual sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      
      // Clear any stored session data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      // Additional cleanup for any other potential session storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('supabase.auth.')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Verify that the session is actually cleared
      const { data: { session: verifySession } } = await supabase.auth.getSession();
      if (verifySession) {
        console.warn('Session still exists after sign out, attempting to clear again...');
        // Try to clear again
        await supabase.auth.signOut();
      } else {
        console.log('Session successfully cleared');
      }
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: 'Sign Out Error',
        description: error.message || 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
      // Revert state if sign out failed
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (revertError) {
        console.error('Failed to revert session state:', revertError);
      }
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
  };
};
