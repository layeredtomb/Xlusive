import { useState, useEffect } from 'react'
import './ResultsDisplay.css'

function ResultsDisplay() {
  const [result, setResult] = useState(null)

  useEffect(() => {
    // Check localStorage for last result
    const lastResult = localStorage.getItem('lastCheckResult')
    if (lastResult) {
      try {
        setResult(JSON.parse(lastResult))
      } catch (e) {
        console.error('Error parsing stored result:', e)
      }
    }
  }, [])

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const lastResult = localStorage.getItem('lastCheckResult')
      if (lastResult) {
        try {
          setResult(JSON.parse(lastResult))
        } catch (e) {
          console.error('Error parsing stored result:', e)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleDownload = () => {
    if (!result) return;
    
    let content = `Phone Number Leak Check Report\n`;
    content += `==============================\n`;
    content += `Phone: ${result.phoneNumber}\n`;
    content += `Checked On: ${new Date(result.timestamp).toLocaleString()}\n`;
    content += `Status: ${result.foundInLeaks ? 'COMPROMISED' : 'SAFE'}\n\n`;
    
    if (result.foundInLeaks && result.leakSources) {
      content += `Breaches Found: ${result.leakSources.length}\n`;
      result.leakSources.forEach(leak => {
        content += `- ${leak.name} (${leak.date}): ${leak.affectedRecords?.toLocaleString() || 'Unknown'} records affected\n`;
      });
    } else {
      content += `No known breaches found for this phone number.\n`;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leak-report-${result.phoneNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!result) return;
    
    let text = `Phone Leak Check Result for ${result.phoneNumber}: `;
    text += result.foundInLeaks ? `⚠️ Found in ${result.leakSources?.length} breaches.` : `✅ Safe, no leaks found!`;
    text += ` Checked on ${new Date(result.timestamp).toLocaleDateString()}.`;
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Results copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  if (!result) {
    return (
      <div className="results-display empty-state">
        <div className="empty-illustration">📊</div>
        <h3>No Recent Checks</h3>
        <p>Run a phone number check to see results here</p>
      </div>
    )
  }

  return (
    <div className="results-display">
      <div className={`results-card ${result.foundInLeaks ? 'alert' : 'safe'}`}>
        <div className="results-header">
          <h3>Latest Check Result</h3>
          <span className={`status-badge ${result.foundInLeaks ? 'compromised' : 'clean'}`}>
            {result.foundInLeaks ? '⚠️ Compromised' : '✓ Safe'}
          </span>
        </div>

        <div className="phone-display">
          <span className="label">Phone:</span>
          <span className="value">{result.phoneNumber}</span>
        </div>

        <div className="stats">
          {result.leakSources && result.leakSources.length > 0 && (
            <div className="stat">
              <div className="stat-number">{result.leakSources.length}</div>
              <div className="stat-label">Breaches Found</div>
            </div>
          )}

          <div className="stat">
            <div className="stat-time">
              {new Date(result.timestamp).toLocaleDateString()}
            </div>
            <div className="stat-label">Checked On</div>
          </div>
        </div>

        {result.foundInLeaks && result.leakSources && result.leakSources.length > 0 && (
          <div className="breach-summary">
            <h4>Breach Summary:</h4>
            <ul className="breach-list">
              {result.leakSources.map((breach, idx) => (
                <li key={idx}>
                  <span className="breach-badge">🗄️</span>
                  <span>{breach.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="actions">
          <button className="action-btn primary" onClick={handleDownload}>
            📋 Download Report
          </button>
          <button className="action-btn secondary" onClick={handleShare}>
            📋 Copy to Clipboard
          </button>
        </div>
      </div>

      <div className="recommendations">
        <h4>🛡️ Recommendations</h4>
        <ul>
          <li>Change passwords on affected accounts immediately</li>
          <li>Enable two-factor authentication (2FA) where available</li>
          <li>Monitor your accounts for suspicious activity</li>
          <li>Consider a credit freeze if personal info was exposed</li>
          <li>Use a password manager for strong, unique passwords</li>
        </ul>
      </div>
    </div>
  )
}

export default ResultsDisplay
