import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

// Initialize Sentry for error tracking
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || 'https://038cbc5f1e389d85662fdb92288198b7@o4510500429824000.ingest.de.sentry.io/4510500436770896',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE,
  release: 'siyabusa-erp@1.0.0',
  enabled: import.meta.env.PROD,
  beforeSend(event) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        event.user = { id: user.id, email: user.email, username: user.name };
      } catch (e) { /* ignore */ }
    }
    return event;
  },
});

createRoot(document.getElementById('root')!).render(
  <App />
)
