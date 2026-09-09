import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { 
  ArrowLeft, 
  Send, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Tag, 
  ShieldAlert, 
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../config/AuthContext';
import { AppsService } from '../services/api';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Textarea } from '../components/FormElements';

export const RequestAccess = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchApp = async () => {
      try {
        setLoading(true);
        const res = await AppsService.getMyApps(true);
        const target = (res.data.apps || []).find(a => String(a.id) === String(appId));
        if (target) {
          setApp(target);
        } else {
          setError('La aplicación solicitada no existe o no está disponible en este momento.');
        }
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la información de la aplicación.');
      } finally {
        setLoading(false);
      }
    };

    if (appId) {
      fetchApp();
    }
  }, [appId]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!app) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await AppsService.requestAccess(app.id, mensaje);
      setSuccessMessage(
        res.data.message ||
        `Tu solicitud para ${app.nombre} fue enviada a los administradores. Recibirás respuesta a la brevedad.`
      );
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al enviar la solicitud de acceso.');
    } finally {
      setSubmitting(false);
    }
  };

  // Color e icono
  const appColor = app?.color && app.color.trim().startsWith('#') ? app.color.trim() : '#0d2c5c';
  const isCustomImage = app?.icono && (app.icono.startsWith('data:image/') || app.icono.startsWith('http'));
  const LucideComp = app?.icono && Icons[app.icono] ? Icons[app.icono] : null;

  return (
    <Layout>
      <div className="animate-fade-in" style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Botón Volver */}
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            padding: '8px 0',
            marginBottom: '16px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={18} />
          <span>Volver al Tablero</span>
        </button>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px auto', color: 'var(--primary)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Cargando datos del sistema...</p>
          </div>
        ) : error && !app ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <AlertCircle size={48} style={{ color: 'var(--error)', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
              Aplicación no disponible
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>{error}</p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Ir al Inicio
            </Button>
          </div>
        ) : submitted ? (
          /* Estado de Éxito */
          <div className="card animate-pop-in" style={{ textAlign: 'center', padding: '40px 24px', borderTop: '4px solid var(--success)' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '12px' }}>
              ¡Solicitud Enviada con Éxito!
            </h2>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: '480px', margin: '0 auto 28px auto' }}>
              {successMessage}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Button variant="primary" onClick={() => navigate('/')}>
                Volver a Mis Aplicaciones
              </Button>
            </div>
          </div>
        ) : (
          /* Formulario de Solicitud */
          <div className="card" style={{ borderTop: `4px solid ${appColor}`, padding: '28px 24px' }}>
            {/* Cabecera con Icono y Nombre */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${appColor}18 0%, ${appColor}36 100%)`,
                  border: `2px solid ${appColor}`,
                  color: appColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${appColor}25`,
                  flexShrink: 0
                }}
              >
                {isCustomImage ? (
                  <img src={app.icono} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                ) : LucideComp ? (
                  <LucideComp size={30} />
                ) : (
                  <span style={{ fontWeight: 800, fontSize: '1.4rem', color: appColor }}>
                    {app.nombre ? app.nombre[0].toUpperCase() : 'DY'}
                  </span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    {app.nombre}
                  </h1>
                  <span className="badge badge-primary">
                    <Tag size={12} /> {app.categoria || 'General'}
                  </span>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  {app.descripcion || 'Sistema corporativo Don Yeyo.'}
                </p>
              </div>
            </div>

            {/* Banner Informativo de Permiso */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius)',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: 'var(--warning)',
                marginBottom: '20px'
              }}
            >
              <Lock size={20} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.86rem', color: 'var(--text)' }}>
                Actualmente tienes asignado este sistema en modo <strong>Sólo Ver</strong>. Completa este formulario para solicitar acceso operativo directo.
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(228, 5, 33, 0.08)',
                  border: '1px solid rgba(228, 5, 33, 0.25)',
                  color: 'var(--secondary)',
                  fontSize: '0.88rem',
                  marginBottom: '20px'
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Datos del Solicitante */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius)',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                marginBottom: '20px'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Datos del Solicitante
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.92rem' }}>
                  {user?.nombre || 'Colaborador Don Yeyo'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  &bull; {user?.email || 'email@donyeyo.com.ar'}
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)', marginBottom: '6px' }}>
                  Motivo o Justificación <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Opcional)</span>
                </label>
                <Textarea
                  placeholder="Ej: Necesito acceso para consultar stock y autorizar pedidos diarios de producción..."
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={4}
                  style={{ width: '100%' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  flexWrap: 'wrap'
                }}
              >
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate('/')}
                  disabled={submitting}
                  style={{ minWidth: '110px' }}
                >
                  Cancelar
                </Button>

                <Button
                  variant="primary"
                  type="submit"
                  icon={Send}
                  loading={submitting}
                  style={{ minWidth: '180px' }}
                >
                  Enviar Solicitud
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};
