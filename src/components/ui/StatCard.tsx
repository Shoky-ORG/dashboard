import React from 'react';
import { Card } from './Card';
import './StatCard.css';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  colorTheme?: 'primary' | 'secondary' | 'info' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendType = 'positive',
  colorTheme = 'primary',
}) => {
  return (
    <Card className={`stat-card theme-${colorTheme}`}>
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {icon && <div className="stat-icon-wrapper">{icon}</div>}
      </div>
      <div className="stat-value">{value}</div>
      {trend && (
        <div className={`stat-trend trend-${trendType}`}>
          {trend}
        </div>
      )}
    </Card>
  );
};
