import { useState, useEffect } from 'react'
import axios from 'axios'
import './History.css'

function History({ onNavigateToChecker }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'phone' | 'email'

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/api/all-history')
      if (response.data.success) {
        setHistory(response.data.history)
      }
    } catch (err) {
      console.error('Error fetching history:', err)
      setError('Unable to load history. Make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  const deleteFromHistory = (id) => {
    setHistory(history.filter((item) => item.id !== id))
  }

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      setHistory([])
    }
  }

  const filtered = filter === 'all' ? history : history.filter(h => h.type === filter)

  if (loading) {
    return (
      <div className="history-container loading">
        <div className="loader">
          <div className="spinner-lg"></div>
          <p>Loading check history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="history-container error">
        <div className="error-card">
          <p>⚠️ {error}</p>
          <button onClick={fetchHistory} className="retry-btn">
            🔄 Try Again
          </button>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="history-container empty">
        <div className="empty-state-large">
          <span className="empty-icon">📜</span>
          <h3>No Check History Yet</h3>
          <p>Phone numbers and emails you check will appear here.</p>
          {onNavigateToChecker && (
            <button
              className="retry-btn"
              style={{ marginTop: '20px' }}
              onClick={onNavigateToChecker}
            >
              🔍 Run a Check
            </button>
          )}
          <p className="hint">💡 Switch to "Check Phone" or "Check Email" to get started</p>
        </div>
      </div>
    )
  }

  const totalChecks = history.length
  const compromised = history.filter(h => h.foundInLeaks).length
  const safe = history.filter(h => !h.foundInLeaks).length

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>📜 Check History</h2>
        <button onClick={clearHistory} className="clear-btn">
          🗑️ Clear All
        </button>
      </div>

      <div className="stats-summary">
        <div className="summary-stat">
          <div className="summary-value">{totalChecks}</div>
          <div className="summary-label">Total Checks</div>
        </div>
        <div className="summary-stat">
          <div className="summary-value">{compromised}</div>
          <div className="summary-label">Compromised</div>
        </div>
        <div className="summary-stat">
          <div className="summary-value">{safe}</div>
          <div className="summary-label">Safe</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="history-filter">
        {['all', 'phone', 'email'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '🔍 All' : f === 'phone' ? '📱 Phone' : '✉️ Email'}
          </button>
        ))}
      </div>

      <div className="history-list">
        {filtered.length === 0 ? (
          <div className="empty-filter-msg">No {filter} checks found.</div>
        ) : (
          filtered.map((item) => {
            const leakSources = typeof item.leakSources === 'string'
              ? JSON.parse(item.leakSources)
              : item.leakSources || []

            const displayId = item.type === 'email' ? item.email : item.phoneNumber

            return (
              <div
                key={`${item.type}-${item.id}`}
                className={`history-item ${item.foundInLeaks ? 'compromised' : 'safe'}`}
              >
                <div className="item-left">
                  <div className="item-status">
                    {item.foundInLeaks ? '⚠️' : '✅'}
                  </div>
                  <div className="item-info">
                    <div className="item-phone">
                      <span className={`type-badge type-${item.type}`}>
                        {item.type === 'email' ? '✉️ Email' : '📱 Phone'}
                      </span>
                      {displayId}
                    </div>
                    <div className="item-time">
                      {new Date(item.checkedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="item-right">
                  {item.foundInLeaks && leakSources.length > 0 && (
                    <div className="item-breaches">
                      <span className="breach-count">
                        {leakSources.length} breach{leakSources.length !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  )}
                  {!item.foundInLeaks && (
                    <div className="item-status-text">No leaks found</div>
                  )}
                  <button
                    onClick={() => deleteFromHistory(item.id)}
                    className="delete-btn"
                    title="Delete this record"
                  >
                    🗑️
                  </button>
                </div>

                {item.foundInLeaks && leakSources.length > 0 && (
                  <div className="item-details">
                    <div className="details-label">Found in:</div>
                    <div className="details-breaches">
                      {leakSources.map((breach, idx) => (
                        <div key={idx} className="breach-tag">
                          {breach.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="history-footer">
        <p>💡 Check regularly to stay informed about new data breaches</p>
      </div>
    </div>
  )
}

export default History
