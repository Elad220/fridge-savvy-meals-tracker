import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Key, Shield, Trash2 } from 'lucide-react';
import { useApiTokens } from '@/hooks/useApiTokens';

const Settings = () => {
  const { hasGeminiToken, saveToken, removeToken } = useApiTokens();
  const [token, setToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleSaveToken = async () => {
    if (!token.trim()) return;
    setIsSaving(true);
    const success = await saveToken(token.trim());
    if (success) {
      setToken('');
    }
    setIsSaving(false);
  };

  const handleRemoveToken = async () => {
    setIsRemoving(true);
    await removeToken();
    setIsRemoving(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Gemini API Token</h3>
            {hasGeminiToken ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Not Set
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Your Gemini API token is required to generate recipes and analyze photos. You can get your token from Google AI Studio.
          </p>
          <div>
            <Label htmlFor="token">API Token</Label>
            <div className="flex gap-2">
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={hasGeminiToken ? "••••••••••••••••••••••••••••••••••••••" : "Enter your Gemini API token..."}
                className="flex-1"
              />
              <Button 
                onClick={handleSaveToken} 
                disabled={!token.trim() || isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Key className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your token will be stored securely and encrypted.
            </p>
          </div>

          {hasGeminiToken && (
            <div className="pt-4 border-t border-border">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Token
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove API Token</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove your Gemini API token? This will disable AI features until a new token is added.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleRemoveToken}
                      disabled={isRemoving}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isRemoving ? 'Removing...' : 'Remove Token'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;