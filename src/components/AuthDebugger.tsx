import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { debugAuthSession, clearAuthSession } from '@/lib/debug-auth';
import { Bug, RefreshCw, LogOut } from 'lucide-react';

export const AuthDebugger = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDebugSession = async () => {
    setIsLoading(true);
    setDebugInfo('Debugging session...');
    
    try {
      const result = await debugAuthSession();
      setDebugInfo(JSON.stringify(result, null, 2));
    } catch (error) {
      setDebugInfo(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSession = async () => {
    setIsLoading(true);
    setDebugInfo('Clearing session...');
    
    try {
      const result = await clearAuthSession();
      setDebugInfo(`Session cleared: ${JSON.stringify(result, null, 2)}`);
      
      // Reload the page after clearing session
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setDebugInfo(`Error clearing session: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Auth Debugger
        </CardTitle>
        <CardDescription>
          Debug authentication issues and clear session if needed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleDebugSession}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Debug Session
          </Button>
          <Button
            onClick={handleClearSession}
            disabled={isLoading}
            variant="destructive"
            className="flex-1"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Clear Session
          </Button>
        </div>
        
        {debugInfo && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Debug Information:</h4>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
              {debugInfo}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};