import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import Providers from './providers';
import './index.css';

// Handle chunk loading failures (e.g., after a new deployment) by forcing a hard reload
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error (chunk missing). Reloading page...', event);
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);
