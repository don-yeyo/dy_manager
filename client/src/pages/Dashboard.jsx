import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X,
  Shield, 
  AlertCircle, 
  RefreshCw, 
  SlidersHorizontal,
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  FolderPlus,
  MoveRight,
  Check,
  RotateCcw,
  Tag
} from 'lucide-react';
import { AppsService, UserConfigService } from '../services/api';
import { AppCard } from '../components/AppCard';
import { useAuth } from '../config/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input, Textarea } from '../components/FormElements';

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showAllAsAdmin, setShowAllAsAdmin] = useState(false);

  // Estados de Personalización del Tablero
  const [customSections, setCustomSections] = useState([]); // [{ id, titulo, appIds: [] }]
  const [hasCustomConfig, setHasCustomConfig] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [tempSections, setTempSections] = useState([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Estados de Solicitud de Acceso por Email
  const [requestAppModal, setRequestAppModal] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState(null);

  const fetchDashboardData = async (overrideAll = showAllAsAdmin) => {
    try {
      setLoading(true);
      setError(null);
      const [appsRes, configRes] = await Promise.all([
        AppsService.getMyApps(overrideAll),
        UserConfigService.getBoardConfig()
      ]);

      const loadedApps = appsRes.data.apps || [];
      setApps(loadedApps);

      if (configRes.data.hasCustomConfig && Array.isArray(configRes.data.secciones) && configRes.data.secciones.length > 0) {
        setCustomSections(configRes.data.secciones);
        setHasCustomConfig(true);
      } else {
        setCustomSections([]);
        setHasCustomConfig(false);
      }
    } catch (err) {
      console.error('[Dashboard fetchDashboardData Error]:', err);
      setError('No se pudieron cargar las aplicaciones o la configuración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(showAllAsAdmin);
  }, [showAllAsAdmin]);

  const handleOpenRequestAccess = (app) => {
    setRequestAppModal(app);
    setRequestMessage('');
    setRequestFeedback(null);
  };

  const handleSendAccessRequest = async () => {
    if (!requestAppModal) return;
    try {
      setSendingRequest(true);
      const res = await AppsService.requestAccess(requestAppModal.id, requestMessage);
      setRequestFeedback({ type: 'success', message: res.data.message });
      setTimeout(() => {
        setRequestAppModal(null);
        setRequestFeedback(null);
      }, 2500);
    } catch (err) {
      setRequestFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Error al enviar la solicitud.'
      });
    } finally {
      setSendingRequest(false);
    }
  };

  // Abrir modal de personalización
  const openCustomizeModal = () => {
    // Si no tiene secciones creadas, inicializar con una sección por defecto con todas sus apps
    if (customSections.length === 0) {
      setTempSections([
        {
          id: 'sec_' + Date.now(),
          titulo: 'Mis Herramientas',
          appIds: apps.map(a => a.id)
        }
      ]);
    } else {
      setTempSections(JSON.parse(JSON.stringify(customSections)));
    }
    setNewSectionTitle('');
    setIsCustomizeModalOpen(true);
  };

  // Agregar nueva sección
  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    setTempSections([
      ...tempSections,
      {
        id: 'sec_' + Date.now(),
        titulo: newSectionTitle.trim(),
        appIds: []
      }
    ]);
    setNewSectionTitle('');
  };

  // Eliminar sección
  const handleDeleteSection = (secId) => {
    setTempSections(tempSections.filter(s => s.id !== secId));
  };

  // Mover app hacia arriba o abajo en una sección
  const handleMoveApp = (secIndex, appIndex, direction) => {
    const updated = [...tempSections];
    const section = updated[secIndex];
    const targetIndex = direction === 'up' ? appIndex - 1 : appIndex + 1;

    if (targetIndex < 0 || targetIndex >= section.appIds.length) return;

    const temp = section.appIds[appIndex];
    section.appIds[appIndex] = section.appIds[targetIndex];
    section.appIds[targetIndex] = temp;

    setTempSections(updated);
  };

  // Mover app a otra sección
  const handleMoveAppToSection = (fromSecIndex, appIndex, toSecIndex) => {
    if (fromSecIndex === toSecIndex) return;
    const updated = [...tempSections];
    const appId = updated[fromSecIndex].appIds.splice(appIndex, 1)[0];
    updated[toSecIndex].appIds.push(appId);
    setTempSections(updated);
  };

  // Guardar configuración personalizada en base de datos
  const handleSaveBoardConfig = async () => {
    try {
      setSavingConfig(true);
      await UserConfigService.saveBoardConfig(tempSections);
      setCustomSections(tempSections);
      setHasCustomConfig(true);
      setIsCustomizeModalOpen(false);
    } catch (err) {
      alert('Error al guardar personalización: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingConfig(false);
    }
  };

  // Restablecer a vista predeterminada
  const handleResetBoardConfig = async () => {
    if (!window.confirm('¿Deseas restablecer el tablero a la vista estándar por categorías?')) return;
    try {
      setSavingConfig(true);
      await UserConfigService.saveBoardConfig([]);
      setCustomSections([]);
      setHasCustomConfig(false);
      setIsCustomizeModalOpen(false);
    } catch (err) {
      alert('Error al restablecer: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Filtrado reactivo para búsqueda
  const filterMatches = (app) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      app.nombre?.toLowerCase().includes(q) ||
      (app.descripcion && app.descripcion.toLowerCase().includes(q)) ||
      (app.categoria && app.categoria.toLowerCase().includes(q))
    );
  };

  // Mapeo rápido de apps por ID
  const appsById = new Map(apps.map(a => [a.id, a]));

  return (
    <Layout onCustomizeBoard={openCustomizeModal}>
      <div className="animate-fade-in">
        {/* Buscador de Aplicaciones Sticky (Línea posterior al Navbar, todo el ancho) */}
        <div className="dashboard-sticky-search">
          <div className="dashboard-search-bar">
            <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar aplicación o acceso directo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="dashboard-search-input-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="search-clear-button"
                title="Limpiar búsqueda"
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>



        {/* Estados: Loading o Error */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <p>Cargando tus accesos directos...</p>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '24px',
              background: 'var(--surface)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--radius)',
              color: 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <AlertCircle size={24} />
            <span>{error}</span>
          </div>
        ) : apps.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              color: 'var(--text-muted)'
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
              No tienes aplicaciones asignadas
            </h3>
            <p style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
              Comunícate con el Administrador para que asigne las herramientas necesarias a tu cuenta o grupo.
            </p>
          </div>
        ) : hasCustomConfig && customSections.length > 0 && !search.trim() ? (
          /* VISTA PERSONALIZADA: Si sólo hay 1 sección, se oculta el título según el requerimiento */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {customSections.map((sec) => {
              const secApps = sec.appIds
                .map(id => appsById.get(id))
                .filter(Boolean);

              if (secApps.length === 0) return null;

              const shouldShowTitle = customSections.length > 1;

              return (
                <section key={sec.id} className="animate-fade-in">
                  {shouldShowTitle && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderBottom: '2px solid var(--border)',
                        paddingBottom: '10px',
                        marginBottom: '16px'
                      }}
                    >
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                        {sec.titulo}
                      </h2>
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                        {secApps.length} {secApps.length === 1 ? 'app' : 'apps'}
                      </span>
                    </div>
                  )}

                  <div className="apps-grid-container">
                    {secApps.map((app) => (
                      <AppCard 
                        key={app.id} 
                        app={app} 
                        onRequestAccess={handleOpenRequestAccess}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Apps no clasificadas si existen */}
            {(() => {
              const allConfiguredIds = new Set(customSections.flatMap(s => s.appIds));
              const unclassifiedApps = apps.filter(a => !allConfiguredIds.has(a.id));

              if (unclassifiedApps.length === 0) return null;

              return (
                <section className="animate-fade-in">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      borderBottom: '2px solid var(--border)',
                      paddingBottom: '10px',
                      marginBottom: '16px'
                    }}
                  >
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                      Otras Aplicaciones
                    </h2>
                    <span className="badge" style={{ background: 'var(--surface-hover)', fontSize: '0.72rem' }}>
                      {unclassifiedApps.length}
                    </span>
                  </div>

                  <div className="apps-grid-container">
                    {unclassifiedApps.map((app) => (
                      <AppCard 
                        key={app.id} 
                        app={app} 
                        onRequestAccess={handleOpenRequestAccess}
                      />
                    ))}
                  </div>
                </section>
              );
            })()}
          </div>
        ) : (
          /* VISTA ESTÁNDAR (O con Búsqueda activa) */
          apps.filter(filterMatches).length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                color: 'var(--text-muted)'
              }}
            >
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                No se encontraron aplicaciones para "{search}"
              </p>
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--secondary)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Borrar búsqueda
              </button>
            </div>
          ) : (
            <div className="apps-grid-container">
              {apps.filter(filterMatches).map((app) => (
                <AppCard 
                  key={app.id} 
                  app={app} 
                  onRequestAccess={handleOpenRequestAccess}
                />
              ))}
            </div>
          )
        )}

      {/* Modal: Personalizar Tablero y Titulares */}
      <Modal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        title="Personalizar Distribución de tu Tablero"
        maxWidth="740px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Crea grupos bajo tus propios titulares, reordena los enlaces y organízalos a tu gusto. Esta distribución se guardará en tu cuenta y estará sincronizada en todos tus dispositivos.
          </p>

          {/* Formulario para agregar nueva sección */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Nuevo Titular de Grupo / Sección"
                placeholder="Ej: Operaciones Diarias, Mis Favoritos, Planta..."
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
              />
            </div>
            <Button variant="primary" icon={Plus} onClick={handleAddSection}>
              Crear Sección
            </Button>
          </div>

          {/* Lista de Secciones Configuradas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {tempSections.map((sec, secIdx) => (
              <div
                key={sec.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                  background: 'var(--surface-hover)'
                }}
              >
                {/* Header de la Sección */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={sec.titulo}
                    onChange={(e) => {
                      const updated = [...tempSections];
                      updated[secIdx].titulo = e.target.value;
                      setTempSections(updated);
                    }}
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px dashed var(--text-muted)',
                      color: 'var(--text)',
                      outline: 'none',
                      padding: '2px 4px'
                    }}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteSection(sec.id)}
                    title="Eliminar Sección"
                  />
                </div>

                {/* Lista de Apps en esta sección */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sec.appIds.map((appId, appIdx) => {
                    const app = appsById.get(appId);
                    if (!app) return null;

                    return (
                      <div
                        key={appId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'var(--surface)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{app.nombre}</span>
                          <span className="badge" style={{ fontSize: '0.65rem' }}>{app.categoria}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {/* Subir */}
                          <button
                            type="button"
                            disabled={appIdx === 0}
                            onClick={() => handleMoveApp(secIdx, appIdx, 'up')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: appIdx === 0 ? 'not-allowed' : 'pointer',
                              opacity: appIdx === 0 ? 0.3 : 1,
                              color: 'var(--text)'
                            }}
                          >
                            <ArrowUp size={16} />
                          </button>

                          {/* Bajar */}
                          <button
                            type="button"
                            disabled={appIdx === sec.appIds.length - 1}
                            onClick={() => handleMoveApp(secIdx, appIdx, 'down')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: appIdx === sec.appIds.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: appIdx === sec.appIds.length - 1 ? 0.3 : 1,
                              color: 'var(--text)'
                            }}
                          >
                            <ArrowDown size={16} />
                          </button>

                          {/* Selector para mover a otra sección si hay más de 1 */}
                          {tempSections.length > 1 && (
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value !== '') {
                                  handleMoveAppToSection(secIdx, appIdx, parseInt(e.target.value, 10));
                                }
                              }}
                              style={{
                                fontSize: '0.75rem',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                border: '1px solid var(--border)',
                                background: 'var(--surface)',
                                color: 'var(--text)'
                              }}
                            >
                              <option value="">Mover a...</option>
                              {tempSections.map((s, idx) => (
                                idx !== secIdx ? <option key={s.id} value={idx}>{s.titulo}</option> : null
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {sec.appIds.length === 0 && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Esta sección no tiene aplicaciones.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer del Modal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={handleResetBoardConfig}
            >
              Restablecer Predeterminado
            </Button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="outline" onClick={() => setIsCustomizeModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" icon={Check} onClick={handleSaveBoardConfig} loading={savingConfig}>
                Guardar Distribución
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal: Solicitar Acceso a una Aplicación */}
      <Modal
        isOpen={!!requestAppModal}
        onClose={() => {
          if (!sendingRequest) setRequestAppModal(null);
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--secondary)' }}>Solicitar Acceso a Aplicación</span>
          </div>
        }
        maxWidth="500px"
      >
        {requestAppModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requestFeedback && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius)',
                  backgroundColor: requestFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${requestFeedback.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
                  color: requestFeedback.type === 'success' ? 'var(--success)' : 'var(--error)',
                  fontSize: '0.88rem'
                }}
              >
                {requestFeedback.message}
              </div>
            )}

            {!requestFeedback || requestFeedback.type === 'error' ? (
              <>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  Esta aplicación está asignada a tu perfil en modo <strong>Sólo Ver</strong>. Podés enviar una solicitud a los administradores para que habiliten tu acceso directo a:
                </p>

                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                    {requestAppModal.nombre}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Categoría: <strong>{requestAppModal.categoria || 'General'}</strong>
                  </div>
                </div>

                <Textarea
                  label="Mensaje o Justificación (Opcional)"
                  placeholder="Ej: Necesito acceso para realizar controles de stock de planta..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={3}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <Button
                    variant="outline"
                    disabled={sendingRequest}
                    onClick={() => setRequestAppModal(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    icon={Send}
                    loading={sendingRequest}
                    onClick={handleSendAccessRequest}
                  >
                    Enviar Solicitud
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </Modal>
      </div>
    </Layout>
  );
};
