import React, { useState, useEffect } from 'react';
import { Search, Filter, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { AppsService } from '../services/api';
import { AppCard } from '../components/AppCard';
import { useAuth } from '../config/AuthContext';
import { Button } from '../components/Button';

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showAllAsAdmin, setShowAllAsAdmin] = useState(false);

  const fetchApps = async (overrideAll = showAllAsAdmin) => {
    try {
      setLoading(true);
      setError(null);
      const res = await AppsService.getMyApps(overrideAll);
      setApps(res.data.apps || []);
    } catch (err) {
      console.error('[Dashboard fetchApps Error]:', err);
      setError('No se pudieron cargar las aplicaciones asignadas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps(showAllAsAdmin);
  }, [showAllAsAdmin]);

  // Extraer categorías únicas
  const categories = ['Todas', ...new Set(apps.map(a => a.categoria || 'General').filter(Boolean))];

  // Filtrado reactivo
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (app.descripcion && app.descripcion.toLowerCase().includes(search.toLowerCase())) ||
      (app.categoria && app.categoria.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Todas' || (app.categoria || 'General') === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in">
      {/* Header del Dashboard */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Tablero de <span style={{ color: 'var(--secondary)' }}>Aplicaciones</span>
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Hola, <strong>{user?.nombre}</strong>. Aquí tienes tus herramientas corporativas autorizadas.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAdmin() && (
              <Button
                variant={showAllAsAdmin ? 'secondary' : 'outline'}
                size="sm"
                icon={Shield}
                onClick={() => setShowAllAsAdmin(prev => !prev)}
              >
                {showAllAsAdmin ? 'Modo: Todas las Apps (Admin)' : 'Modo: Mis Apps Asignadas'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchApps(showAllAsAdmin)}
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

      {/* Estados: Loading, Error o Vacío */}
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
      ) : filteredApps.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '64px 24px',
            color: 'var(--text-muted)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--surface-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: 'var(--text-muted)'
            }}
          >
            <Search size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
            No se encontraron aplicaciones
          </h3>
          <p style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
            {search || selectedCategory !== 'Todas'
              ? 'Prueba modificando los filtros de búsqueda o categoría.'
              : 'Aún no tienes aplicaciones asignadas a tu cuenta o grupo de trabajo. Comunícate con el Administrador.'}
          </p>
        </div>
      ) : (
        /* Grilla de Aplicaciones */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
};
