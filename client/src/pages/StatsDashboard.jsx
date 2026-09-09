import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Layers, 
  Clock, 
  ExternalLink,
  RefreshCw,
  Calendar,
  Globe
} from 'lucide-react';
import { StatsService } from '../services/api';
import { Button } from '../components/Button';

export const StatsDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, logsRes] = await Promise.all([
        StatsService.getSummary(),
        StatsService.getLogs({ limit: 30 })
      ]);
      setSummary(sumRes.data);
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalClics = summary?.totalAccesos || 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            Estadísticas de <span style={{ color: 'var(--secondary)' }}>Accesos</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Métricas de uso e ingresos a los enlaces del portal Don Yeyo Manager (solo lectura).
          </p>
        </div>

        <Button variant="outline" icon={RefreshCw} onClick={fetchData} loading={loading}>
          Actualizar Datos
        </Button>
      </div>

      {/* Tarjetas KPI */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '28px'
        }}
      >
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(13, 44, 92, 0.1)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TrendingUp size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total de Ingresos
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)' }}>
              {summary?.totalAccesos || 0}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Calendar size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Ingresos de Hoy
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)' }}>
              {summary?.accesosHoy || 0}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(228, 5, 33, 0.1)',
              color: 'var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Layers size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              App Más Visitada
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
              {summary?.topApps?.[0]?.nombre || 'Sin datos'}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos / Rankings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Ranking de Aplicaciones */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--primary)" />
            <span>Ranking por Aplicación</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {summary?.topApps?.map((app) => {
              const clics = app.total_clics || 0;
              const percent = totalClics > 0 ? Math.round((clics / totalClics) * 100) : 0;
              return (
                <div key={app.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{app.nombre}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <strong>{clics}</strong> clics ({percent}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: app.color || 'var(--primary)',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {(!summary?.topApps || summary.topApps.length === 0) && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay accesos registrados aún.</p>
            )}
          </div>
        </div>

        {/* Top Usuarios Activos */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--primary)" />
            <span>Usuarios Más Activos</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {summary?.topUsers?.map((u, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface-hover)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email_usuario}</div>
                </div>
                <span className="badge badge-primary">{u.total_accesos} accesos</span>
              </div>
            ))}
            {(!summary?.topUsers || summary.topUsers.length === 0) && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay usuarios activos registrados aún.</p>
            )}
          </div>
        </div>
      </div>

      {/* Historial Reciente de Clics */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--primary)" />
          <span>Últimos Ingresos Registrados</span>
        </h3>

        <div className="table-container">
          <table className="dy-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Aplicación</th>
                <th>Usuario</th>
                <th>IP Origen</th>
                <th>Navegador / Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No se han registrado aperturas de enlaces aún.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.fecha_acceso).toLocaleString('es-AR')}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{log.app_nombre}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{log.usuario_nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.email_usuario}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                        {log.ip_origen || '127.0.0.1'}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={log.user_agent}
                      >
                        {log.user_agent || 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
