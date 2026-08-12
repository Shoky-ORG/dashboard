import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import './Toast.css';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const icons = {
    success: <CheckCircle2 size={18} className="toast-icon success" />,
    error: <AlertCircle size={18} className="toast-icon error" />,
    info: <Info size={18} className="toast-icon info" />,
  };

  return (
    <div className={`shoky-toast toast-${type}`}>
      {icons[type]}
      <span className="toast-msg">{message}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};
