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
}

export const DashboardWindow: React.FC<DashboardWindowProps> = ({
  isOpen,
  onClose,
  recentActions,
  historyLoading,
  userId,
  statusCounts
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [windowElement, setWindowElement] = useState<HTMLDivElement | null>(null);

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
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 bg-gradient-to-br from-green-200/40 via-green-100/30 to-white/10 dark:from-green-900/30 dark:via-green-800/20 dark:to-gray-900/10 backdrop-blur-md transition-all duration-300 border-4 border-green-300/40 shadow-green-200/30 ${
        isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`glass-card w-full max-w-3xl h-[75vh] flex flex-col transition-all duration-300 border-2 border-green-400/40 shadow-lg shadow-green-200/30 ${
        isMinimized ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {/* Window Header */}
        <div className="flex items-center justify-between p-2 md:p-3 border-b border-green-300/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h2 className="ml-3 font-semibold text-foreground gradient-text">Dashboard Analytics</h2>
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
        <div className="flex-1 p-3 md:p-4 overflow-auto space-y-4">
          {/* Status Overview */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground gradient-text">Inventory Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="glass-card p-2 border-green-500/30">
                <div className="text-lg font-bold text-green-600">{statusCounts.fresh}</div>
                <div className="text-xs text-green-600/80">Fresh</div>
              </div>
              <div className="glass-card p-2 border-yellow-500/30">
                <div className="text-lg font-bold text-yellow-600">{statusCounts['use-soon']}</div>
                <div className="text-xs text-yellow-600/80">Use Soon</div>
              </div>
              <div className="glass-card p-2 border-orange-500/30">
                <div className="text-lg font-bold text-orange-600">{statusCounts['use-or-throw']}</div>
                <div className="text-xs text-orange-600/80">Critical</div>
              </div>
              <div className="glass-card p-2 border-red-500/30">
                <div className="text-lg font-bold text-red-600">{statusCounts.expired}</div>
                <div className="text-xs text-red-600/80">Expired</div>
              </div>
            </div>
            <div className="glass-card p-2 max-w-xs mx-auto mt-2">
              <div className="text-2xl font-bold text-primary text-center">{statusCounts.total}</div>
              <div className="text-xs text-muted-foreground text-center">Total Items</div>
            </div>
          </div>

          {/* Recent Actions */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2 gradient-text">Recent Activity</h3>
            <RecentActionsCard actions={recentActions} loading={historyLoading} />
          </div>

          {/* AI Recommendations */}
          {userId && (
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2 gradient-text">AI Insights</h3>
              <AIRecommendations userId={userId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(windowContent, windowElement);
};