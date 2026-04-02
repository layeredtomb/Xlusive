import { useState } from 'react'
import axios from 'axios'
import './PhoneChecker.css'

export function usePhoneChecker() {
  const [result, setResult] = useState(null)
  const [setResultCallback] = useState(() => setResult)
  return { result, setResult }
}

function PhoneChecker({ apiStatus }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)


  // Removal URLs for different data sources
  const removalUrls = {
    'LeakCheck.net': { url: 'https://leakcheck.io/contact', method: 'Contact Form' },
    'BreachDirectory': { url: 'https://www.breachdirectory.org/contact', method: 'Contact Form' },
    'Archive.org': { url: 'mailto:info@archive.org', method: 'Email' },
    'GitHub': { url: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-personal-information-from-github', method: 'GitHub Form' },
    'Pastebin': { url: 'https://pastebin.com/contact', method: 'Contact Form' },
    'TruePeopleSearch': { url: 'https://www.truepeoplesearch.com/removal', method: 'Online Form' },
    'FastPeopleSearch': { url: 'https://www.fastpeoplesearch.com/remove', method: 'Online Form' },
    'FreePeopleSearch': { url: 'https://www.freepeoplesearch.com/opt-out', method: 'Online Form' },
    'ZabaSearch': { url: 'https://www.zabasearch.com/opt-out', method: 'Online Form' },
    'CyberBackgroundChecks': { url: 'https://www.cyberbackgroundchecks.com/optout', method: 'Online Form' },
    'USPhoneBook': { url: 'https://www.usphonebook.com/opt-out', method: 'Online Form' },
    'AnyWho': { url: 'https://www.anywho.com/optout', method: 'Online Form' },
    'ClustrMaps': { url: 'https://clustrmaps.com/bl/opt-out', method: 'Online Form' },
    'Nuwber': { url: 'https://nuwber.com/removal/link', method: 'Online Form' },
    'Whitepages': { url: 'https://www.whitepages.com/opt_out', method: 'Online Form' },
    'Spokeo': { url: 'https://www.spokeo.com/optout', method: 'Online Form' },
    'Intelius': { url: 'https://www.intelius.com/opt-out', method: 'Online Form' },
    'BeenVerified': { url: 'https://www.beenverified.com/app/optout', method: 'Online Form' },
    'TruthFinder': { url: 'https://www.truthfinder.com/opt-out', method: 'Online Form' },
    'Instant Checkmate': { url: 'https://www.instantcheckmate.com/opt-out', method: 'Online Form' },
    'PeopleFinders': { url: 'https://www.peoplefinders.com/opt-out', method: 'Online Form' },
    'Radaris': { url: 'https://radaris.com/control/privacy', method: 'Online Form' },
    'Ancestry.com': { url: 'https://www.ancestry.com/cs/legal/privacystatement', method: 'Privacy Settings' },
    'MyHeritage': { url: 'https://www.myheritage.com/contact', method: 'Contact Form' },
    'FamilySearch': { url: 'https://www.familysearch.org/help/helpcenter', method: 'Help Center' },
    'Google': { url: 'https://support.google.com/websearch/troubleshooter/9685456', method: 'Removal Tool' },
    'Public Records': { url: 'https://www.publicrecords.search.com/opt-out', method: 'Online Form' },
    'Data Brokers': { url: 'https://www.acxiom.com/opt-out', method: 'Online Form' },
    'Social Media': { url: 'https://www.facebook.com/help/contact/206196896081806', method: 'Privacy Form' },
    'Telegram': { url: 'https://telegram.org/support', method: 'Support Request' },
  }

  const handleRequestRemoval = (leak) => {
    const source = leak.source || leak.name
    let removalInfo = null

    // Try to match the source to a removal URL
    for (const [key, info] of Object.entries(removalUrls)) {
      if (source.toLowerCase().includes(key.toLowerCase())) {
        removalInfo = info
        break
      }
    }

    let removalUrl
    if (removalInfo) {
      removalUrl = removalInfo.url
    } else {
      // Create a pre-filled email for manual contact
      const emailSubject = encodeURIComponent(`Data Removal Request - ${leak.name}`)
      const emailBody = encodeURIComponent(
        `Hello,\n\nI would like to request the removal of my phone number from your database.\n\n` +
        `Details:\n` +
        `- Source: ${leak.name}\n` +
        `- Date Found: ${leak.date}\n` +
        `- Records: ${leak.affectedRecords}\n\n` +
        `Please remove my personal information as soon as possible.\n\n` +
        `Thank you,`
      )
      removalUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`
    }

    // Open the removal page
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

    if (!phoneNumber.trim()) {
      setError('Please enter a phone number')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/check-phone', {
        phoneNumber: phoneNumber,
      })

      setResult(response.data)
      localStorage.setItem('lastCheckResult', JSON.stringify(response.data))
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('Error checking phone number. Please try again.')
      }
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="phone-checker">
      <div className="checker-card">
        <h2>🔍 Enter Your Phone Number</h2>
        <p className="description">
          Check if your phone number has appeared in any known data breaches or data leaks.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="tel"
              placeholder="Enter phone number (e.g., +1 (555) 123-4567 or 5551234567)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading || !apiStatus}
              className={`phone-input ${error ? 'error' : ''}`}
            />
            <button
              type="submit"
              disabled={loading || !apiStatus}
              className="submit-btn"
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
          <div
            className={`result-container ${result.foundInLeaks ? 'found' : 'notfound'}`}
          >
            <div className="result-header">
              {result.foundInLeaks ? (
                <>
                  <span className="result-icon">⚠️</span>
                  <span className="result-title">Found in Data Leaks</span>
                </>
              ) : (
                <>
                  <span className="result-icon">✓</span>
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
                      <span>📊 {leak.affectedRecords.toLocaleString()} records</span>
                    </div>
                    <div className="leak-source">Source: {leak.source}</div>
                    {leak.details && (
                      <div className="leak-details-text">{leak.details}</div>
                    )}
                    {leak.snapshotUrls && leak.snapshotUrls.length > 0 && (
                      <div className="snapshot-links">
                        <div className="snapshot-title">📜 Archived Pages:</div>
                        {leak.snapshotUrls.map((snapshot, idx) => (
                          <a
                            key={idx}
                            href={snapshot.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="snapshot-link"
                          >
                            View Archive ({new Date(snapshot.timestamp).toLocaleDateString()})
                          </a>
                        ))}
                      </div>
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
                    <div key={idx} className="source-badge">
                      ✓ {source}
                    </div>
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
          <h3>ℹ️ How this works</h3>
          <ul>
            <li>Your phone number is checked against known data breach databases</li>
            <li>No personal data is stored or shared with third parties</li>
            <li>Results are saved locally on your browser for reference</li>
            <li>You can request removal from specific services</li>
          </ul>
        </div>
      </div>


    </div>
  )
}

export default PhoneChecker
