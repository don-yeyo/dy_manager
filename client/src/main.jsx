import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './config/msal';
import { ThemeProvider } from './config/ThemeContext';
import { AuthProvider } from './config/AuthContext';
import App from './App';
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);

// Inicializar MSAL y procesar cualquier redirección pendiente antes de montar React
const initApp = async () => {
  try {
    await msalInstance.initialize();
    const response = await msalInstance.handleRedirectPromise();
    if (response?.account) {
      msalInstance.setActiveAccount(response.account);
    } else {
      const currentAccounts = msalInstance.getAllAccounts();
      if (currentAccounts.length > 0) {
        msalInstance.setActiveAccount(currentAccounts[0]);
      }
    }
  } catch (error) {
    console.warn('[MSAL Init Warning]:', error);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </MsalProvider>
    </React.StrictMode>
  );
};

initApp();

