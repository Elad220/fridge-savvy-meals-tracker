// Simple test script to verify logout functionality
// This can be run in the browser console to test the logout process

async function testLogout() {
  console.log('Testing logout functionality...');
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log('This test must be run in a browser environment');
    return;
  }
  
  // Check if Supabase is available
  if (typeof window.supabase === 'undefined') {
    console.log('Supabase client not found in global scope');
    return;
  }
  
  try {
    // Get current session
    const { data: { session } } = await window.supabase.auth.getSession();
    console.log('Current session:', session ? 'exists' : 'none');
    
    if (!session) {
      console.log('No active session to test logout');
      return;
    }
    
    // Test logout
    console.log('Testing sign out...');
    const { error } = await window.supabase.auth.signOut();
    
    if (error) {
      console.error('Logout failed:', error);
    } else {
      console.log('Logout successful');
      
      // Verify session is cleared
      const { data: { session: verifySession } } = await window.supabase.auth.getSession();
      console.log('Session after logout:', verifySession ? 'still exists' : 'cleared');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testLogout = testLogout;
  console.log('Test function available as window.testLogout()');
}