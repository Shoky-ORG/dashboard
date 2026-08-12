import React from 'react';
import clsx from 'clsx';
import './Tabs.css';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={clsx('shoky-tabs-bar', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            className={clsx('tab-item', isActive && 'active')}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
            {tab.badge !== undefined && <span className="tab-badge">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
};
