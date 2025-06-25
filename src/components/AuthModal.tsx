// This component has been replaced by the dedicated Auth page
// Keeping file to avoid import errors, but it's no longer used

import { User } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
}

export const AuthModal = ({ isOpen, onClose, onAuthenticated }: AuthModalProps) => {
  return null;
};
