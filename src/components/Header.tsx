
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  activeTab: 'inventory' | 'meals';
  onTabChange: (tab: 'inventory' | 'meals') => void;
}

export const Header = ({ user, onLogout, activeTab, onTabChange }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12 md:h-16">
          <div className="flex items-center space-x-4 md:space-x-8">
            <h1 className="text-base md:text-xl font-bold text-green-600">
              Food Prep Manager
            </h1>
            <nav className="flex space-x-1">
              <button
                onClick={() => onTabChange('inventory')}
                className={`px-2 md:px-4 py-1 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  activeTab === 'inventory'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => onTabChange('meals')}
                className={`px-2 md:px-4 py-1 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  activeTab === 'meals'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Meal Plans
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <span className="text-xs md:text-sm text-gray-600 hidden sm:block">Welcome, {user.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-900 text-xs md:text-sm h-7 md:h-8 px-2 md:px-3"
            >
              <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
