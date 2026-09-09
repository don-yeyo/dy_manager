import React, { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, LogOut, Shield, User } from 'lucide-react';
import { useAuth } from '../config/AuthContext';
import { useTheme } from '../config/ThemeContext';

export const Header = ({ onToggleDrawer }) => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  return (
    <header
      className="glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid var(--border)'
      }}
    >
      {/* Lado Izquierdo: Botón Menú + Marca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleDrawer}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0d2c5c 0%, #1a4b8c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1rem',
              boxShadow: '0 2px 6px rgba(13, 44, 92, 0.3)'
            }}
          >
            DY
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                v1.0.0
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Portal Centralizado de Sistemas
            </span>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Toggle de Tema + Avatar Usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Toggle Claro / Oscuro */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: 'var(--radius-pill)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)'
          }}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#0d2c5c" />}
        </button>

        {/* Dropdown de Usuario */}
        {user && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '4px 12px 4px 6px',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: isAdmin() ? 'var(--secondary)' : 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                {getInitials(user.nombre)}
              </div>
              <div style={{ textAlign: 'left', display: 'none', md: 'block' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                  {user.nombre?.split(' ')[0]}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {user.rol === 'admin' ? 'Administrador' : 'Usuario'}
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
