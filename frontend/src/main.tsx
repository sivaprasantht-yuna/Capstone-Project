import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { store } from './store'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#07192d',
              color: '#e2eaf4',
              border: '1px solid rgba(26,95,180,0.25)',
              borderRadius: '12px',
              fontFamily: 'Outfit, Inter, sans-serif',
              fontSize: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: { iconTheme: { primary: '#0ba5a5', secondary: '#e2eaf4' } },
            error:   { iconTheme: { primary: '#e53e3e', secondary: '#e2eaf4' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
