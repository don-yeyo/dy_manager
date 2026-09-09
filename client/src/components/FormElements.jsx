import React from 'react';

export const Input = ({
  label,
  error,
  icon: Icon,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', display: 'flex' }}>
            <Icon size={18} />
          </div>
        )}
        <input
          id={inputId}
          style={{
            width: '100%',
            padding: Icon ? '10px 14px 10px 42px' : '10px 14px',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius)',
            border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
            background: 'var(--surface)',
            color: 'var(--text)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
          className={`dy-input ${className}`}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: '0.78rem', color: 'var(--error)', fontWeight: 500 }}>{error}</span>}
      {!error && helperText && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{helperText}</span>}
    </div>
  );
};

export const Select = ({
  label,
  error,
  options = [],
  id,
  className = '',
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label htmlFor={selectId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: '0.9rem',
          borderRadius: 'var(--radius)',
          border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
          background: 'var(--surface)',
          color: 'var(--text)',
          outline: 'none',
          cursor: 'pointer'
        }}
        className={`dy-select ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span style={{ fontSize: '0.78rem', color: 'var(--error)' }}>{error}</span>}
    </div>
  );
};

export const Textarea = ({
  label,
  error,
  id,
  className = '',
  rows = 3,
  ...props
}) => {
  const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label htmlFor={areaId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: '0.9rem',
          borderRadius: 'var(--radius)',
          border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
          background: 'var(--surface)',
          color: 'var(--text)',
          outline: 'none',
          resize: 'vertical'
        }}
        className={`dy-textarea ${className}`}
        {...props}
      />
      {error && <span style={{ fontSize: '0.78rem', color: 'var(--error)' }}>{error}</span>}
    </div>
  );
};
