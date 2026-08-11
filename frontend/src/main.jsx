import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AccessibilityProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AccessibilityProvider>
    </AuthProvider>
  </React.StrictMode>
);
