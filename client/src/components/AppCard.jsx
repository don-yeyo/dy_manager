import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { ExternalLink, ShieldCheck, Tag, Wifi } from 'lucide-react';
import { StatsService } from '../services/api';

export const AppCard = ({ app }) => {
  const [opening, setOpening] = useState(false);

  // Determinar cómo renderizar el icono (imagen base64, flat icon Lucide o fallback opcional)
  const renderIcon = () => {
    if (app.icono && (app.icono.startsWith('data:image/') || app.icono.startsWith('http'))) {
      return (
        <img
          src={app.icono}
          alt={app.nombre}
          style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px' }}
        />
      );
    }

    if (app.icono && Icons[app.icono]) {
      const LucideIcon = Icons[app.icono];
      return <LucideIcon size={24} />;
    }

    // Fallback elegante cuando no hay icono configurado (opcional)
    return (
      <span style={{ fontWeight: 800, fontSize: '1.2rem', color: app.color || 'var(--primary)' }}>
        {app.nombre ? app.nombre[0].toUpperCase() : 'DY'}
      </span>
    );
  };

  // Analizar la URL para mostrar badges informativos
  let urlInfo = { isHttps: false, hasPort: false, host: '' };
  try {
    const parsed = new URL(app.url);
    urlInfo.isHttps = parsed.protocol === 'https:';
    urlInfo.hasPort = !!parsed.port;
    urlInfo.host = parsed.hostname;
  } catch (_) {
    urlInfo.host = app.url;
  }

  const handleLaunch = async (e) => {
    e.preventDefault();
    setOpening(true);

    // Registrar estadística de acceso (fuego y olvido / sin frenar)
    try {
      StatsService.trackClick(app.id).catch(() => {});
    } catch (_) {}

    // Abrir enlace en nueva pestaña de forma segura
    window.open(app.url, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setOpening(false);
    }, 600);
  };

  return (
    <div
      className="card card-hover animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderTop: `4px solid ${app.color || 'var(--primary)'}`
      }}
    >
      <div>
        {/* Header de la Card */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${app.color || '#0d2c5c'}15 0%, ${app.color || '#0d2c5c'}30 100%)`,
              border: `1px solid ${app.color || '#0d2c5c'}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: app.color || 'var(--primary)'
            }}
          >
            {renderIcon()}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
              <Tag size={11} />
              {app.categoria || 'General'}
            </span>
            {app.origen_asignacion && (
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600
                }}
              >
                {app.origen_asignacion}
              </span>
            )}
          </div>
        </div>

        {/* Título y Descripción */}
        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.3 }}>
          {app.nombre}
        </h4>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45, minHeight: '38px', marginBottom: '16px' }}>
          {app.descripcion || 'Sin descripción disponible.'}
        </p>

        {/* Info técnica del enlace */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            marginBottom: '18px',
            padding: '6px 10px',
            background: 'var(--surface-hover)',
            borderRadius: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={app.url}
        >
          <Wifi size={13} color={urlInfo.isHttps ? 'var(--success)' : 'var(--warning)'} />
          <span style={{ fontWeight: 600, color: urlInfo.isHttps ? 'var(--success)' : 'var(--warning)' }}>
            {urlInfo.isHttps ? 'HTTPS' : 'HTTP'}
          </span>
          <span>•</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{urlInfo.host}</span>
          {urlInfo.hasPort && <span style={{ opacity: 0.7 }}>:{new URL(app.url).port}</span>}
        </div>
      </div>

      {/* Botón de Lanzamiento */}
      <button
        onClick={handleLaunch}
        disabled={opening}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '11px 16px',
          background: app.color || 'var(--primary)',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.88rem',
          borderRadius: 'var(--radius-pill)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease',
          opacity: opening ? 0.7 : 1
        }}
      >
        <ExternalLink size={16} />
        <span>{opening ? 'Abriendo sistema...' : 'Acceder al Sistema'}</span>
      </button>
    </div>
  );
};
