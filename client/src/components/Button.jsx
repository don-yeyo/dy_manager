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

  const hasChildren = Boolean(children);

  const getSizeStyles = () => {
    if (!hasChildren) {
      switch (size) {
        case 'sm':
          return { width: '32px', height: '32px', padding: 0, fontSize: '0.8rem', borderRadius: 'var(--radius-pill)', flexShrink: 0 };
        case 'lg':
          return { width: '44px', height: '44px', padding: 0, fontSize: '1rem', borderRadius: 'var(--radius-pill)', flexShrink: 0 };
        case 'md':
        default:
          return { width: '38px', height: '38px', padding: 0, fontSize: '0.9rem', borderRadius: 'var(--radius-pill)', flexShrink: 0 };
      }
    }

    switch (size) {
      case 'sm':
        return { padding: '5px 12px', fontSize: '0.78rem', borderRadius: 'var(--radius-pill)' };
      case 'lg':
        return { padding: '12px 24px', fontSize: '1rem', borderRadius: 'var(--radius-pill)' };
      case 'md':
      default:
        return { padding: '8px 16px', fontSize: '0.85rem', borderRadius: 'var(--radius-pill)' };
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
        gap: hasChildren ? '6px' : 0,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: variant === 'primary' ? 'var(--shadow-sm)' : 'none',
        lineHeight: 1,
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style
      }}
      className={`dy-button ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" /> : Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {hasChildren && <span>{children}</span>}
    </button>
  );
};

