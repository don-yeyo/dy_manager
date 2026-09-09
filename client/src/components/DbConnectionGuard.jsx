import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { SystemService } from '../services/api';
import { Modal } from './Modal';

export const DbConnectionGuard = () => {
  const [isDbDisconnected, setIsDbDisconnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isCheckingRef = useRef(false);
  const wasDisconnectedRef = useRef(false);

  const checkConnection = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsChecking(true);

    try {
      const res = await SystemService.getDbStatus();
      if (res.data && res.data.status === 'ok') {
        if (wasDisconnectedRef.current) {
          // Si estuvo desconectado y ahora reconectó, recargar la aplicación para limpiar estados corruptos
          window.location.reload();
          return;
        }
        setIsDbDisconnected(false);
      } else {
        setIsDbDisconnected(true);
        wasDisconnectedRef.current = true;
      }
    } catch (error) {
      console.error('[DbConnectionGuard] Falló verificación de base de datos:', error);
      setIsDbDisconnected(true);
      wasDisconnectedRef.current = true;
    } finally {
      setIsChecking(false);
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Verificación inicial
    checkConnection();

    // Polling periódico configurable vía variable de entorno (por defecto 90s)
    const intervalSeconds = parseInt(import.meta.env.VITE_DB_CONNECTION_CHECK_INTERVAL, 10) || 90;
    const interval = setInterval(() => {
      checkConnection();
    }, intervalSeconds * 1000);

    // Escuchar eventos globales de fallo de conexión o fallos 500 en Axios
    const handleDbError = () => {
      setIsDbDisconnected(true);
      wasDisconnectedRef.current = true;
    };

    const handleAxiosError = (e) => {
      const status = e.detail?.status;
      const errorMsg = (e.detail?.message || '').toLowerCase();

      // Si alguna llamada da error 500, error de red o timeout, chequear estado de BD inmediatamente
      if (status === 500 || !status || errorMsg.includes('network') || errorMsg.includes('database') || errorMsg.includes('timeout')) {
        checkConnection();
      }
    };

    window.addEventListener('db-connection-failed', handleDbError);
    window.addEventListener('api-request-failed', handleAxiosError);

    return () => {
      clearInterval(interval);
      window.removeEventListener('db-connection-failed', handleDbError);
      window.removeEventListener('api-request-failed', handleAxiosError);
    };
  }, [checkConnection]);

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await checkConnection();
  };

  if (!isDbDisconnected) return null;

  return (
    <Modal
      isOpen={true}
      onClose={() => {}}
      showCloseButton={false}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)' }}>
          <AlertTriangle size={24} className="animate-pulse" />
          <span>Conexión interrumpida</span>
        </div>
      }
      maxWidth="480px"
    >
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            width: '80px',
            height: '80px',
            margin: '0 auto 24px auto',
            borderRadius: '50%',
            background: 'rgba(217, 35, 44, 0.1)',
            color: 'var(--danger)'
          }}
        >
          <Database size={40} />
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              background: 'var(--danger)',
              color: '#fff',
              borderRadius: '50%',
              padding: '4px',
              border: '2px solid var(--surface)'
            }}
          >
            <WifiOff size={16} />
          </div>
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>
          Sin conexión con la Base de Datos
        </h3>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
          No se ha podido establecer comunicación con la base de datos de Don Yeyo Manager.
          Por favor, verificá que el servidor de base de datos esté accesible o contactate con soporte técnico si el problema persiste.
        </p>

        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            backgroundColor: 'rgba(217, 35, 44, 0.06)',
            border: '1px solid rgba(217, 35, 44, 0.2)',
            marginBottom: '24px',
            fontSize: '0.85rem',
            textAlign: 'left',
            color: 'var(--text)'
          }}
        >
          <strong>Detalles del estado:</strong>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Servicio Don Yeyo Manager:</span>
            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Offline / Desconectado</span>
          </div>
          {retryCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Intentos de reconexión:</span>
              <span>{retryCount}</span>
            </div>
          )}
        </div>

        <button
          className="btn btn-primary"
          disabled={isChecking}
          onClick={handleRetry}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 600,
            background: 'var(--danger)',
            borderColor: 'var(--danger)',
            color: '#fff',
            cursor: isChecking ? 'not-allowed' : 'pointer',
            opacity: isChecking ? 0.7 : 1,
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
          {isChecking ? 'Verificando...' : 'Reintentar Conexión'}
        </button>
      </div>
    </Modal>
  );
};
