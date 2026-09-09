import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  User, 
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { AuditService } from '../services/api';
import { Button } from '../components/Button';
import { Select } from '../components/FormElements';
import { Modal } from '../components/Modal';

export const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filtros
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Modal Detalle JSON
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedTable) params.tabla = selectedTable;
      if (selectedOperation) params.operacion = selectedOperation;
      if (userFilter) params.usuario = userFilter;

      const res = await AuditService.getLogs(params);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedTable, selectedOperation]);

  const openDetail = (log) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const getBadgeForOp = (op) => {
    switch (op) {
      case 'INSERT':
        return <span className="badge badge-success">INSERT</span>;
      case 'UPDATE':
        return <span className="badge badge-warning">UPDATE</span>;
      case 'DELETE':
        return <span className="badge badge-danger">DELETE</span>;
      default:
        return <span className="badge">{op}</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            Registro de <span style={{ color: 'var(--secondary)' }}>Auditoría</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Trazabilidad inmutable generada automáticamente mediante TRIGGERS en MySQL sobre entidades críticas.
          </p>
        </div>

        <Button variant="outline" icon={RefreshCw} onClick={fetchAuditLogs} loading={loading}>
          Refrescar
        </Button>
      </div>

      {/* Filtros */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '16px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          marginBottom: '20px'
        }}
      >
        <div style={{ minWidth: '200px' }}>
          <Select
            label="Filtrar por Entidad / Tabla"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            options={[
              { label: 'Todas las tablas', value: '' },
              { label: 'usuarios', value: 'usuarios' },
              { label: 'grupos', value: 'grupos' },
              { label: 'usuarios_grupos', value: 'usuarios_grupos' },
              { label: 'aplicaciones', value: 'aplicaciones' },
              { label: 'asignaciones_usuarios', value: 'asignaciones_usuarios' },
              { label: 'asignaciones_grupos', value: 'asignaciones_grupos' }
            ]}
          />
        </div>

        <div style={{ minWidth: '160px' }}>
          <Select
            label="Operación SQL"
            value={selectedOperation}
            onChange={(e) => setSelectedOperation(e.target.value)}
            options={[
              { label: 'Todas las operaciones', value: '' },
              { label: 'INSERT (Creación)', value: 'INSERT' },
              { label: 'UPDATE (Modificación)', value: 'UPDATE' },
              { label: 'DELETE (Eliminación)', value: 'DELETE' }
            ]}
          />
        </div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
            Usuario Responsable
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Buscar por email..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                outline: 'none',
                fontSize: '0.88rem'
              }}
            />
            <Button variant="primary" size="sm" onClick={fetchAuditLogs}>
              Filtrar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla de Auditoría */}
      <div className="table-container">
        <table className="dy-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha y Hora</th>
              <th>Entidad / Tabla</th>
              <th>Operación</th>
              <th>ID Registro</th>
              <th>Usuario Responsable</th>
              <th style={{ textAlign: 'right' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                  Consultando registros de auditoría...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No hay registros de auditoría con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{log.id}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                      <Clock size={14} color="var(--text-muted)" />
                      <span>{new Date(log.fecha).toLocaleString('es-AR')}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Database size={14} color="var(--primary)" />
                      <span style={{ fontWeight: 600 }}>{log.tabla_afectada}</span>
                    </div>
                  </td>
                  <td>{getBadgeForOp(log.operacion)}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.registro_id}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <User size={14} color="var(--text-muted)" />
                      <span>{log.usuario_responsable || 'SISTEMA'}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => openDetail(log)}
                    >
                      Inspeccionar
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalle JSON (Diff Visual) */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detalle de Evento de Auditoría #${selectedLog?.id || ''}`}
        maxWidth="740px"
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '12px', background: 'var(--surface-hover)', borderRadius: 'var(--radius)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tabla:</span>
                <div style={{ fontWeight: 700 }}>{selectedLog.tabla_afectada}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Operación:</span>
                <div>{getBadgeForOp(selectedLog.operacion)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Responsable:</span>
                <div style={{ fontWeight: 600 }}>{selectedLog.usuario_responsable || 'SISTEMA'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedLog.operacion === 'UPDATE' ? '1fr 1fr' : '1fr', gap: '16px' }}>
              {selectedLog.datos_anteriores && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--error)', marginBottom: '8px' }}>
                    Datos Anteriores (OLD)
                  </h4>
                  <pre
                    style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      overflowX: 'auto',
                      maxHeight: '300px'
                    }}
                  >
                    {JSON.stringify(typeof selectedLog.datos_anteriores === 'string' ? JSON.parse(selectedLog.datos_anteriores) : selectedLog.datos_anteriores, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.datos_nuevos && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)', marginBottom: '8px' }}>
                    Datos Nuevos (NEW)
                  </h4>
                  <pre
                    style={{
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      overflowX: 'auto',
                      maxHeight: '300px'
                    }}
                  >
                    {JSON.stringify(typeof selectedLog.datos_nuevos === 'string' ? JSON.parse(selectedLog.datos_nuevos) : selectedLog.datos_nuevos, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
