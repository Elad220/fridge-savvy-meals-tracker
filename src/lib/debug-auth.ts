import { supabase } from '@/integrations/supabase/client';

export const debugAuthSession = async () => {
  try {
    console.log('=== Auth Session Debug ===');
    
    // Check current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Session:', session);
    console.log('Session error:', error);
    
    if (session) {
      console.log('User ID:', session.user.id);
      console.log('User email:', session.user.email);
      console.log('Session expires at:', new Date(session.expires_at! * 1000));
      console.log('Is session expired:', Date.now() > session.expires_at! * 1000);
    } else {
      console.log('No active session found');
    }
    
    // Check localStorage for session data
    const localStorageSession = localStorage.getItem('sb-wwhqiddmkziladwfeggn-auth-token');
    console.log('LocalStorage session data:', localStorageSession);
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    console.log('=== End Debug ===');
    
    return { session, user, error };
  } catch (error) {
    console.error('Debug auth session error:', error);
    return { session: null, user: null, error };
  }
};

export const clearAuthSession = async () => {
  try {
    console.log('Clearing auth session...');
    
    // Clear localStorage
    localStorage.removeItem('sb-wwhqiddmkziladwfeggn-auth-token');
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
    } else {
      console.log('Successfully cleared auth session');
    }
    
    return { error };
  } catch (error) {
    console.error('Error clearing auth session:', error);
    return { error };
  }
};