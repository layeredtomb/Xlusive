import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import PhoneChecker from './components/PhoneChecker'
import EmailChecker from './components/EmailChecker'
import ResultsDisplay from './components/ResultsDisplay'
import History from './components/History'
import GalaxyBackground from './components/GalaxyBackground'
import InboxCleaner from './components/InboxCleaner'
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
            <h1>Xlu<span>si</span>ve</h1>
            <p>Sign in to scan your privacy footprint and check for data exposure.</p>
          </div>
          <SignIn appearance={{ elements: { formButtonPrimary: 'auth-btn' } }} />
        </div>
      </SignedOut>

      <SignedIn>
        <header className="app-header">
          <div className="header-content">
            <div className="header-title-area">
              <h1>Xlusive</h1>
              <p>Data breach detection</p>
            </div>
            <div className="header-actions">
              <div className="status-indicator">
                {apiStatus ? (
                  <span className="status-online">Online</span>
                ) : (
                  <span className="status-offline">Offline</span>
                )}
              </div>
              <UserButton />
            </div>
          </div>
        </header>

        <main className="app-main">
          {!apiStatus && (
            <div className="error-banner">
              <span>⚠</span>
              <span>Server not running — start it with <code>node index.js</code> in the server folder.</span>
            </div>
          )}

          <div className="tab-navigation">
            <button
              id="tab-phone"
              className={`tab-button ${activeTab === 'phone' ? 'active' : ''}`}
              onClick={() => setActiveTab('phone')}
            >
              Phone
            </button>
            <button
              id="tab-email"
              className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              Email
            </button>
            <button
              id="tab-inbox"
              className={`tab-button ${activeTab === 'inbox' ? 'active' : ''}`}
              onClick={() => setActiveTab('inbox')}
            >
              Inbox Cleaner
            </button>
            <button
              id="tab-history"
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
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
                    <h3>Safety Tips</h3>
                    <ul>
                      <li>Use a unique password for every account</li>
                      <li>Enable 2FA / MFA wherever possible</li>
                      <li>Use an email alias for signups</li>
                      <li>Watch for suspicious login alerts</li>
                      <li>Never reuse a breached password</li>
                    </ul>
                    <div className="tips-divider" />
                    <h3>Sources Checked</h3>
                    <div className="sources-chips">
                      {['HaveIBeenPwned', 'LeakCheck.net', 'BreachDirectory', 'Archive.org', 'Pastebin', 'GitHub', 'Data Brokers'].map(s => (
                        <span key={s} className="chip">{s}</span>
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
          </div>
        </main>

        <footer className="app-footer">
          Xlusive — Check your own data only.
        </footer>
      </SignedIn>
    </div>
  )
}

export default App
