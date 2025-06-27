
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Key, Shield } from 'lucide-react';
import { useApiTokens } from '@/hooks/useApiTokens';

interface ApiTokenManagerProps {
  onTokenSaved?: () => void;
}

export const ApiTokenManager = ({ onTokenSaved }: ApiTokenManagerProps) => {
  const { hasGeminiToken, saveToken } = useApiTokens();
  const [token, setToken] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToken = async () => {
    if (!token.trim()) return;

    setIsSaving(true);
    const success = await saveToken(token.trim());
    
    if (success) {
      setToken('');
      setIsOpen(false);
      onTokenSaved?.();
    }
    setIsSaving(false);
  };

  return (
    <div className="flex items-center gap-2">
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Key className="w-4 h-4 mr-2" />
            {hasGeminiToken ? 'Update Token' : 'Add Token'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gemini API Token</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="token">API Token</Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your Gemini API token..."
              />
              <p className="text-sm text-muted-foreground mt-1">
                Your token will be stored securely and encrypted.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveToken} 
                disabled={!token.trim() || isSaving}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSaving ? 'Saving...' : 'Save Token'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
