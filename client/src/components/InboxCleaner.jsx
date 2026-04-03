import { useState, useEffect } from 'react'
import axios from 'axios'
import './InboxCleaner.css'

const CATEGORY_LABELS = {
  newsletter: { label: 'Newsletter', color: 'blue', icon: '📰' },
  promotional: { label: 'Promotional', color: 'orange', icon: '🏷️' },
  automated: { label: 'Automated', color: 'purple', icon: '🤖' },
  explicit: { label: '18+ Spam', color: 'pink', icon: '🔞' },
  bulk: { label: 'Bulk Mailer', color: 'red', icon: '📦' },
  bulk_sender: { label: 'Bulk Sender', color: 'red', icon: '📨' },
}

function InboxCleaner({ apiStatus }) {
  const [step, setStep] = useState('login') // login | scanning | results
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('inboxEmail')
    const savedPassword = localStorage.getItem('inboxPassword')
    if (savedEmail) setEmail(savedEmail)
    if (savedPassword) {
      setPassword(savedPassword)
      setRememberMe(true)
    }
  }, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scanResults, setScanResults] = useState(null)
  const [selectedUids, setSelectedUids] = useState(new Set())
  const [activeView, setActiveView] = useState('bulk') // bulk | junk | all
  const [deleting, setDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(null)
  const [deleteProgress, setDeleteProgress] = useState(null)

  const handleConnect = async (e) => {
    e.preventDefault()
    setError(null)
    if (!apiStatus) { setError('Server is not running.'); return }
    if (!email || !password) { setError('Please fill in all fields.'); return }

    setLoading(true)
    try {
      await axios.post('/api/inbox/connect', { email, password })
      
      if (rememberMe) {
        localStorage.setItem('inboxEmail', email)
        localStorage.setItem('inboxPassword', password)
      } else {
        localStorage.removeItem('inboxEmail')
        localStorage.removeItem('inboxPassword')
      }

      // Connection OK — now scan
      setStep('scanning')
      await runScan()
    } catch (err) {
      setError(err.response?.data?.error || 'Connection failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const runScan = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post('/api/inbox/scan', { email, password })
      setScanResults(response.data)
      setStep('results')
      setSelectedUids(new Set())
      setDeleteSuccess(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Scan failed. Please try again.')
      setStep('login')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUid = (uid) => {
    const next = new Set(selectedUids)
    if (next.has(uid)) next.delete(uid)
    else next.add(uid)
    setSelectedUids(next)
  }

  const handleSelectAll = (uids) => {
    const next = new Set(selectedUids)
    const allSelected = uids.every(uid => next.has(uid))
    if (allSelected) uids.forEach(uid => next.delete(uid))
    else uids.forEach(uid => next.add(uid))
    setSelectedUids(next)
  }

  const handleSelectBulkSender = (senderUids) => {
    const next = new Set(selectedUids)
    const allSelected = senderUids.every(uid => next.has(uid))
    if (allSelected) senderUids.forEach(uid => next.delete(uid))
    else senderUids.forEach(uid => next.add(uid))
    setSelectedUids(next)
  }

  const handleDeleteSelected = async () => {
    if (selectedUids.size === 0) return
    if (!window.confirm(`Move ${selectedUids.size} email(s) to trash?`)) return

    setDeleting(true)
    setError(null)
    setDeleteSuccess(null)

    const uidsArray = Array.from(selectedUids)
    const total = uidsArray.length
    setDeleteProgress({ current: 0, total })

    // Helper to chunk the huge array securely into exact tiny segments to prevent serverless timeout
    const chunkArray = (arr, size) => 
      Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
      );
      
    // Sent max 15 emails per backend instruction roundtrip
    const chunks = chunkArray(uidsArray, 15);
    
    let deletedCount = 0;
    let failedChunks = 0;

    try {
      for (const chunk of chunks) {
        try {
          await axios.post('/api/inbox/delete', {
            email,
            password,
            uids: chunk,
          });
          deletedCount += chunk.length;
          setDeleteProgress({ current: deletedCount, total });
        } catch (postErr) {
          console.error("Chunk failed", postErr);
          failedChunks++;
        }
      }
      
      setDeleteSuccess(`Moved ${deletedCount} emails to trash${failedChunks > 0 ? ` (Failed to move ${failedChunks * 15})` : ''}.`)
      
      // Update UI 
      const deletedSet = new Set(uidsArray)
      setScanResults(prev => ({
        ...prev,
        junkEmails: prev.junkEmails.filter(e => !deletedSet.has(e.uid)),
        bulkSenders: prev.bulkSenders.map(s => ({
          ...s,
          uids: s.uids.filter(uid => !deletedSet.has(uid)),
          count: s.uids.filter(uid => !deletedSet.has(uid)).length,
        })).filter(s => s.count > 0),
        junkCount: Math.max(0, prev.junkCount - deletedCount),
      }))
      setSelectedUids(new Set())
    } catch (err) {
      setError(err.response?.data?.error || 'Delete process interrupted.')
    } finally {
      setDeleting(false)
      setTimeout(() => setDeleteProgress(null), 3000)
    }
  }

  const openUnsubscribe = (link) => {
    if (!link) return
    // Clean up mailto: and angle brackets in List-Unsubscribe header
    const cleaned = link.replace(/<|>/g, '').trim()
    const parts = cleaned.split(',').map(s => s.trim().replace(/<|>/g, ''))
    const url = parts.find(p => p.startsWith('http')) || parts.find(p => p.startsWith('mailto:')) || parts[0]
    
    if (url) {
      if (url.toLowerCase().startsWith('mailto:')) {
        window.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    }
  }

  // ──────────────────────────── RENDER ────────────────────────────

  if (step === 'login' || step === 'scanning') {
    return (
      <div className="inbox-cleaner">
        <div className="inbox-login-card">
          <div className="inbox-icon-header">
            <span className="inbox-big-icon">🧹</span>
            <h2>Inbox Cleaner</h2>
            <p>Connect your email to scan for spam, newsletters, and junk you can wipe out in one click.</p>
          </div>

          {step === 'scanning' && loading ? (
            <div className="scanning-state">
              <div className="scan-spinner"></div>
              <p className="scan-text">Scanning your inbox...</p>
              <p className="scan-sub">Reading headers from your last 300 emails. This may take 15–30 seconds.</p>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="login-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  className="inbox-input"
                />
              </div>

              <div className="form-group">
                <label>
                  App Password
                  <span className="label-hint">
                    — not your regular password
                  </span>
                </label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter app-specific password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    className="inbox-input"
                  />
                  <button
                    type="button"
                    className="show-hide-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group remember-me-group" style={{ flexDirection: 'row', alignItems: 'center', marginTop: '-5px', marginBottom: '20px' }}>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9em', color: 'rgba(200, 190, 255, 0.7)', fontWeight: 'normal' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    style={{ width: '16px', height: '16px', accentColor: '#7c3aed' }}
                  />
                  <span>Remember me securely on this device</span>
                </label>
              </div>

              {error && (
                <div className="inbox-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                type="submit"
                className="scan-btn"
                disabled={loading || !apiStatus}
              >
                {loading ? (
                  <><span className="spinner"></span> Connecting...</>
                ) : (
                  '🔍 Connect & Scan'
                )}
              </button>
            </form>
          )}

          <div className="setup-guide">
            <div className="guide-title">📋 How to get an App Password</div>
            <div className="guide-tabs">
              <div className="guide-section">
                <div className="guide-provider">Gmail</div>
                <ol>
                  <li>Go to <strong>myaccount.google.com</strong></li>
                  <li>Security → 2-Step Verification (must be enabled)</li>
                  <li>Search <strong>"App Passwords"</strong></li>
                  <li>Generate → Copy the 16-character code</li>
                  <li>Paste it above (no spaces needed)</li>
                </ol>
              </div>
              <div className="guide-section">
                <div className="guide-provider">Outlook / Hotmail</div>
                <ol>
                  <li>Go to <strong>account.microsoft.com</strong></li>
                  <li>Security → Advanced Security Options</li>
                  <li>App Passwords → Create new</li>
                  <li>Copy and paste above</li>
                </ol>
              </div>
              <div className="guide-section">
                <div className="guide-provider">Yahoo Mail</div>
                <ol>
                  <li>Go to <strong>security.yahoo.com</strong></li>
                  <li>Manage App Passwords</li>
                  <li>Generate → Copy and paste above</li>
                </ol>
              </div>
            </div>
            <div className="security-note">
              🔒 Your credentials are <strong>never stored</strong> — only used for this scanning session.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Results view
  const { junkEmails = [], bulkSenders = [], totalScanned, totalInbox, junkCount, newsletterCount, promotionalCount, explicitCount = 0 } = scanResults || {}

  const visibleEmails = activeView === 'bulk'
    ? [] // handled separately by bulk senders
    : activeView === 'junk'
      ? junkEmails.filter(e => !e.categories.includes('bulk_sender') || e.categories.some(c => c !== 'bulk_sender'))
      : junkEmails

  const allVisibleUids = visibleEmails.map(e => e.uid).filter(Boolean)
  const allBulkUids = bulkSenders.flatMap(s => s.uids)

  return (
    <div className="inbox-cleaner results-mode">
      {/* Header bar */}
      <div className="results-header-bar">
        <div className="results-title">
          <span>🧹</span>
          <div>
            <div className="results-main-title">Inbox Scan Results</div>
            <div className="results-sub">{email}</div>
          </div>
        </div>
        <div className="results-actions">
          {selectedUids.size > 0 && !deleteProgress && (
            <button
              className="delete-selected-btn"
              onClick={handleDeleteSelected}
              disabled={deleting}
            >
              {deleting
                ? <><span className="spinner"></span> Deleting...</>
                : `🗑️ Delete ${selectedUids.size} Selected`
              }
            </button>
          )}
          <button className="rescan-btn" onClick={runScan} disabled={loading || deleting}>
            {loading ? '🔄 Scanning...' : '🔄 Rescan'}
          </button>
          <button className="logout-btn" onClick={() => { setStep('login'); setScanResults(null); setPassword('') }} disabled={deleting}>
            ← Back
          </button>
        </div>
      </div>

      {deleteProgress && (
        <div className="progress-container" style={{ margin: '10px 24px 20px', padding: '16px', background: 'rgba(20, 15, 35, 0.6)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95em', color: '#c4b5fd', fontWeight: '500' }}>
            <span><span className="spinner" style={{width:'12px',height:'12px', borderWidth:'2px'}}></span> Deleting in real-time...</span>
            <span>{deleteProgress.current} / {deleteProgress.total} moved</span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
            <div style={{ 
              width: `${(deleteProgress.current / deleteProgress.total) * 100}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #ec4899, #a855f7, #3b82f6)', 
              backgroundSize: '200% 200%',
              animation: 'gradientShift 2s ease infinite',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
            }} />
          </div>
        </div>
      )}

      {deleteSuccess && !deleteProgress && (
        <div className="success-banner">✅ {deleteSuccess}</div>
      )}
      {error && <div className="inbox-error standalone">⚠️ {error}</div>}

      {/* Stats */}
      <div className="inbox-stats">
        <div className="inbox-stat">
          <div className="stat-val">{totalInbox?.toLocaleString()}</div>
          <div className="stat-lbl">Total Inbox</div>
        </div>
        <div className="inbox-stat">
          <div className="stat-val">{totalScanned?.toLocaleString()}</div>
          <div className="stat-lbl">Scanned</div>
        </div>
        <div className="inbox-stat warn">
          <div className="stat-val">{junkCount}</div>
          <div className="stat-lbl">Junk Found</div>
        </div>
        <div className="inbox-stat blue">
          <div className="stat-val">{newsletterCount}</div>
          <div className="stat-lbl">Newsletters</div>
        </div>
        <div className="inbox-stat orange">
          <div className="stat-val">{promotionalCount}</div>
          <div className="stat-lbl">Promos</div>
        </div>
        <div className="inbox-stat red">
          <div className="stat-val">{bulkSenders.length}</div>
          <div className="stat-lbl">Bulk Senders</div>
        </div>
        <div className="inbox-stat pink">
          <div className="stat-val">{explicitCount}</div>
          <div className="stat-lbl">18+ Spam</div>
        </div>
      </div>

      {/* View tabs */}
      <div className="view-tabs">
        <button
          className={`view-tab ${activeView === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveView('bulk')}
        >
          📨 Bulk Senders <span className="tab-count">{bulkSenders.length}</span>
        </button>
        <button
          className={`view-tab ${activeView === 'junk' ? 'active' : ''}`}
          onClick={() => setActiveView('junk')}
        >
          🗑️ All Junk <span className="tab-count">{junkEmails.length}</span>
        </button>
      </div>

      {/* Bulk Senders View */}
      {activeView === 'bulk' && (
        <div className="bulk-senders-list">
          {bulkSenders.length === 0 ? (
            <div className="no-results">✅ No bulk senders found — inbox looks clean!</div>
          ) : (
            <>
              <div className="bulk-select-all-bar">
                <button
                  className="select-all-btn"
                  onClick={() => handleSelectAll(allBulkUids)}
                >
                  {allBulkUids.every(uid => selectedUids.has(uid)) ? '☑ Deselect All' : '☐ Select All'}
                </button>
                <span className="bulk-hint">{bulkSenders.length} senders · {allBulkUids.length} emails</span>
              </div>
              {bulkSenders.map((sender, idx) => {
                const allSelected = sender.uids.length > 0 && sender.uids.every(uid => selectedUids.has(uid))
                const someSelected = sender.uids.some(uid => selectedUids.has(uid))
                return (
                  <div key={idx} className={`bulk-sender-item ${someSelected ? 'selected' : ''}`}>
                    <label className="bulk-check">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => handleSelectBulkSender(sender.uids)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <div className="bulk-sender-info">
                      <div className="bulk-sender-name">{sender.sender}</div>
                      <div className="bulk-sender-meta">
                        <span className="bulk-count-badge">{sender.count} emails</span>
                        {sender.hasUnsubscribe && (
                          <span className="unsub-badge">✉️ Can Unsubscribe</span>
                        )}
                        {sender.latestSubject && (
                          <span className="latest-subject">Latest: {sender.latestSubject}</span>
                        )}
                      </div>
                    </div>
                    <div className="bulk-sender-actions">
                      {sender.unsubscribeLink && (
                        <button
                          className="unsub-btn"
                          onClick={() => openUnsubscribe(sender.unsubscribeLink)}
                          title="Open unsubscribe link"
                        >
                          🚫 Unsub
                        </button>
                      )}
                      <button
                        className="delete-row-btn"
                        onClick={() => {
                          const next = new Set(selectedUids)
                          sender.uids.forEach(uid => next.add(uid))
                          setSelectedUids(next)
                        }}
                        title="Select for deletion"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* Junk emails view */}
      {activeView === 'junk' && (
        <div className="junk-list">
          {junkEmails.length === 0 ? (
            <div className="no-results">✅ No junk emails found!</div>
          ) : (
            <>
              <div className="bulk-select-all-bar">
                <button
                  className="select-all-btn"
                  onClick={() => handleSelectAll(allVisibleUids)}
                >
                  {allVisibleUids.every(uid => selectedUids.has(uid)) ? '☑ Deselect All' : '☐ Select All'}
                </button>
                <span className="bulk-hint">{junkEmails.length} junk emails</span>
              </div>
              {junkEmails.map((email, idx) => {
                const isSelected = selectedUids.has(email.uid)
                return (
                  <div key={idx} className={`junk-item ${isSelected ? 'selected' : ''}`}>
                    <label className="bulk-check">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectUid(email.uid)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <div className="junk-info">
                      <div className="junk-from">{email.from}</div>
                      <div className="junk-subject">{email.subject}</div>
                      <div className="junk-meta">
                        <span className="junk-date">{email.date ? new Date(email.date).toLocaleDateString() : '—'}</span>
                        <div className="junk-cats">
                          {email.categories.map(cat => {
                            const c = CATEGORY_LABELS[cat]
                            return c ? (
                              <span key={cat} className={`cat-badge cat-${c.color}`}>
                                {c.icon} {c.label}
                              </span>
                            ) : null
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="junk-actions">
                      {email.unsubscribeLink && (
                        <button
                          className="unsub-btn"
                          onClick={() => openUnsubscribe(email.unsubscribeLink)}
                        >
                          🚫 Unsub
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default InboxCleaner
