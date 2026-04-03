import { useState, useEffect, useRef } from 'react'
import './PhoneFixer.css'

const SCAN_LINES = [
  "Initializing deep kernel hook...",
  "Bypassing mainframe security protocols...",
  "Allocating 4GB of virtual RAM...",
  "Reticulating splines...",
  "Scanning file system for corrupt sectors...",
  "Found 1,402 corrupt sectors...",
  "Attempting sector repair...",
  "Repair failed. Escalating privileges...",
  "Injecting rootkit payload...",
  "Overclocking CPU by 400%...",
  "Warning: Thermal limits exceeded!",
  "Warning: Battery voltage unstable!",
  "Core dump initiated..."
]

function PhoneFixer() {
  const [step, setStep] = useState('idle') // idle | running | scare | off
  const [lines, setLines] = useState([])
  const [progress, setProgress] = useState(0)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [scareTimer, setScareTimer] = useState(20)
  const terminalRef = useRef(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  useEffect(() => {
    if (step === 'running') {
      let currentLine = 0
      let prog = 0
      
      const interval = setInterval(() => {
        if (currentLine < SCAN_LINES.length) {
          setLines(prev => [...prev, SCAN_LINES[currentLine]])
          currentLine++
        }
        
        prog += Math.random() * 8
        if (prog > 99) prog = 99
        setProgress(prog)

        if (currentLine >= SCAN_LINES.length) {
          clearInterval(interval)
          setTimeout(() => {
             setLines(prev => [...prev, "CRITICAL ERROR: KERNEL PANIC"])
             setLines(prev => [...prev, "SYSTEM OVERHEATING. EMERGENCY SHUTDOWN FAILED."])
             setProgress(100)
             setTimeout(() => {
               setStep('scare')
               if (window.electronAPI) window.electronAPI.startScare()
             }, 1500)
          }, 1000)
        }
      }, 600)

      return () => clearInterval(interval)
    }

    if (step === 'scare') {
      setScareTimer(20)
      const countdown = setInterval(() => {
        setScareTimer(prev => {
          if (prev <= 1) {
            clearInterval(countdown)
            resetPrank()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      const handleKey = (e) => {
        if (e.key === 'Escape') resetPrank()
      }
      window.addEventListener('keydown', handleKey)

      return () => {
        clearInterval(countdown)
        window.removeEventListener('keydown', handleKey)
      }
    }
  }, [step])

  const startFix = () => {
    setStep('running')
    setLines(["Starting Phone Optimization Tool v2.4.1..."])
    setProgress(0)
  }

  const resetPrank = () => {
    setStep('idle')
    setLines([])
    setProgress(0)
    if (window.electronAPI) window.electronAPI.stopScare()
  }

  // SCARE SCREEN
  if (step === 'scare') {
    return (
      <div className="scare-overlay">
        <div className="glitch-screen">
          <div className="error-code">ERROR: 0x000000000420F</div>
          <div className="scare-text">SYSTEM FAILURE</div>
          <div className="scare-sub">RESTORING KERNEL... {scareTimer}s</div>
          <div className="flicker-overlay"></div>
          <div className="scanline"></div>
          <div className="static-screen"></div>
        </div>
      </div>
    )
  }

  // If in "off" state, render a full black screen that blocks everything
  if (step === 'off') {
    return (
      <div className="phone-fixer-off-screen" onClick={resetPrank}>
        <div style={{ display: 'none' }}>Click to wake up</div>
      </div>
    )
  }

  return (
    <div className="checker-card phone-fixer">
      <div className="checker-header fixer-header">
        <span className="checker-icon">🔧</span>
        <h2>Phone Fixer (Beta)</h2>
        <p>Run our advanced deep-scan algorithm to repair corrupt sectors, clear RAM, and boost battery life by up to 300%.</p>
      </div>

      <div className="fixer-content">
        {step === 'idle' ? (
          <div className="fixer-start-state">
             <div className="form-group" style={{ marginBottom: '20px', textAlign: 'left' }}>
               <label>Enter Phone Number or Email to Optimize</label>
               <input 
                 type="text" 
                 className="inbox-input" 
                 placeholder="+1 (555) 000-0000 or email@example.com"
                 value={phoneNumber}
                 onChange={(e) => setPhoneNumber(e.target.value)}
                 style={{ marginTop: '8px' }}
               />
             </div>
             <button className="fix-btn scan-btn" onClick={startFix}>
               🚀 Start Deep Optimization
             </button>
             <p className="fixer-warning">Note: Device performance may be impacted during scan.</p>
          </div>
        ) : (
          <div className="fixer-running-state">
            <div className="terminal-window" ref={terminalRef}>
              <div className="terminal-header">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="terminal-title">root@xlusive: ~</span>
              </div>
              <div className="terminal-body">
                {lines.map((line, index) => (
                  <div key={index} className="terminal-line">
                    <span className="prompt">$</span> {line}
                  </div>
                ))}
                {progress < 100 && <div className="terminal-cursor">_</div>}
              </div>
            </div>

            <div className="fixer-progress">
              <div className="progress-info">
                <span>Optimizing Core Architecture...</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PhoneFixer
