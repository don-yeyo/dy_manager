import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutGrid, 
  Layers, 
  Users, 
  FileText, 
  BarChart3, 
  X, 
  ShieldAlert,
  Building2
} from 'lucide-react';
import { useAuth } from '../config/AuthContext';

export const Drawer = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();

  const navItemStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? 'var(--btn-primary-text)' : 'var(--text)',
    backgroundColor: isActive ? 'var(--btn-primary-bg)' : 'transparent',
    transition: 'all 0.2s ease',
    marginBottom: '4px'
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            backgroundColor: 'rgba(13, 44, 92, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Drawer Panel */}
      <aside
        className="glass"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          zIndex: 160,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflowY: 'auto'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            height: '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="var(--primary)" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--drawer-title)' }}>
              NAVEGACIÓN
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '20px 14px', flex: 1 }}>
          {/* Sección General */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '0 12px 8px 12px'
              }}
            >
              Principal
            </div>
            <NavLink to="/" style={navItemStyle} onClick={onClose} end>
              <LayoutGrid size={18} />
              <span>Mis Aplicaciones</span>
            </NavLink>
          </div>

          {/* Sección Administración (Solo Admin) */}
          {isAdmin() && (
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--secondary)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '0 12px 8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ShieldAlert size={13} />
                <span>Administración</span>
              </div>

              <NavLink to="/admin/apps" style={navItemStyle} onClick={onClose}>
                <Layers size={18} />
                <span>Gestor de Apps</span>
              </NavLink>

              <NavLink to="/admin/users" style={navItemStyle} onClick={onClose}>
                <Users size={18} />
                <span>Usuarios y Grupos</span>
              </NavLink>

              <NavLink to="/admin/audit" style={navItemStyle} onClick={onClose}>
                <FileText size={18} />
                <span>Auditoría (Triggers)</span>
              </NavLink>

              <NavLink to="/admin/stats" style={navItemStyle} onClick={onClose}>
                <BarChart3 size={18} />
                <span>Estadísticas de Accesos</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--drawer-footer)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div style={{ fontWeight: 700 }}>Don Yeyo S.A. &copy; 2026</div>
          <div style={{ opacity: 0.7 }}>Departamento de Tecnología</div>
        </div>
      </aside>
    </>
  );
};
