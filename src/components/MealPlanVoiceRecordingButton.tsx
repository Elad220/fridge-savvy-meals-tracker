import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApiTokens } from '@/hooks/useApiTokens';

interface MealPlanVoiceRecordingButtonProps { 
  onOpen: () => void;
  onNavigateToSettings: () => void;
  disabled?: boolean;
  className?: string;
}

export const MealPlanVoiceRecordingButton = ({
  onOpen,
  onNavigateToSettings,
  disabled = false,
  className = '',
}: MealPlanVoiceRecordingButtonProps) => {
  const { hasAnyToken, loading: tokenLoading } = useApiTokens();

  if (tokenLoading) {
    return (
      <Button
        disabled
        variant="outline"
        className={`border-blue-300 text-blue-400 dark:border-blue-700 dark:text-blue-500 w-full cursor-not-allowed ${className}`}
      >
        <Mic className="w-4 h-4 mr-2 animate-pulse" />
        Loading...
      </Button>
    );
  }

  if (hasAnyToken) {
    return (
      <Button
        onClick={onOpen}
        disabled={disabled}
        variant="outline"
        className={`border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950/30 transition-colors duration-200 w-full ${className}`}
      >
        <Mic className="w-4 h-4 mr-2" />
        Voice Recording
      </Button>
    );
  }

  return (
    <div className={`bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 w-full ${className}`}>
      <p className="text-sm text-orange-700 dark:text-orange-400 text-center">
        Add your AI API token in the{' '}
        <button 
          onClick={onNavigateToSettings} 
          className="font-bold underline hover:text-orange-800 dark:hover:text-orange-300"
        >
          settings page
        </button>{' '}
        to enable voice recording.
      </p>
    </div>
  );
}; 