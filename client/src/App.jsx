import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import PhoneChecker from './components/PhoneChecker'
import EmailChecker from './components/EmailChecker'
import ResultsDisplay from './components/ResultsDisplay'
import History from './components/History'
import GalaxyBackground from './components/GalaxyBackground'
import InboxCleaner from './components/InboxCleaner'
import PhoneFixer from './components/PhoneFixer'
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react'

function App() {
  const [activeTab, setActiveTab] = useState('phone')
  const [apiStatus, setApiStatus] = useState(false)

  useEffect(() => {
    const checkAPI = async () => {
      try {
        await axios.get('/api/health')
        setApiStatus(true)
      } catch {
        setApiStatus(false)
      }
    }

    checkAPI()
    const interval = setInterval(checkAPI, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app">
      <GalaxyBackground />

      <SignedOut>
        <div className="auth-container">
          <div className="auth-branding">
            <h1>⚡ Xlusive</h1>
            <p>Sign in to secure your data and scan your privacy footprint.</p>
          </div>
          <SignIn appearance={{ elements: { formButtonPrimary: 'auth-btn' } }} />
        </div>
      </SignedOut>

      <SignedIn>
        <header className="app-header">
          <div className="header-content">
            <div className="header-title-area">
              <h1>⚡ Xlusive</h1>
              <p>Check if your phone or email has been exposed in a data breach</p>
            </div>
            <div className="header-actions">
              <div className="status-indicator">
                {apiStatus ? (
                  <span className="status-online">System Online</span>
                ) : (
                  <span className="status-offline">Connecting...</span>
                )}
              </div>
              <UserButton />
            </div>
          </div>
        </header>

      <main className="app-main">
        {!apiStatus && (
          <div className="error-banner">
            ⚠️ Server is not running. Start it with: <code>node index.js</code> in the server folder.
          </div>
        )}

        <div className="tab-navigation">
          <button
            id="tab-phone"
            className={`tab-button ${activeTab === 'phone' ? 'active' : ''}`}
            onClick={() => setActiveTab('phone')}
          >
            📱 Check Phone
          </button>
          <button
            id="tab-email"
            className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            ✉️ Check Email
          </button>
          <button
            id="tab-inbox"
            className={`tab-button ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('inbox')}
          >
            🧹 Inbox Cleaner
          </button>
          <button
            id="tab-history"
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 History
          </button>
          <button
            id="tab-fixer"
            className={`tab-button ${activeTab === 'fixer' ? 'active' : ''}`}
            onClick={() => setActiveTab('fixer')}
          >
            🔧 Phone Fixer
          </button>
        </div>

        <div className="tab-content" key={activeTab}>
          {activeTab === 'phone' && (
            <div className="checker-container">
              <PhoneChecker apiStatus={apiStatus} />
              <ResultsDisplay />
            </div>
          )}

          {activeTab === 'email' && (
            <div className="checker-container">
              <EmailChecker apiStatus={apiStatus} />
              <div className="email-tips-panel">
                <div className="tips-card">
                  <h3>🛡️ Email Safety Tips</h3>
                  <ul>
                    <li>Use a unique password for every account</li>
                    <li>Enable 2FA/MFA wherever possible</li>
                    <li>Consider using an email alias for signups</li>
                    <li>Monitor for suspicious login alerts</li>
                    <li>Never reuse a breached password</li>
                  </ul>
                  <div className="tips-divider" />
                  <h3>🔎 Sources We Check</h3>
                  <div className="sources-chips">
                    {['HaveIBeenPwned', 'LeakCheck.net', 'BreachDirectory', 'Archive.org', 'Pastebin', 'GitHub', 'Data Brokers'].map(s => (
                      <span key={s} className="chip">✓ {s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inbox' && (
            <InboxCleaner apiStatus={apiStatus} />
          )}

          {activeTab === 'history' && (
            <History onNavigateToChecker={() => setActiveTab('phone')} />
          )}

          {activeTab === 'fixer' && (
            <PhoneFixer />
          )}
        </div>
      </main>

        <footer className="app-footer">
          ⚡ Xlusive — Your privacy matters. Check your own data only.
        </footer>
      </SignedIn>
    </div>
  )
}

export default App
