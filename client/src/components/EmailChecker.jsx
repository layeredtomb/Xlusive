import { useState } from 'react'
import axios from 'axios'
import './EmailChecker.css'

function EmailChecker({ apiStatus }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const removalUrls = {
    'HaveIBeenPwned': { url: 'https://haveibeenpwned.com/', method: 'Lookup' },
    'LeakCheck.net': { url: 'https://leakcheck.io/contact', method: 'Contact Form' },
    'BreachDirectory': { url: 'https://www.breachdirectory.org/contact', method: 'Contact Form' },
    'Archive.org': { url: 'mailto:info@archive.org', method: 'Email' },
    'GitHub': { url: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-personal-information-from-github', method: 'GitHub Form' },
    'Pastebin': { url: 'https://pastebin.com/contact', method: 'Contact Form' },
    'Google': { url: 'https://support.google.com/websearch/troubleshooter/9685456', method: 'Removal Tool' },
    'Acxiom': { url: 'https://www.acxiom.com/opt-out', method: 'Online Form' },
    'Epsilon': { url: 'https://www.epsilon.com/opt-out', method: 'Online Form' },
    'Experian': { url: 'https://www.experian.com/optout', method: 'Online Form' },
    'LexisNexis': { url: 'https://optout.lexisnexis.com/', method: 'Online Form' },
  }

  const handleRequestRemoval = (leak) => {
    const source = leak.source || leak.name
    let removalInfo = null
    for (const [key, info] of Object.entries(removalUrls)) {
      if (source.toLowerCase().includes(key.toLowerCase())) {
        removalInfo = info
        break
      }
    }
    const removalUrl = removalInfo
      ? removalInfo.url
      : `mailto:?subject=${encodeURIComponent(`FORMAL DATA REMOVAL DEMAND (GDPR/CCPA) - ${leak.name}`)}&body=${encodeURIComponent(
          `To Whom It May Concern at ${leak.name},\n\nPursuant to my rights under the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA), I am formally demanding the immediate and complete erasure of my personal data (including my email address) from your records and any third-party affiliates.\n\nBreach Source Identified: ${leak.name}\nDate of Breach: ${leak.date}\n\nI expect confirmation of this deletion within the legally mandated 30-day timeframe. Failure to comply will result in a formal complaint to the relevant data protection authorities.\n\nThank you,`
        )}`
    window.open(removalUrl, '_blank')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!apiStatus) {
      setError('Server is not running. Please start the server first.')
      return
    }

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post('/api/check-email', { email: trimmed })
      setResult(response.data)
      localStorage.setItem('lastEmailCheckResult', JSON.stringify(response.data))
    } catch (err) {
      setError(err.response?.data?.error || 'Error checking email. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="email-checker">
      <div className="checker-card email-card">
        <h2>✉️ Enter Your Email Address</h2>
        <p className="description">
          Check if your email has appeared in any known data breaches or credential leaks.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Enter email (e.g. user@example.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !apiStatus}
              className={`phone-input ${error ? 'error' : ''}`}
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={loading || !apiStatus}
              className="submit-btn submit-btn-email"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Checking...
                </>
              ) : (
                '🔍 Check Now'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {result && (
          <div className={`result-container ${result.foundInLeaks ? 'found' : 'notfound'}`}>
            <div className="result-header">
              {result.foundInLeaks ? (
                <>
                  <span className="result-icon">⚠️</span>
                  <span className="result-title">Found in Data Leaks</span>
                </>
              ) : (
                <>
                  <span className="result-icon">✅</span>
                  <span className="result-title">Not Found in Leaks</span>
                </>
              )}
            </div>

            <p className="result-message">{result.message}</p>

            {result.foundInLeaks && result.leakSources && result.leakSources.length > 0 && (
              <div className="leaks-list">
                <h3>Found in these sources:</h3>
                {result.leakSources.map((leak, idx) => (
                  <div key={idx} className="leak-item">
                    <div className="leak-name">{leak.name}</div>
                    <div className="leak-details">
                      <span>📅 {leak.date}</span>
                      <span>📊 {leak.affectedRecords?.toLocaleString()} records</span>
                    </div>
                    <div className="leak-source">Source: {leak.source}</div>
                    {leak.details && (
                      <div className="leak-details-text">{leak.details}</div>
                    )}
                    <button
                      className="request-removal-btn"
                      onClick={() => handleRequestRemoval(leak)}
                    >
                      📤 Request Removal
                    </button>
                  </div>
                ))}
              </div>
            )}

            {result.checkedSources && (
              <div className="checked-sources">
                <h3>🔍 Sources Checked:</h3>
                <div className="sources-grid">
                  {result.checkedSources.map((source, idx) => (
                    <div key={idx} className="source-badge">✓ {source}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="result-timestamp">
              Checked on: {new Date(result.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        <div className="info-box">
          <h3>ℹ️ How email checking works</h3>
          <ul>
            <li>Your email is checked against known breach databases</li>
            <li>We scan HaveIBeenPwned, LeakCheck, BreachDirectory & more</li>
            <li>No personal data is stored or shared with third parties</li>
            <li>You can request removal from specific services directly</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EmailChecker
