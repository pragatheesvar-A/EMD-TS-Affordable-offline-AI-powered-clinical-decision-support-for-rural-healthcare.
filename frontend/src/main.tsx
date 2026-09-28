import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'

// Registers the offline service worker for the *browser/PWA* build only.
// Inside the native Capacitor APK all assets are already bundled on-device,
// so a service worker isn't needed — and its NetworkFirst navigation
// strategy would otherwise try to hit the network on launch and surface as
// a "no connection" error in the WebView.
if (!Capacitor.isNativePlatform()) {
  registerSW({ immediate: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
