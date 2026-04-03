import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#05030f', color: '#fca5a5', fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }}>
      <h1>⚠️ Authentication Error ⚠️</h1>
      <p style={{ maxWidth: '400px', lineHeight: '1.5', marginTop: '10px' }}>
        The <b>VITE_CLERK_PUBLISHABLE_KEY</b> is missing. <br/><br/>
        If you are on Vercel: go to Settings &gt; Environment Variables, add the key, and then click <b>Deployments &gt; Redeploy</b>. 
      </p>
    </div>
  )
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </React.StrictMode>
  )
}
