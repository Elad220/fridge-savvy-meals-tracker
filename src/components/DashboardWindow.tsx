import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecentActionsCard } from '@/components/RecentActionsCard';
import { AIRecommendations } from '@/components/AIRecommendations';
import { ActionHistoryItem } from '@/hooks/useActionHistory';

interface DashboardWindowProps {
  isOpen: boolean;
  onClose: () => void;
  recentActions: ActionHistoryItem[];
  historyLoading: boolean;
  userId?: string;
  statusCounts: {
    total: number;
    fresh: number;
    'use-soon': number;
    'use-or-throw': number;
    expired: number;
  };
  onRefreshRecommendations?: () => Promise<void>;
}

export const DashboardWindow: React.FC<DashboardWindowProps> = ({
  isOpen,
  onClose,
  recentActions,
  historyLoading,
  userId,
  statusCounts,
  onRefreshRecommendations
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [windowElement, setWindowElement] = useState<HTMLDivElement | null>(null);

  // Refresh recommendations when modal opens
  useEffect(() => {
    if (isOpen && userId && onRefreshRecommendations) {
      console.log('DashboardWindow: Modal opened, refreshing recommendations');
      onRefreshRecommendations();
    }
  }, [isOpen, userId, onRefreshRecommendations]);

  useEffect(() => {
    if (isOpen) {
      const newWindow = document.createElement('div');
      newWindow.id = 'dashboard-window';
      document.body.appendChild(newWindow);
      setWindowElement(newWindow);

      return () => {
        if (document.body.contains(newWindow)) {
          document.body.removeChild(newWindow);
        }
      };
    }
  }, [isOpen]);

  if (!isOpen || !windowElement) return null;

  const windowContent = (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-200/60 dark:bg-gray-900/60 backdrop-blur-sm transition-all duration-300 ${
        isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`glass-card w-full max-w-4xl h-[80vh] flex flex-col transition-all duration-300 ${
        isMinimized ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {/* Window Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h2 className="ml-4 font-semibold text-foreground">Dashboard Analytics</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-8 h-8"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-8 h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Window Content */}
        <div className="flex-1 p-6 overflow-auto space-y-6">
          {/* Status Overview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Inventory Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 border-green-500/20">
                <div className="text-2xl font-bold text-green-600">{statusCounts.fresh}</div>
                <div className="text-sm text-green-600/80">Fresh Items</div>
              </div>
              <div className="glass-card p-4 border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts['use-soon']}</div>
                <div className="text-sm text-yellow-600/80">Use Soon</div>
              </div>
              <div className="glass-card p-4 border-orange-500/20">
                <div className="text-2xl font-bold text-orange-600">{statusCounts['use-or-throw']}</div>
                <div className="text-sm text-orange-600/80">Use or Throw</div>
              </div>
              <div className="glass-card p-4 border-red-500/20">
                <div className="text-2xl font-bold text-red-600">{statusCounts.expired}</div>
                <div className="text-sm text-red-600/80">Expired</div>
              </div>
            </div>
            <div className="glass-card p-4 max-w-md mx-auto">
              <div className="text-3xl font-bold text-primary text-center">{statusCounts.total}</div>
              <div className="text-sm text-muted-foreground text-center">Total Items</div>
            </div>
          </div>

          {/* Recent Actions */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <RecentActionsCard actions={recentActions} loading={historyLoading} />
          </div>

          {/* AI Recommendations */}
          {userId && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">AI Insights</h3>
              <AIRecommendations 
                userId={userId} 
                onRefreshRecommendations={onRefreshRecommendations}
                forceRefresh={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(windowContent, windowElement);
};