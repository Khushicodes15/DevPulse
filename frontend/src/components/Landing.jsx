import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API } from '../api'
import { useApp } from '../context'

const T = {
  bg: '#0c0c0e',
  surface: '#111114',
  text: '#e8e8e8',
  muted: '#888896',
  accent: '#c8ff00',
  red: '#ff4444',
  white: '#ffffff',
  border: '#2a2a30',
}

const heading = { fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }
const mono = { fontFamily: "'JetBrains Mono', monospace" }

const coralLines = [
  'POWERED BY CORAL MCP',
  '> sql interface ✓ active',
  '> cross-source joins ✓ active',
  '> schema learning ✓ active',
  '> caching ✓ active',
  '> mcp-stdio transport ✓ active',
]

const previewLines = [
  'DEVPULSE INTELLIGENCE REPORT',
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  'ANALYZING: github.user_repos',
  'ANALYZING: github.user_event_public',
  'CROSS-JOIN: linear.issues × sentry.issues',
  'SCHEMA: 382 tables discovered',
  'CACHE: warm (ttl 300s)',
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  'HIREABILITY SCORE: 73/100',
  'VERDICT: hireable now',
  'TARGET: mid-stage startups',
]

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

function TypewriterLine({ text, delay, startDelay }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay)
    return () => clearTimeout(t)
  }, [startDelay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, delay)
    return () => clearInterval(id)
  }, [started, text, delay])

  return (
    <div style={{ ...mono, fontSize: '13px', color: '#555560', lineHeight: '1.8' }}>
      {displayed}
      <span style={{ opacity: displayed.length < text.length && started ? 1 : 0 }}>▌</span>
    </div>
  )
}

export default function Landing() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [hoverGithub, setHoverGithub] = useState(false)
  const [hoverGmail, setHoverGmail] = useState(false)
  const width = useWindowWidth()
  const isMobile = width < 768

  const githubConnected = !!(user?.authenticated || searchParams.get('github') === 'connected')
  const gmailConnected = !!(user?.gmail)
  const githubHandle = user?.user?.username || user?.user?.login || ''

  useEffect(() => {
    if (user?.authenticated) navigate('/scanning', { replace: true })
  }, [user, navigate])

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        padding: isMobile ? '40px 24px 24px' : '60px 60px 40px',
        gap: isMobile ? '32px' : '0',
      }}>

        {/* Left / top column */}
        <div style={{ flex: isMobile ? 'none' : '0 0 60%', paddingRight: isMobile ? '0' : '60px' }}>
          <div style={{ ...heading, fontSize: isMobile ? '36px' : '48px', fontWeight: '800', color: T.white, lineHeight: '1' }}>
            DEVPULSE
          </div>

          <div style={{ height: '1px', background: T.border, margin: '28px 0' }} />

          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: isMobile ? '16px' : '18px', color: T.muted, lineHeight: '1.5', marginBottom: '40px' }}>
            Your developer profile. Brutally honest.
          </div>

          <div style={{ border: `1px solid ${T.border}`, padding: '24px 28px', marginBottom: '32px' }}>
            {coralLines.map((line, i) => (
              <div key={i} style={{
                ...mono, fontSize: '11px',
                color: line.includes('✓') ? T.accent : T.muted,
                lineHeight: '2', letterSpacing: '0.04em',
              }}>{line}</div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={githubConnected ? undefined : () => { window.location.href = `${API}/auth/github` }}
              onMouseEnter={() => setHoverGithub(true)}
              onMouseLeave={() => setHoverGithub(false)}
              style={{
                width: '100%', padding: '14px 20px',
                border: githubConnected ? 'none' : `1px solid ${hoverGithub ? T.text : T.accent}`,
                background: githubConnected ? 'transparent' : (hoverGithub ? T.text : 'transparent'),
                color: githubConnected ? T.accent : (hoverGithub ? T.bg : T.accent),
                ...mono, fontSize: '12px', letterSpacing: '0.1em', textAlign: 'left',
                transition: 'none',
                borderLeft: githubConnected ? '4px solid #c8ff00' : undefined,
                cursor: githubConnected ? 'default' : 'pointer',
              }}
            >
              {githubConnected ? `GITHUB — ${githubHandle.toUpperCase()} ✓` : 'CONNECT GITHUB'}
            </button>

            <button
              onClick={() => { if (!githubConnected) return; window.location.href = `${API}/auth/gmail/auth` }}
              onMouseEnter={() => githubConnected && setHoverGmail(true)}
              onMouseLeave={() => setHoverGmail(false)}
              style={{
                width: '100%', padding: '14px 20px',
                border: gmailConnected ? 'none' : `1px solid ${githubConnected ? (hoverGmail ? T.text : T.accent) : T.border}`,
                background: gmailConnected ? 'transparent' : (githubConnected && hoverGmail ? T.text : 'transparent'),
                color: gmailConnected ? T.accent : (githubConnected ? (hoverGmail ? T.bg : T.accent) : T.muted),
                ...mono, fontSize: '12px', letterSpacing: '0.1em', textAlign: 'left',
                transition: 'none',
                borderLeft: gmailConnected ? '4px solid #c8ff00' : undefined,
                cursor: githubConnected ? 'pointer' : 'not-allowed',
              }}
            >
              {gmailConnected ? 'GMAIL — CONNECTED ✓' : 'CONNECT GMAIL'}
            </button>
          </div>
        </div>

        {/* Right / bottom column — hidden on small mobile to save space */}
        {!isMobile && (
          <div style={{ flex: '0 0 40%', paddingLeft: '20px' }}>
            <div style={{
              border: `1px solid ${T.border}`, padding: '28px',
              background: T.surface, position: 'relative', overflow: 'hidden',
            }}>
              {previewLines.map((line, i) => (
                <TypewriterLine key={i} text={line} delay={35} startDelay={i * 400} />
              ))}
            </div>
          </div>
        )}

        {/* On mobile show a compact static version instead */}
        {isMobile && (
          <div style={{ border: `1px solid ${T.border}`, padding: '16px', background: T.surface }}>
            {previewLines.slice(0, 5).map((line, i) => (
              <div key={i} style={{ ...mono, fontSize: '11px', color: '#555560', lineHeight: '1.8' }}>{line}</div>
            ))}
            <div style={{ ...mono, fontSize: '11px', color: T.muted, marginTop: '8px' }}>...</div>
          </div>
        )}
      </div>

      {/* Bottom strip */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: isMobile ? '12px 24px' : '14px 60px' }}>
        <div style={{ ...mono, fontSize: isMobile ? '9px' : '11px', color: T.muted, letterSpacing: '0.05em' }}>
          PIRATES OF THE CORAL-BEAN HACKATHON · WEMAKEDEVS · TRACK 2: PERSONAL AGENT · CORAL FEATURES: 5/5
        </div>
      </div>
    </div>
  )
}