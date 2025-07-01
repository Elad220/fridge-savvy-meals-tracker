
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, Shield, Trash2, Globe } from 'lucide-react';
import { useApiTokens } from '@/hooks/useApiTokens';

interface ApiTokenManagerProps {
  onTokenSaved?: () => void;
}

export const ApiTokenManager = ({ onTokenSaved }: ApiTokenManagerProps) => {
  const { hasGeminiToken, saveToken, removeToken, getLanguage, saveLanguage } = useApiTokens();
  const [token, setToken] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

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

  // Load current language when dialog opens
  const handleDialogOpen = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      const currentLanguage = await getLanguage();
      setSelectedLanguage(currentLanguage || 'English');
    }
  };

  const handleSaveToken = async () => {
    if (!token.trim()) return;

    setIsSaving(true);
    const success = await saveToken(token.trim());
    
    if (success) {
      // Also save the selected language
      await saveLanguage(selectedLanguage);
      setToken('');
      setIsOpen(false);
      onTokenSaved?.();
    }
    setIsSaving(false);
  };

  const handleSaveLanguageOnly = async () => {
    setIsSaving(true);
    const success = await saveLanguage(selectedLanguage);
    
    if (success) {
      setIsOpen(false);
      onTokenSaved?.();
    }
    setIsSaving(false);
  };

  const handleRemoveToken = async () => {
    setIsRemoving(true);
    const success = await removeToken();
    
    if (success) {
      onTokenSaved?.();
    }
    setIsRemoving(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-muted-foreground" />
        {hasGeminiToken ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            API Token Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            No API Token
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Key className="w-4 h-4 mr-2" />
              {hasGeminiToken ? 'Update Settings' : 'Add Token'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>AI Settings</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  AI Response Language
                </Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
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
                <p className="text-sm text-muted-foreground mt-1">
                  The language for AI photo analysis and recipe generation responses.
                </p>
              </div>

              <div>
                <Label htmlFor="token">Gemini API Token</Label>
                <Input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={hasGeminiToken ? "••••••••••••••••••••••••••••••••••••••" : "Enter your Gemini API token..."}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Your token will be stored securely and encrypted.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  Cancel
                </Button>
                {token.trim() ? (
                  <Button 
                    onClick={handleSaveToken} 
                    disabled={isSaving}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? 'Saving...' : 'Save All'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSaveLanguageOnly} 
                    disabled={isSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? 'Saving...' : 'Save Language'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {hasGeminiToken && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Token
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove API Token</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove your Gemini API token? This will disable AI features until you add a new token.
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
        )}
      </div>
    </div>
  );
};
