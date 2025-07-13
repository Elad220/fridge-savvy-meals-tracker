
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type AuthMode = 'login' | 'signup' | 'forgot-password';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };

    // Handle email confirmation
    const handleEmailConfirmation = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      
      if (token_hash && type) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          
          if (error) throw error;
          
          if (type === 'email') {
            toast({
              title: 'Email confirmed!',
              description: 'Your account has been verified. You can now sign in.',
            });
            // Clear URL parameters and show login form
            window.history.replaceState({}, '', '/auth');
            setMode('login');
          }
        } catch (error: any) {
          toast({
            title: 'Confirmation Error',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    };

    checkUser();
    handleEmailConfirmation();
  }, [navigate, searchParams]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Google Sign In Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              name: name || email.split('@')[0],
            }
          }
        });

        if (error) throw error;

        toast({
          title: 'Check your email',
          description: 'We sent you a confirmation link to verify your account before you can sign in.',
        });
        
        // Switch to login mode after signup
        setMode('login');
        
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });

        navigate('/');
        
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset-password`,
        });

        if (error) throw error;

        toast({
          title: 'Password reset email sent',
          description: 'Check your email for a link to reset your password. The link will expire in 1 hour.',
        });
        
        setMode('login');
      }
    } catch (error: any) {
      toast({
        title: 'Authentication Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create your account';
      case 'forgot-password': return 'Reset your password';
      default: return 'Welcome back!';
    }
  };

  const getButtonText = () => {
    if (loading) return 'Please wait...';
    switch (mode) {
      case 'signup': return 'Sign Up';
      case 'forgot-password': return 'Send Reset Link';
      default: return 'Sign In';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-500/20 rounded-full blur-sm float-animation"></div>
      <div className="absolute top-1/3 -right-6 w-8 h-8 bg-blue-500/20 rounded-full blur-sm float-animation-delayed"></div>
      <div className="absolute bottom-1/4 -left-8 w-6 h-6 bg-purple-500/20 rounded-full blur-sm float-animation"></div>
      <div className="absolute -bottom-6 right-1/3 w-10 h-10 bg-orange-500/20 rounded-full blur-sm float-animation-delayed"></div>
      
      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Header with gradient text */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-800 dark:text-green-200 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Smart Food Management
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Food Prep
              <span className="gradient-text block">
                Manager
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {getTitle()}
            </p>
          </div>

          {/* Auth Card with glass morphism */}
          <Card className="glass-card hover-lift">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Google Sign In Button */}
                {mode !== 'forgot-password' && (
                  <>
                    <Button
                      onClick={handleGoogleSignIn}
                      variant="outline"
                      className="w-full h-12 text-base font-medium border-2 hover:bg-muted/50 transition-all duration-200"
                      disabled={googleLoading || loading}
                    >
                      {googleLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-3"></div>
                          Signing in...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </div>
                      )}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-4 text-muted-foreground font-medium">
                          Or continue with email
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleAuth} className="space-y-6">
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="h-12 text-base border-2 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="h-12 text-base border-2 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                  </div>

                  {mode !== 'forgot-password' && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        minLength={6}
                        className="h-12 text-base border-2 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                      />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-1"
                    disabled={loading || googleLoading}
                  >
                    {getButtonText()}
                  </Button>

                  <div className="space-y-3">
                    {mode === 'login' && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full h-10 text-sm font-medium hover:bg-muted/50 transition-all duration-200"
                          onClick={() => setMode('signup')}
                        >
                          Don't have an account? Sign up
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full h-10 text-sm font-medium hover:bg-muted/50 transition-all duration-200"
                          onClick={() => setMode('forgot-password')}
                        >
                          Forgot your password?
                        </Button>
                      </>
                    )}

                    {mode === 'signup' && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-10 text-sm font-medium hover:bg-muted/50 transition-all duration-200"
                        onClick={() => setMode('login')}
                      >
                        Already have an account? Sign in
                      </Button>
                    )}

                    {mode === 'forgot-password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-10 text-sm font-medium hover:bg-muted/50 transition-all duration-200"
                        onClick={() => setMode('login')}
                      >
                        Back to sign in
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Footer with trust indicators */}
          <div className="text-center mt-8">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Free to start
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Secure
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Privacy first
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
