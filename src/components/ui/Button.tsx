import React from 'react';
import clsx from 'clsx';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={clsx('shoky-btn', `btn-${variant}`, `btn-${size}`, isLoading && 'btn-loading', className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="btn-spinner" />
      ) : (
        <>
          {leftIcon && <span className="btn-icon left">{leftIcon}</span>}
          <span className="btn-label">{children}</span>
          {rightIcon && <span className="btn-icon right">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
