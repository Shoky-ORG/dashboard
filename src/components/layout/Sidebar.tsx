import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { can } from '@/auth/permissions';
import { RoleBadge } from '@/components/ui/Badge';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Bell,
  UserCheck,
  LogOut,
  X,
} from 'lucide-react';
import './Sidebar.css';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      show: true,
    },
    {
      to: '/courses',
      label: 'Courses',
      icon: <BookOpen size={20} />,
      show: can('courses.view', { user }),
    },
    {
      to: '/users',
      label: 'Staff & Users',
      icon: <Users size={20} />,
      show: can('users.view', { user }),
    },
    {
      to: '/student-profiles',
      label: 'Student Profiles',
      icon: <GraduationCap size={20} />,
      show: can('students.view_all_profiles', { user }),
    },
    {
      to: '/notifications',
      label: 'Push Notifications',
      icon: <Bell size={20} />,
      show: can('notifications.send', { user }),
    },
    {
      to: '/profile',
      label: 'My Profile',
      icon: <UserCheck size={20} />,
      show: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`shoky-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <span className="logo-spark">⚡</span>
            <span className="logo-text">Shoky<span className="logo-accent">LMS</span></span>
          </div>
          <button className="mobile-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="user-avatar">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.fullName} />
            ) : (
              <span>{user.fullName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{user.fullName}</div>
            <div className="user-role-wrapper">
              <RoleBadge role={user.role.name} size="sm" />
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
