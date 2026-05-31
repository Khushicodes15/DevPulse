import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context'

const T = {
  bg: '#0c0c0e',
  text: '#e8e8e8',
  muted: '#888896',
  accent: '#c8ff00',
}

const mono = { fontFamily: "'JetBrains Mono', monospace" }
const heading = { fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }

const scanSteps = [
  'querying github.user_repos via coral sql',
  'querying github.user_event_public',
  'running cross-source join',
  'discovering schema (382 tables)',
  'loading linear.issues via mcp-stdio',
  'loading sentry.issues via mcp-stdio',
  'running ai gap analysis',
  'calculating hireability score',
]

export default function Scanning() {
  const { user, fetchAllData, fetchSchema, dataLoaded } = useApp()
  const navigate = useNavigate()
  const [steps, setSteps] = useState(scanSteps.map(s => ({ text: s, done: false })))
  const initRef = useRef(false)
  const allDone = steps.every(s => s.done)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    fetchSchema()
    fetchAllData()
  }, [fetchAllData, fetchSchema])

  useEffect(() => {
    let stepIndex = 0
    const interval = setInterval(() => {
      if (stepIndex < scanSteps.length) {
        const idx = stepIndex
        setSteps(prev => {
          const next = [...prev]
          next[idx] = { ...next[idx], done: true }
          return next
        })
        stepIndex++
      } else {
        clearInterval(interval)
      }
    }, 600)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => navigate('/dashboard', { replace: true }), 800)
      return () => clearTimeout(t)
    }
  }, [allDone, navigate])

  useEffect(() => {
    if (user && !user.authenticated) navigate('/', { replace: true })
  }, [user, navigate])

  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', flexDirection: 'column',
      padding: '40px 24px',
    }}>
      <div style={{ ...heading, fontSize: '14px', color: T.text, fontWeight: '700' }}>DEVPULSE</div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          ...heading, fontSize: 'clamp(20px, 4vw, 32px)',
          fontWeight: '800', color: '#ffffff',
          textAlign: 'center', marginBottom: '48px',
        }}>
          ANALYZING YOUR DEVELOPER PROFILE
        </div>

        <div style={{ width: '100%', maxWidth: '560px' }}>
          {scanSteps.map((text, i) => (
            <div key={i} style={{
              ...mono, fontSize: 'clamp(10px, 2vw, 12px)',
              lineHeight: '2.4', letterSpacing: '0.04em',
              color: steps[i]?.done ? T.accent : T.muted,
            }}>
              [{steps[i]?.done ? '✓' : ' '}] {text}
            </div>
          ))}
        </div>

        {allDone && !dataLoaded && (
          <div style={{ ...mono, fontSize: '11px', color: T.muted, marginTop: '24px', letterSpacing: '0.06em' }}>
            WAITING FOR AI ANALYSIS...
          </div>
        )}
      </div>
    </div>
  )
}