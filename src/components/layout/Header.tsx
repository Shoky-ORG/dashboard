import React from 'react';
import { useAuth } from '@/auth/AuthContext';
import { DepartmentBadge } from '@/components/ui/Badge';
import { Menu, ShieldCheck } from 'lucide-react';
import './Header.css';

export interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title = 'Staff Dashboard' }) => {
  const { user } = useAuth();

  return (
    <header className="shoky-header">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        <div className="api-status-badge">
          <span className="pulse-dot" />
          <span>v1.apishoky.tech</span>
        </div>

        {user?.department && (
          <DepartmentBadge department={user.department} size="md" />
        )}

        <div className="user-quick-profile">
          <ShieldCheck size={18} className="shield-icon" />
          <span className="user-role-label">{user?.role?.name?.replace('_', ' ').toUpperCase()}</span>
        </div>
      </div>
    </header>
  );
};
