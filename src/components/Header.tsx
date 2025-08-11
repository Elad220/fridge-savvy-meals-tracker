import { User } from '@/types';

import { ThemeToggle } from '@/components/ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';


interface HeaderProps {
  user: User;
  onLogout: () => void;
  activeTab: 'inventory' | 'meals' | 'settings';
  onTabChange: (tab: 'inventory' | 'meals' | 'settings') => void;
}

export const Header = ({ user, onLogout, activeTab, onTabChange }: HeaderProps) => {
  return (
    <header className="glass-card border-b shadow-lg sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12 md:h-16">
          <div className="flex items-center space-x-2 md:space-x-4">
            <SidebarTrigger />
            <h1 className="text-lg md:text-xl font-bold text-green-600 cursor-pointer" onClick={() => onTabChange('inventory')}>
            Meal Tracker
            </h1>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            <span className="text-xs md:text-sm text-muted-foreground hidden sm:block">Welcome, {user.name}</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};