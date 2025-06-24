
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
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-lg md:text-xl font-bold text-green-600">
              Food Prep Manager
            </h1>
            <nav className="flex space-x-1">
              <button
                onClick={() => onTabChange('inventory')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'inventory'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => onTabChange('meals')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'meals'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Meal Plans
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
