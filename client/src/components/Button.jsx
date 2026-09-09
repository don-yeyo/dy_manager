import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'outline', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  icon: Icon,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  style = {},
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'var(--btn-primary-bg)',
          color: 'var(--btn-primary-text)',
          border: '1px solid transparent',
        };
      case 'secondary':
        return {
          background: 'var(--secondary)',
          color: '#ffffff',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          background: 'var(--error)',
          color: '#ffffff',
          border: '1px solid transparent',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--text-muted)',
          border: '1px solid transparent',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '6px 14px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)' };
      case 'lg':
        return { padding: '14px 28px', fontSize: '1rem', borderRadius: 'var(--radius-pill)' };
      case 'md':
      default:
        return { padding: '10px 20px', fontSize: '0.9rem', borderRadius: 'var(--radius-pill)' };
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: variant === 'primary' ? 'var(--shadow-sm)' : 'none',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style
      }}
      className={`dy-button ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon && <Icon size={16} />}
      <span>{children}</span>
    </button>
  );
};
