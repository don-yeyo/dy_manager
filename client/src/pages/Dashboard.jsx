import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
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
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/FormElements';

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showAllAsAdmin, setShowAllAsAdmin] = useState(false);

  // Estados de Personalización del Tablero
  const [customSections, setCustomSections] = useState([]); // [{ id, titulo, appIds: [] }]
  const [hasCustomConfig, setHasCustomConfig] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [tempSections, setTempSections] = useState([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

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

  // Extraer categorías únicas para filtro
  const categories = ['Todas', ...new Set(apps.map(a => a.categoria || 'General').filter(Boolean))];

  // Filtrado reactivo para búsqueda
  const filterMatches = (app) => {
    const matchesSearch =
      app.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (app.descripcion && app.descripcion.toLowerCase().includes(search.toLowerCase())) ||
      (app.categoria && app.categoria.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Todas' || (app.categoria || 'General') === selectedCategory;

    return matchesSearch && matchesCategory;
  };

  // Mapeo rápido de apps por ID
  const appsById = new Map(apps.map(a => [a.id, a]));

  return (
    <div className="animate-fade-in">
      {/* Header del Dashboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Tablero de <span style={{ color: 'var(--secondary)' }}>Aplicaciones</span>
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Hola, <strong>{user?.nombre}</strong>. Aquí tienes tus herramientas corporativas autorizadas.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Botón de Personalización */}
            <Button
              variant="outline"
              size="sm"
              icon={SlidersHorizontal}
              onClick={openCustomizeModal}
            >
              Personalizar Tablero
            </Button>

            {isAdmin() && (
              <Button
                variant={showAllAsAdmin ? 'secondary' : 'outline'}
                size="sm"
                icon={Shield}
                onClick={() => setShowAllAsAdmin(prev => !prev)}
              >
                {showAllAsAdmin ? 'Todas las Apps (Admin)' : 'Mis Asignaciones'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchDashboardData(showAllAsAdmin)}
              loading={loading}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginTop: '16px',
            padding: '16px',
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Buscador */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Buscar aplicación por nombre, descripción o área..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--text)',
                outline: 'none',
                fontSize: '0.88rem'
              }}
            />
          </div>

          {/* Categorías en chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={16} color="var(--text-muted)" style={{ marginRight: '4px' }} />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${selectedCategory === cat ? 'var(--primary)' : 'var(--border)'}`,
                  background: selectedCategory === cat ? 'var(--btn-primary-bg)' : 'transparent',
                  color: selectedCategory === cat ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
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
      ) : hasCustomConfig && customSections.length > 0 && !search && selectedCategory === 'Todas' ? (
        /* VISTA PERSONALIZADA: Secciones con titulares definidos por el usuario */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {customSections.map((sec) => {
            const secApps = sec.appIds
              .map(id => appsById.get(id))
              .filter(Boolean);

            if (secApps.length === 0) return null;

            return (
              <section key={sec.id} className="animate-fade-in">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: '2px solid var(--border)',
                    paddingBottom: '10px',
                    marginBottom: '20px'
                  }}
                >
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                    {sec.titulo}
                  </h2>
                  <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                    {secApps.length} {secApps.length === 1 ? 'app' : 'apps'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                  }}
                >
                  {secApps.map((app) => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Apps no agrupadas en las secciones personalizadas */}
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
                    marginBottom: '20px'
                  }}
                >
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                    Otras Aplicaciones Asignadas
                  </h2>
                  <span className="badge" style={{ background: 'var(--surface-hover)', fontSize: '0.72rem' }}>
                    {unclassifiedApps.length}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                  }}
                >
                  {unclassifiedApps.map((app) => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              </section>
            );
          })()}
        </div>
      ) : (
        /* VISTA ESTÁNDAR (O con Búsqueda/Filtro activo) */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}
        >
          {apps.filter(filterMatches).map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
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
    </div>
  );
};
