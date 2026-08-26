import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { LegacyProvider } from './context/LegacyContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <LegacyProvider>
          <App />
        </LegacyProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
)
