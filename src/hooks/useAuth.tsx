import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { debugAuthSession } from '@/lib/debug-auth';

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
          // Clear session and user state immediately
          setSession(null);
          setUser(null);
          
          toast({
            title: 'Signed out',
            description: 'You have been signed out successfully.',
          });
        } else if (event === 'TOKEN_REFRESHED') {
          // Update session with refreshed token
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        // Mark that initial load is complete
        setIsInitialLoad(false);
      }
    );

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Clear session state on error
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Clear session state on error
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
        // Mark that initial load is complete after checking existing session
        setIsInitialLoad(false);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Check if there's an active session before attempting to sign out
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        // No active session, just clear local state
        setSession(null);
        setUser(null);
        toast({
          title: 'Signed out',
          description: 'You have been signed out successfully.',
        });
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        // If sign out fails, still clear local state
        console.error('Sign out error:', error);
        setSession(null);
        setUser(null);
        throw error;
      }
          } catch (error: any) {
        console.error('Sign out error:', error);
        
        // Debug session state when sign out fails
        await debugAuthSession();
        
        // Clear local state even if server sign out fails
        setSession(null);
        setUser(null);
        
        toast({
          title: 'Sign Out Error',
          description: error.message || 'An error occurred during sign out',
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
