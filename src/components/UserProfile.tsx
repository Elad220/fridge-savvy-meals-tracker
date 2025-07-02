
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Key, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const UserProfile = () => {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.name || user.email?.split('@')[0] || '');
    }
  }, [user]);

  const handleUpdateName = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'Invalid Name',
        description: 'Please enter a valid full name.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingName(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: fullName.trim() }
      });

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your full name has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setIsResettingPassword(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/password-reset?mode=reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Password Reset Sent',
        description: 'Check your email for password reset instructions. You will be signed out now.',
      });

      // Sign out the user after sending reset email
      setTimeout(async () => {
        await signOut();
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Password Reset Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-muted-foreground" />
          <CardTitle>Profile Information</CardTitle>
        </div>
        <CardDescription>
          Manage your account details and security settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Full Name Section */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="flex gap-2">
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="flex-1"
            />
            <Button 
              onClick={handleUpdateName}
              disabled={isUpdatingName || !fullName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdatingName ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>

        {/* Email Section */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              value={user.email || ''}
              disabled
              className="flex-1 bg-muted"
            />
            <Badge variant="outline" className="text-xs">
              {user.email_confirmed_at ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Email address cannot be changed. Contact support if needed.
          </p>
        </div>

        {/* Account Information */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Account Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Member since:</span>
              <p className="font-medium">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last sign in:</span>
              <p className="font-medium">
                {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Key className="w-4 h-4" />
            Security Settings
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Password</p>
                <p className="text-xs text-muted-foreground">
                  Change your password to keep your account secure
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Change Password
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will send a password reset link to your email address. You will be signed out and need to use the link to set a new password.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handlePasswordReset}
                      disabled={isResettingPassword}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isResettingPassword ? 'Sending...' : 'Send Reset Link'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Coming Soon
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
