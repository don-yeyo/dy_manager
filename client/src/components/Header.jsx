import React, { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, LogOut, Shield, User, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../config/AuthContext';
import { useTheme } from '../config/ThemeContext';
import logo from '../assets/logo-don-yeyo-png-sin-fondo.png';

export const Header = ({ onToggleDrawer, onCustomizeBoard, onOpenCustomize }) => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleCustomize = onCustomizeBoard || onOpenCustomize;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'DY';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

  return (
    <header
      className="glass header-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        gap: '12px'
      }}
    >
      {/* Lado Izquierdo: Botón Menú (Solo si es Admin) + Marca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isAdmin() && (
          <button
            onClick={onToggleDrawer}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Abrir menú de administración"
          >
            <Menu size={22} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={logo}
            alt="Don Yeyo"
            className="header-logo"
            style={{ objectFit: 'contain' }}
          />

          {/* Título en Desktop */}
          <div className="header-title-desktop" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--header-text)', letterSpacing: '-0.02em' }}>
                DON YEYO <span style={{ color: 'var(--secondary)' }}>MANAGER</span>
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(13, 44, 92, 0.08)',
                  color: 'var(--text-muted)'
                }}
              >
                v{appVersion}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Portal Centralizado de Sistemas
            </span>
          </div>

          {/* Título en Mobile: DYM con la M roja y versión sutil */}
          <div className="header-title-mobile" style={{ alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 850, fontSize: '1.2rem', color: 'var(--header-text)', letterSpacing: '-0.03em' }}>
              DY<span style={{ color: 'var(--secondary)' }}>M</span>
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                opacity: 0.85
              }}
              title={`Versión del aplicativo: v${appVersion}`}
            >
              v{appVersion}
            </span>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Personalizar Tablero + Toggle de Tema + Avatar Usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Botón Personalizar Tablero en Navbar */}
        {handleCustomize && (
          <button
            onClick={handleCustomize}
            className="header-customize-btn"
            title="Personalizar Tablero de Aplicaciones"
            aria-label="Personalizar Tablero"
          >
            <SlidersHorizontal size={17} />
            <span className="header-customize-text">Personalizar</span>
          </button>
        )}

        {/* Toggle Claro / Oscuro */}
        <button
          onClick={toggleTheme}
          className="header-action-btn"
          style={{ padding: '8px 12px' }}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#0d2c5c" />}
        </button>

        {/* Dropdown de Usuario / Avatar */}
        {user && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="header-avatar-btn"
              title={`Usuario: ${user.nombre} (${isAdmin() ? 'Administrador' : 'Usuario'})`}
              aria-label="Menú de usuario"
            >
              <div
                className={`avatar-circle ${isAdmin() ? 'avatar-circle-admin' : 'avatar-circle-user'}`}
              >
                {getInitials(user.nombre)}
              </div>
              <div className="header-user-info">
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                  {user.nombre?.split(' ')[0]}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {isAdmin() ? 'Administrador' : 'Usuario'}
                </div>
              </div>
            </button>

            {menuOpen && (
              <div
                className="animate-pop-in"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '48px',
                  width: '260px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '16px',
                  zIndex: 200
                }}
              >
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
                    {user.nombre}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    {user.email}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <span className={`badge ${isAdmin() ? 'badge-danger' : 'badge-primary'}`}>
                      {isAdmin() ? <Shield size={12} /> : <User size={12} />}
                      {isAdmin() ? 'Rol Administrador' : 'Rol Usuario'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: 'var(--error)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
