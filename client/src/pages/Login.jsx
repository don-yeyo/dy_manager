import React from 'react';
import { useAuth } from '../config/AuthContext';
import { useTheme } from '../config/ThemeContext';
import { Sun, Moon, AlertTriangle, Building2 } from 'lucide-react';
import logo from '../assets/logo-don-yeyo-png-sin-fondo.png';
import microsoftLogo from '../assets/microsoft-logo.png';

export const Login = () => {
  const { login, loading, authError } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const isMock = import.meta.env.VITE_MOCK_AUTH === 'true';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--background)',
        position: 'relative',
        padding: '20px'
      }}
    >
      <div
        className="glass login-container animate-pop-in"
        style={{
          position: 'relative',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          zIndex: 10
        }}
      >
        {/* Botón de cambio de tema en el login (arriba a la derecha) */}
        <button
          onClick={toggleTheme}
          className="mode-toggle"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#0d2c5c" />}
        </button>

        {/* Logo oficial Don Yeyo */}
        <img
          src={logo}
          alt="Don Yeyo"
          style={{
            height: '130px',
            marginBottom: '16px',
            objectFit: 'contain',
            filter: isDark ? 'brightness(1.05)' : 'none'
          }}
        />

        {/* Título de la aplicación */}
        <h1 style={{ fontWeight: 800, color: 'var(--header-text)', margin: 0, fontSize: '1.75rem' }}>
          Don Yeyo <span style={{ color: 'var(--secondary)' }}>Manager</span>
        </h1>

        <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '14px 0 28px 0', fontSize: '1rem', lineHeight: 1.5 }}>
          Bienvenido. Inicie sesión con su cuenta corporativa registrada en la empresa para acceder a los sistemas autorizados.
        </p>

        {authError && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--radius)',
              color: 'var(--error)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{authError}</span>
          </div>
        )}

        {/* Opciones de Login */}
        <div className="login-options">
          <button
            type="button"
            className="btn-microsoft"
            onClick={login}
            disabled={loading}
          >
            <img
              src={microsoftLogo}
              alt="Microsoft"
              style={{ height: '26px', width: '26px', objectFit: 'contain' }}
            />
            <span>{isMock ? 'Inicia sesión con Microsoft (Mock)' : 'Inicia sesión con Microsoft'}</span>
          </button>
        </div>

        {isMock && (
          <div
            style={{
              marginTop: '20px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--warning)',
              fontSize: '0.75rem',
              maxWidth: '340px'
            }}
          >
            ⚡ Modo Mock activo: entra como <strong>{import.meta.env.VITE_MOCK_AUTH_EMAIL || 'admin@donyeyo.com.ar'}</strong>
          </div>
        )}

        <div style={{ marginTop: '28px', borderTop: '1px solid var(--border)', paddingTop: '16px', width: '100%' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Building2 size={13} />
            <span>Don Yeyo S.A. &bull; Acceso corporativo seguro</span>
          </div>
        </div>
      </div>
    </div>
  );
};
