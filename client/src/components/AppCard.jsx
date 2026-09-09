import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { ExternalLink, ShieldCheck, Tag, Wifi, Lock, Send, Check } from 'lucide-react';
import { StatsService } from '../services/api';

export const AppCard = ({ app, onRequestAccess }) => {
  const [opening, setOpening] = useState(false);

  // Determinar si puede acceder o sólo ver
  const canAccess = app.puede_acceder !== false && app.puede_acceder !== 0;

  // Renderizado del Icono
  const renderIcon = (size = 24, imgSize = '28px') => {
    if (app.icono && (app.icono.startsWith('data:image/') || app.icono.startsWith('http'))) {
      return (
        <img
          src={app.icono}
          alt={app.nombre}
          style={{ width: imgSize, height: imgSize, objectFit: 'contain', borderRadius: '4px' }}
        />
      );
    }

    if (app.icono && Icons[app.icono]) {
      const LucideIcon = Icons[app.icono];
      return <LucideIcon size={size} />;
    }

    return (
      <span style={{ fontWeight: 800, fontSize: size > 24 ? '1.4rem' : '1.1rem', color: app.color || 'var(--primary)' }}>
        {app.nombre ? app.nombre[0].toUpperCase() : 'DY'}
      </span>
    );
  };

  // Analizar la URL
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
    if (!canAccess) {
      if (onRequestAccess) onRequestAccess(app);
      return;
    }

    setOpening(true);
    try {
      StatsService.trackClick(app.id).catch(() => {});
    } catch (_) {}

    window.open(app.url, '_blank', 'noopener,noreferrer');
    setTimeout(() => {
      setOpening(false);
    }, 600);
  };

  return (
    <>
      {/* 1. TARJETA EN MODO DESKTOP (Completa con descripción y badges) */}
      <div
        className="card card-hover animate-fade-in app-card-desktop"
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
              {renderIcon(24, '28px')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                <Tag size={11} />
                {app.categoria || 'General'}
              </span>
              {app.requiere_seguridad === 0 ? (
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  Pública
                </span>
              ) : app.origen_asignacion && app.origen_asignacion !== 'Directa' ? (
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                  }}
                >
                  {app.origen_asignacion === 'Directa y Grupo' ? 'Grupo' : app.origen_asignacion}
                </span>
              ) : null}
            </div>
          </div>

          {/* Título y Descripción */}
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.3 }}>
            {app.nombre}
          </h4>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45, minHeight: '38px', marginBottom: '20px' }}>
            {app.descripcion || 'Sin descripción disponible.'}
          </p>
        </div>

        {/* Botón de Lanzamiento / Solicitar Acceso */}
        {canAccess ? (
          <button
            onClick={handleLaunch}
            disabled={opening}
            title={app.url}
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
            <span>{opening ? 'Abriendo...' : 'Acceder'}</span>
          </button>
        ) : (
          <button
            onClick={() => onRequestAccess && onRequestAccess(app)}
            title={app.url}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 16px',
              background: 'transparent',
              color: 'var(--secondary)',
              border: '1px solid var(--secondary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Lock size={15} />
            <span>Solicitar Acceso</span>
          </button>
        )}
      </div>

      {/* 2. BOTONERA EN MODO MOBILE (Estilo Apps de Smartphone) */}
      <div
        className="app-button-mobile animate-fade-in"
        onClick={handleLaunch}
        title={app.url}
        style={{
          display: 'none', // Controlado por media query en CSS
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'var(--surface)',
          borderRadius: '20px',
          padding: '16px 12px 14px 12px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}
      >
        {/* Indicador de permiso solo_ver o pública */}
        {!canAccess && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--secondary)',
              borderRadius: '50%',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Sólo ver - Toca para solicitar acceso"
          >
            <Lock size={13} />
          </div>
        )}

        {/* Icono Redondeado estilo Smartphone App Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${app.color || '#0d2c5c'}20 0%, ${app.color || '#0d2c5c'}35 100%)`,
            border: `1px solid ${app.color || '#0d2c5c'}45`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: app.color || 'var(--primary)',
            marginBottom: '10px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
          }}
        >
          {renderIcon(28, '34px')}
        </div>

        {/* Nombre de la aplicación */}
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.85rem',
            color: 'var(--text)',
            lineHeight: 1.25,
            maxHeight: '2.5em',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginBottom: '6px'
          }}
        >
          {app.nombre}
        </div>

        {/* Subtítulo / Categoría o Estado */}
        <span
          style={{
            fontSize: '0.68rem',
            color: canAccess ? 'var(--text-muted)' : 'var(--secondary)',
            fontWeight: 600
          }}
        >
          {canAccess ? (app.categoria || 'General') : 'Solicitar Acceso'}
        </span>
      </div>
    </>
  );
};
