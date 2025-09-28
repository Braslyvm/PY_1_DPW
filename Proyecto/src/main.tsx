import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/style/base.css'
import '../src/style/InicioSesion.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
