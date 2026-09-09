import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./msal";
import { AuthService } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { instance, accounts } = useMsal();
  const isMsAuthenticated = useIsAuthenticated();

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dy_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sincronizar usuario con la API backend
  const syncWithBackend = useCallback(async (email, nombre) => {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await AuthService.sync({ email, nombre });
      const syncedUser = res.data.user;
      setUser(syncedUser);
      localStorage.setItem('dy_current_user', JSON.stringify(syncedUser));
    } catch (err) {
      console.error('[AuthContext] Error sincronizando con backend:', err);
      setAuthError(err.response?.data?.message || err.message || 'Error al validar usuario con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Verificar modo MOCK para desarrollo local
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      const mockEmail = import.meta.env.VITE_MOCK_AUTH_EMAIL || 'admin@donyeyo.com.ar';
      const mockName = import.meta.env.VITE_MOCK_AUTH_NAME || 'Administrador Don Yeyo';

      // Si aún no está cargado o difiere
      if (!user || user.email !== mockEmail) {
        syncWithBackend(mockEmail, mockName);
      } else {
        setLoading(false);
      }
      return;
    }

    // 2. Modo Microsoft SSO
    if (isMsAuthenticated && accounts.length > 0) {
      const activeAccount = accounts[0];
      const email = activeAccount.username || activeAccount.idTokenClaims?.email;
      const nombre = activeAccount.name || email?.split('@')[0];

      if (email && (!user || user.email !== email)) {
        syncWithBackend(email, nombre);
      } else {
        setLoading(false);
      }
    } else {
      if (!import.meta.env.VITE_MOCK_AUTH || import.meta.env.VITE_MOCK_AUTH === 'false') {
        setUser(null);
        localStorage.removeItem('dy_current_user');
        setLoading(false);
      }
    }
  }, [isMsAuthenticated, accounts, syncWithBackend]);

  const login = async () => {
    try {
      setAuthError(null);
      if (import.meta.env.VITE_MOCK_AUTH === 'true') {
        const mockEmail = import.meta.env.VITE_MOCK_AUTH_EMAIL || 'admin@donyeyo.com.ar';
        const mockName = import.meta.env.VITE_MOCK_AUTH_NAME || 'Administrador Don Yeyo';
        await syncWithBackend(mockEmail, mockName);
        return;
      }

      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error('[AuthContext] Error en login:', error);
      setAuthError('Fallo al iniciar sesión con Microsoft: ' + error.message);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('dy_current_user');
      setUser(null);
      if (import.meta.env.VITE_MOCK_AUTH === 'true') {
        window.location.href = '/login';
        return;
      }
      await instance.logoutPopup();
    } catch (error) {
      console.error('[AuthContext] Error en logout:', error);
      window.location.href = '/login';
    }
  };

  const isAdmin = () => user?.rol === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authError,
      login,
      logout,
      isAdmin,
      refreshUser: () => user && syncWithBackend(user.email, user.nombre)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
