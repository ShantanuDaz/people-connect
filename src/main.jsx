import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import './index.css'
import App from './App.jsx'

window.Buffer = Buffer // polyfill for bip39 and b4a in browser

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
