import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Key, Shield, Trash2, Globe } from 'lucide-react';
import { useApiTokens } from '@/hooks/useApiTokens';
import { useAuth } from '@/hooks/useAuth';
import UserProfile from './UserProfile';
import { ActionHistory } from './ActionHistory';

const Settings = () => {
  const { hasGeminiToken, saveToken, removeToken, getLanguage, saveLanguage } = useApiTokens();
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);

  const languages = [
    'English',
    'Hebrew',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Chinese',
    'Japanese',
    'Korean',
    'Arabic'
  ];

  // Load current language on component mount
  useEffect(() => {
    const loadLanguage = async () => {
      const currentLanguage = await getLanguage();
      setSelectedLanguage(currentLanguage || 'English');
    };
    loadLanguage();
  }, [getLanguage]);

  const handleSaveToken = async () => {
    if (!token.trim()) return;
    setIsSaving(true);
    const success = await saveToken(token.trim());
    if (success) {
      setToken('');
    }
    setIsSaving(false);
  };

  const handleSaveLanguage = async () => {
    setIsSavingLanguage(true);
    await saveLanguage(selectedLanguage);
    setIsSavingLanguage(false);
  };

  const handleRemoveToken = async () => {
    setIsRemoving(true);
    await removeToken();
    setIsRemoving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <UserProfile />
      
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">AI Response Language</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose the language for AI photo analysis and recipe generation responses.
          </p>
          <div className="flex gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(language => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSaveLanguage} 
              disabled={isSavingLanguage}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSavingLanguage ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

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

      {user?.id && (
        <ActionHistory userId={user.id} />
      )}
    </div>
  );
};

export default Settings;
