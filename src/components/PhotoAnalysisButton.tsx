import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApiTokens } from '@/hooks/useApiTokens';

interface PhotoAnalysisButtonProps {
  onOpen: () => void;
  onNavigateToSettings: () => void;
  disabled?: boolean;
  className?: string;
}

export const PhotoAnalysisButton = ({
  onOpen,
  onNavigateToSettings,
  disabled = false,
  className = '',
}: PhotoAnalysisButtonProps) => {
  const { hasGeminiToken, loading: tokenLoading } = useApiTokens();

  if (tokenLoading) {
    return (
      <Button
        disabled
        variant="outline"
        className={`border-purple-300 text-purple-400 dark:border-purple-700 dark:text-purple-500 w-full cursor-not-allowed ${className}`}
      >
        <Camera className="w-4 h-4 mr-2 animate-pulse" />
        Loading...
      </Button>
    );
  }

  if (hasGeminiToken) {
    return (
      <Button
        onClick={onOpen}
        disabled={disabled}
        variant="outline"
        className={`border-purple-500 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-950/30 transition-colors duration-200 w-full ${className}`}
      >
        <Camera className="w-4 h-4 mr-2" />
        Analyze Photo
      </Button>
    );
  }

  return (
    <div className={`bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 w-full ${className}`}>
      <p className="text-sm text-orange-700 dark:text-orange-400 text-center">
        Add your Gemini API token in the{' '}
        <button 
          onClick={onNavigateToSettings} 
          className="font-bold underline hover:text-orange-800 dark:hover:text-orange-300"
        >
          settings page
        </button>{' '}
        to enable photo analysis.
      </p>
    </div>
  );
};
