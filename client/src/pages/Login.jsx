import React from 'react';
import { useAuth } from '../config/AuthContext';
import { Button } from '../components/Button';
import { Building2, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';

export const Login = () => {
  const { login, loading, authError } = useAuth();
  const isMock = import.meta.env.VITE_MOCK_AUTH === 'true';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #0d2c5c 0%, #071933 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Círculos decorativos de fondo */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(228, 5, 33, 0.15) 0%, transparent 70%)',
          top: '-150px',
          right: '-150px',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
          bottom: '-200px',
          left: '-200px',
          pointerEvents: 'none'
        }}
      />

      <div
        className="animate-pop-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          padding: '40px 32px',
          position: 'relative',
          zIndex: 10,
          textAlign: 'center'
        }}
      >
        {/* Logo Corporativo */}
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px auto',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0d2c5c 0%, #1a4b8c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1.6rem',
            boxShadow: '0 6px 16px rgba(13, 44, 92, 0.3)'
          }}
        >
          DY
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d2c5c', marginBottom: '8px' }}>
          DON YEYO <span style={{ color: '#e40521' }}>MANAGER</span>
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '32px' }}>
          Portal centralizado de accesos a sistemas y herramientas de Don Yeyo S.A.
        </p>

        {authError && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius)',
              color: '#991b1b',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px',
              textAlign: 'left'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{authError}</span>
          </div>
        )}

        {isMock && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius)',
              color: '#92400e',
              fontSize: '0.78rem',
              marginBottom: '20px',
              textAlign: 'left'
            }}
          >
            <strong>⚡ Modo de Desarrollo Local (Mock) Activo:</strong> Ingreso simulado como{' '}
            <code>{import.meta.env.VITE_MOCK_AUTH_EMAIL || 'admin@donyeyo.com.ar'}</code>.
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={login}
          loading={loading}
          style={{
            width: '100%',
            height: '48px',
            backgroundColor: '#0d2c5c',
            color: '#ffffff'
          }}
        >
          <ShieldCheck size={20} />
          <span>{isMock ? 'Entrar con Mock Dev' : 'Iniciar Sesión con Microsoft 365'}</span>
          <ArrowRight size={18} />
        </Button>

        <div style={{ marginTop: '36px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Building2 size={14} />
            <span>Don Yeyo S.A. &bull; Acceso corporativo seguro</span>
          </div>
        </div>
      </div>
    </div>
  );
};
