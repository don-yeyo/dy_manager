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
  const [unassignedFilter, setUnassignedFilter] = useState('');
  const [selectedUnassignedAppIds, setSelectedUnassignedAppIds] = useState([]);
  const [bulkTargetSection, setBulkTargetSection] = useState('');
  const [selectedSectionAppIds, setSelectedSectionAppIds] = useState({}); // { [secId]: [appId1, appId2] }
  const [sectionBulkTargets, setSectionBulkTargets] = useState({}); // { [secId]: targetValue }
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
    // Si no tiene secciones creadas, inicializar vacío para que todas las apps aparezcan en "Otras Aplicaciones (Sin Agrupar)"
    if (customSections.length === 0) {
      setTempSections([]);
    } else {
      setTempSections(JSON.parse(JSON.stringify(customSections)));
    }
    setNewSectionTitle('');
    setUnassignedFilter('');
    setSelectedUnassignedAppIds([]);
    setSelectedSectionAppIds({});
    setSectionBulkTargets({});
    setBulkTargetSection('');
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
    setSelectedSectionAppIds(prev => {
      const copy = { ...prev };
      delete copy[secId];
      return copy;
    });
    setSectionBulkTargets(prev => {
      const copy = { ...prev };
      delete copy[secId];
      return copy;
    });
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
    const fromSec = updated[fromSecIndex];
    const appId = fromSec.appIds.splice(appIndex, 1)[0];
    updated[toSecIndex].appIds.push(appId);
    setTempSections(updated);
    setSelectedSectionAppIds(prev => ({
      ...prev,
      [fromSec.id]: (prev[fromSec.id] || []).filter(id => id !== appId)
    }));
  };

  // Alternar selección individual en una sección
  const handleToggleSelectInSection = (secId, appId) => {
    setSelectedSectionAppIds(prev => {
      const current = prev[secId] || [];
      const updated = current.includes(appId)
        ? current.filter(id => id !== appId)
        : [...current, appId];
      return { ...prev, [secId]: updated };
    });
  };

  // Alternar selección de todas las apps de una sección
  const handleToggleSelectAllInSection = (secId, appIds) => {
    setSelectedSectionAppIds(prev => {
      const current = prev[secId] || [];
      const allSelected = appIds.length > 0 && appIds.every(id => current.includes(id));
      return {
        ...prev,
        [secId]: allSelected ? [] : [...appIds]
      };
    });
  };

  // Mover selección masiva desde una sección a otra sección o desagrupar
  const handleBulkMoveFromSection = (fromSecIndex, targetVal) => {
    if (!targetVal) return;
    const sec = tempSections[fromSecIndex];
    if (!sec) return;
    const selectedIds = selectedSectionAppIds[sec.id] || [];
    if (selectedIds.length === 0) return;

    const updated = [...tempSections];
    const selectedSet = new Set(selectedIds);

    // Remover las seleccionadas de la sección origen
    updated[fromSecIndex].appIds = updated[fromSecIndex].appIds.filter(id => !selectedSet.has(id));

    // Si el destino es otra sección (índice numérico)
    if (targetVal !== '__unassign__') {
      const toSecIndex = parseInt(targetVal, 10);
      if (toSecIndex >= 0 && toSecIndex < updated.length && toSecIndex !== fromSecIndex) {
        const destSet = new Set(updated[toSecIndex].appIds);
        for (const id of selectedIds) {
          if (!destSet.has(id)) {
            updated[toSecIndex].appIds.push(id);
            destSet.add(id);
          }
        }
      }
    }

    setTempSections(updated);
    setSelectedSectionAppIds(prev => ({ ...prev, [sec.id]: [] }));
    setSectionBulkTargets(prev => ({ ...prev, [sec.id]: '' }));
  };

  // Asignar una app no agrupada a una sección
  const handleAssignAppToSection = (appId, targetSecIndex) => {
    if (targetSecIndex < 0 || targetSecIndex >= tempSections.length) return;
    const updated = [...tempSections];
    if (!updated[targetSecIndex].appIds.includes(appId)) {
      updated[targetSecIndex].appIds.push(appId);
    }
    // Si estaba seleccionada, deseleccionarla
    setSelectedUnassignedAppIds(prev => prev.filter(id => id !== appId));
    setTempSections(updated);
  };

  // Asignar todas las apps no agrupadas a una sección
  const handleAssignAllToSection = (targetSecIndex, appIdsToAssign) => {
    if (targetSecIndex < 0 || targetSecIndex >= tempSections.length) return;
    const updated = [...tempSections];
    const currentSet = new Set(updated[targetSecIndex].appIds);
    for (const id of appIdsToAssign) {
      if (!currentSet.has(id)) {
        updated[targetSecIndex].appIds.push(id);
        currentSet.add(id);
      }
    }
    setSelectedUnassignedAppIds([]);
    setTempSections(updated);
  };

  // Alternar selección individual de app en Otras Aplicaciones
  const handleToggleSelectUnassigned = (appId) => {
    setSelectedUnassignedAppIds(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  // Alternar selección de todas las apps visibles en Otras Aplicaciones
  const handleToggleSelectAllUnassigned = (appIds) => {
    const allSelected = appIds.length > 0 && appIds.every(id => selectedUnassignedAppIds.includes(id));
    if (allSelected) {
      const setVisible = new Set(appIds);
      setSelectedUnassignedAppIds(prev => prev.filter(id => !setVisible.has(id)));
    } else {
      setSelectedUnassignedAppIds(prev => Array.from(new Set([...prev, ...appIds])));
    }
  };

  // Aplicar acción masiva de mover selección a una sección destino
  const handleApplyBulkMoveUnassigned = (targetSecIdx) => {
    if (targetSecIdx === '' || isNaN(targetSecIdx)) return;
    const idx = parseInt(targetSecIdx, 10);
    if (idx < 0 || idx >= tempSections.length) return;
    if (selectedUnassignedAppIds.length === 0) return;

    const updated = [...tempSections];
    const currentSet = new Set(updated[idx].appIds);
    for (const id of selectedUnassignedAppIds) {
      if (!currentSet.has(id)) {
        updated[idx].appIds.push(id);
        currentSet.add(id);
      }
    }
    setTempSections(updated);
    setSelectedUnassignedAppIds([]);
    setBulkTargetSection('');
  };

  // Quitar una app de una sección (vuelve automáticamente a "Otras Aplicaciones")
  const handleUnassignApp = (secIndex, appIndex) => {
    const updated = [...tempSections];
    const sec = updated[secIndex];
    const [removedId] = sec.appIds.splice(appIndex, 1);
    setTempSections(updated);
    setSelectedSectionAppIds(prev => ({
      ...prev,
      [sec.id]: (prev[sec.id] || []).filter(id => id !== removedId)
    }));
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
                    <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                      {unclassifiedApps.length} {unclassifiedApps.length === 1 ? 'app' : 'apps'}
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
        maxWidth="780px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
            Organiza tus accesos en secciones personalizadas o marca varias casillas para mover aplicaciones en bloque.
          </p>

          {/* Formulario para agregar nueva sección */}
          <div className="customize-new-section-row" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Nuevo Titular de Grupo / Sección"
                placeholder="Ej: Operaciones Diarias, Mis Favoritos, Planta..."
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
              />
            </div>
            <Button variant="primary" icon={Plus} onClick={handleAddSection} style={{ whiteSpace: 'nowrap' }}>
              Crear Sección
            </Button>
          </div>

          {/* Ayuda orientativa si aún no tiene secciones creadas */}
          {tempSections.length === 0 && (
            <div style={{ padding: '8px 12px', background: 'rgba(13, 44, 92, 0.05)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              💡 <strong>Configura tu primera sección:</strong> Escribe un nombre arriba (ej: <em>Favoritos</em>, <em>Sistemas</em>) y pulsa en <strong>Crear Sección</strong>. Luego podrás marcar casillas para mover aplicaciones masivamente.
            </div>
          )}

          {/* Lista de Secciones Configuradas y Bloque de Otras Aplicaciones */}
          {(() => {
            const assignedAppIds = new Set(tempSections.flatMap(s => s.appIds));
            const unassignedApps = apps.filter(a => !assignedAppIds.has(a.id));
            const filteredUnassignedApps = unassignedApps.filter(app => {
              if (!unassignedFilter.trim()) return true;
              const q = unassignedFilter.toLowerCase().trim();
              return (
                app.nombre?.toLowerCase().includes(q) ||
                (app.categoria && app.categoria.toLowerCase().includes(q))
              );
            });

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Bloque: Otras Aplicaciones (Sin Agrupar) */}
                {unassignedApps.length > 0 && (
                  <div
                    style={{
                      border: '2px dashed var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '12px',
                      background: 'var(--surface-hover)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                          Otras Aplicaciones (Sin Agrupar)
                        </h3>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                          {unassignedApps.length} {unassignedApps.length === 1 ? 'app' : 'apps'}
                        </span>
                      </div>

                      {tempSections.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mover todas ({unassignedApps.length}) a:</span>
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value !== '') {
                                handleAssignAllToSection(parseInt(e.target.value, 10), unassignedApps.map(a => a.id));
                              }
                            }}
                            style={{
                              fontSize: '0.72rem',
                              padding: '4px 6px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                              color: 'var(--text)',
                              fontWeight: 600
                            }}
                          >
                            <option value="">Seleccionar sección...</option>
                            {tempSections.map((s, idx) => (
                              <option key={s.id} value={idx}>{s.titulo}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Barra de Filtro y Checkbox Seleccionar Todo */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {filteredUnassignedApps.length > 0 && (
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: filteredUnassignedApps.every(a => selectedUnassignedAppIds.includes(a.id)) ? 'var(--primary)' : 'var(--text-muted)',
                            userSelect: 'none'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={filteredUnassignedApps.length > 0 && filteredUnassignedApps.every(a => selectedUnassignedAppIds.includes(a.id))}
                            onChange={() => handleToggleSelectAllUnassigned(filteredUnassignedApps.map(a => a.id))}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                          <span>
                            {filteredUnassignedApps.every(a => selectedUnassignedAppIds.includes(a.id))
                              ? 'Deseleccionar todas'
                              : `Seleccionar todas (${filteredUnassignedApps.length})`}
                          </span>
                        </label>
                      )}

                      {unassignedApps.length > 5 && (
                        <div style={{ flex: 1, minWidth: '140px', maxWidth: '240px' }}>
                          <input
                            type="text"
                            placeholder="Buscar en apps sin agrupar..."
                            value={unassignedFilter}
                            onChange={(e) => setUnassignedFilter(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                              color: 'var(--text)'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* BARRA DE ACCIÓN MASIVA: Sticky y compacta */}
                    {selectedUnassignedAppIds.length > 0 && (
                      <div
                        className="customize-bulk-bar-mobile"
                        style={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '6px 12px',
                          background: 'var(--surface)',
                          border: '1.5px solid var(--primary)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(13, 44, 92, 0.12)',
                          marginBottom: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {selectedUnassignedAppIds.length} {selectedUnassignedAppIds.length === 1 ? 'app seleccionada' : 'apps seleccionadas'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedUnassignedAppIds([])}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            Limpiar
                          </button>
                        </div>

                        {tempSections.length > 0 ? (
                          <div className="bulk-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600 }}>
                              Mover a:
                            </span>
                            <select
                              value={bulkTargetSection}
                              onChange={(e) => setBulkTargetSection(e.target.value)}
                              style={{
                                fontSize: '0.78rem',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                background: 'var(--surface)',
                                color: 'var(--text)',
                                fontWeight: 600,
                                minWidth: '130px'
                              }}
                            >
                              <option value="">Elegir sección destino...</option>
                              {tempSections.map((s, idx) => (
                                <option key={s.id} value={idx}>{s.titulo}</option>
                              ))}
                            </select>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={bulkTargetSection === ''}
                              onClick={() => handleApplyBulkMoveUnassigned(bulkTargetSection)}
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            >
                              Mover Selección
                            </Button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Crea una sección arriba para mover las seleccionadas
                          </span>
                        )}
                      </div>
                    )}

                    {/* Lista con scroll de aplicaciones no agrupadas: Altura generosa y dinámica */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        maxHeight: 'clamp(280px, 48vh, 500px)',
                        overflowY: 'auto',
                        paddingRight: '4px'
                      }}
                    >
                      {filteredUnassignedApps.map((app) => {
                        const isSelected = selectedUnassignedAppIds.includes(app.id);
                        return (
                          <div
                            key={app.id}
                            className="customize-app-row"
                            onClick={() => handleToggleSelectUnassigned(app.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              background: isSelected ? 'rgba(13, 44, 92, 0.08)' : 'var(--surface)',
                              borderRadius: '8px',
                              border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                              gap: '6px',
                              cursor: 'pointer',
                              userSelect: 'none',
                              transition: 'background-color 0.15s, border-color 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // Se procesa en onClick del contenedor
                                style={{ cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                              />
                              <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.82rem', color: isSelected ? 'var(--primary)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.nombre}
                              </span>
                              <span className="badge badge-primary" style={{ fontSize: '0.62rem', flexShrink: 0, padding: '2px 6px' }}>
                                {app.categoria || 'General'}
                              </span>
                            </div>

                            <div className="customize-app-controls" onClick={(e) => e.stopPropagation()}>
                              {tempSections.length > 0 ? (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value !== '') {
                                      handleAssignAppToSection(app.id, parseInt(e.target.value, 10));
                                    }
                                  }}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '3px 6px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--surface)',
                                    color: 'var(--text-muted)',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                  }}
                                  title="Mover sólo esta app"
                                >
                                  <option value="">Mover a...</option>
                                  {tempSections.map((s, idx) => (
                                    <option key={s.id} value={idx}>{s.titulo}</option>
                                  ))}
                                </select>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  Crea una sección arriba
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {filteredUnassignedApps.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          No hay aplicaciones que coincidan con "{unassignedFilter}".
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Secciones del Usuario */}
                {tempSections.map((sec, secIdx) => {
                  const secSelected = selectedSectionAppIds[sec.id] || [];
                  const allSecSelected = sec.appIds.length > 0 && secSelected.length === sec.appIds.length;

                  return (
                    <div
                      key={sec.id}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '14px',
                        background: 'var(--surface-hover)'
                      }}
                    >
                      {/* Header de la Sección */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '180px' }}>
                          <input
                            type="text"
                            value={sec.titulo}
                            onChange={(e) => {
                              const updated = [...tempSections];
                              updated[secIdx].titulo = e.target.value;
                              setTempSections(updated);
                            }}
                            style={{
                              fontSize: '0.98rem',
                              fontWeight: 800,
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px dashed var(--text-muted)',
                              color: 'var(--text)',
                              outline: 'none',
                              padding: '2px 4px',
                              flex: 1
                            }}
                          />
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                            {sec.appIds.length} {sec.appIds.length === 1 ? 'app' : 'apps'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {sec.appIds.length > 0 && (
                            <label
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                color: allSecSelected ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: 600,
                                userSelect: 'none'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={allSecSelected}
                                onChange={() => handleToggleSelectAllInSection(sec.id, sec.appIds)}
                                style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                              />
                              <span>{allSecSelected ? 'Deseleccionar' : 'Seleccionar todo'}</span>
                            </label>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDeleteSection(sec.id)}
                            title="Eliminar Sección"
                          />
                        </div>
                      </div>

                      {/* BARRA DE ACCIÓN MASIVA DE LA SECCIÓN */}
                      {secSelected.length > 0 && (
                        <div
                          className="customize-bulk-bar-mobile"
                          style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '6px 12px',
                            background: 'var(--surface)',
                            border: '1.5px solid var(--primary)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(13, 44, 92, 0.12)',
                            marginBottom: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                              {secSelected.length} {secSelected.length === 1 ? 'app seleccionada' : 'apps seleccionadas'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedSectionAppIds(prev => ({ ...prev, [sec.id]: [] }))}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                            >
                              Limpiar
                            </button>
                          </div>

                          <div className="bulk-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600 }}>
                              Mover a:
                            </span>
                            <select
                              value={sectionBulkTargets[sec.id] || ''}
                              onChange={(e) => setSectionBulkTargets(prev => ({ ...prev, [sec.id]: e.target.value }))}
                              style={{
                                fontSize: '0.78rem',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                background: 'var(--surface)',
                                color: 'var(--text)',
                                fontWeight: 600,
                                minWidth: '130px'
                              }}
                            >
                              <option value="">Elegir destino...</option>
                              {tempSections.map((s, idx) => (
                                idx !== secIdx ? <option key={s.id} value={idx}>{s.titulo}</option> : null
                              ))}
                              <option value="__unassign__">Desagrupar (Enviar a Otras)</option>
                            </select>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={!sectionBulkTargets[sec.id]}
                              onClick={() => handleBulkMoveFromSection(secIdx, sectionBulkTargets[sec.id])}
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            >
                              Mover Selección
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Lista de Apps en esta sección */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          maxHeight: sec.appIds.length > 7 ? 'clamp(200px, 36vh, 360px)' : 'none',
                          overflowY: sec.appIds.length > 7 ? 'auto' : 'visible',
                          paddingRight: sec.appIds.length > 7 ? '4px' : '0'
                        }}
                      >
                        {sec.appIds.map((appId, appIdx) => {
                          const app = appsById.get(appId);
                          if (!app) return null;
                          const isSelected = secSelected.includes(appId);

                          return (
                            <div
                              key={appId}
                              className="customize-app-row"
                              onClick={() => handleToggleSelectInSection(sec.id, appId)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 10px',
                                background: isSelected ? 'rgba(13, 44, 92, 0.08)' : 'var(--surface)',
                                borderRadius: '8px',
                                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                                gap: '6px',
                                cursor: 'pointer',
                                userSelect: 'none',
                                transition: 'background-color 0.15s, border-color 0.15s'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // gestionado en el onClick del contenedor
                                  style={{ cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                                />
                                <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.82rem', color: isSelected ? 'var(--primary)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {app.nombre}
                                </span>
                                <span className="badge badge-primary" style={{ fontSize: '0.62rem', flexShrink: 0, padding: '2px 6px' }}>
                                  {app.categoria || 'General'}
                                </span>
                              </div>

                              <div className="customize-app-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                                {/* Subir */}
                                <button
                                  type="button"
                                  disabled={appIdx === 0}
                                  onClick={() => handleMoveApp(secIdx, appIdx, 'up')}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--surface-hover)',
                                    cursor: appIdx === 0 ? 'not-allowed' : 'pointer',
                                    opacity: appIdx === 0 ? 0.3 : 1,
                                    color: 'var(--text)'
                                  }}
                                  title="Subir"
                                >
                                  <ArrowUp size={13} />
                                </button>

                                {/* Bajar */}
                                <button
                                  type="button"
                                  disabled={appIdx === sec.appIds.length - 1}
                                  onClick={() => handleMoveApp(secIdx, appIdx, 'down')}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--surface-hover)',
                                    cursor: appIdx === sec.appIds.length - 1 ? 'not-allowed' : 'pointer',
                                    opacity: appIdx === sec.appIds.length - 1 ? 0.3 : 1,
                                    color: 'var(--text)'
                                  }}
                                  title="Bajar"
                                >
                                  <ArrowDown size={13} />
                                </button>

                                {/* Selector individual para mover a otra sección o desagrupar */}
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '__unassign__') {
                                      handleUnassignApp(secIdx, appIdx);
                                    } else if (val !== '') {
                                      handleMoveAppToSection(secIdx, appIdx, parseInt(val, 10));
                                    }
                                  }}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '3px 6px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--surface-hover)',
                                    color: 'var(--text)',
                                    maxWidth: '110px'
                                  }}
                                >
                                  <option value="">Mover a...</option>
                                  {tempSections.map((s, idx) => (
                                    idx !== secIdx ? <option key={s.id} value={idx}>{s.titulo}</option> : null
                                  ))}
                                  <option value="__unassign__">Desagrupar (Otras)</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                        {sec.appIds.length === 0 && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                            Esta sección no tiene aplicaciones aún. Marca aplicaciones en Otras o arriba y muévelas aquí.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Footer del Modal: Sticky al fondo para conveniencia */}
          <div
            className="customize-footer"
            style={{
              position: 'sticky',
              bottom: '-24px',
              background: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              paddingTop: '12px',
              paddingBottom: '4px',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              zIndex: 30
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={handleResetBoardConfig}
              className="customize-footer-reset"
            >
              Restablecer Predeterminado
            </Button>

            <div className="customize-footer-actions" style={{ display: 'flex', gap: '10px' }}>
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
