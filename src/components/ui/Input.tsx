import React from 'react';
import clsx from 'clsx';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={clsx('shoky-input-group', error && 'has-error', className)}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <div className="input-wrapper">
        {leftIcon && <span className="input-icon left">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={clsx('shoky-input', leftIcon && 'has-left-icon', rightIcon && 'has-right-icon')}
          {...props}
        />
        {rightIcon && <span className="input-icon right">{rightIcon}</span>}
      </div>
      {error ? (
        <span className="input-error-msg">{error}</span>
      ) : helperText ? (
        <span className="input-helper-msg">{helperText}</span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
