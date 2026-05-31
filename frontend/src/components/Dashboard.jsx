import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context'
import Overview from './tabs/Overview'
import FocusToday from './tabs/FocusToday'
import Growth from './tabs/Growth'
import Portfolio from './tabs/Portfolio'
import ThisWeek from './tabs/ThisWeek'
import CrossSource from './tabs/CrossSource'
import Schema from './tabs/Schema'
import { API } from '../api'

const T = {
  bg: '#0c0c0e',
  surface: '#111114',
  elevated: '#1a1a1f',
  text: '#e8e8e8',
  muted: '#888896',
  accent: '#c8ff00',
  red: '#ff4444',
  white: '#ffffff',
  border: '#2a2a30',
}

const heading = {
  fontFamily: "'Space Grotesk', sans-serif",
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const mono = { fontFamily: "'JetBrains Mono', monospace" }

const TABS = [
  'OVERVIEW',
  'FOCUS TODAY',
  'GROWTH',
  'PORTFOLIO',
  'THIS WEEK',
  'CROSS-SOURCE',
  'SCHEMA',
]

const tabComponents = {
  OVERVIEW: Overview,
  'FOCUS TODAY': FocusToday,
  GROWTH: Growth,
  PORTFOLIO: Portfolio,
  'THIS WEEK': ThisWeek,
  'CROSS-SOURCE': CrossSource,
  SCHEMA: Schema,
}

function ScoreBar({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <span style={{
        ...mono,
        fontSize: '10px',
        color: T.muted,
        width: '100px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>{label}</span>
      <div style={{
        flex: 1,
        height: '3px',
        background: T.elevated,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${value}%`,
          background: T.accent,
        }} />
      </div>
      <span style={{
        ...mono,
        fontSize: '11px',
        color: T.text,
        width: '28px',
        textAlign: 'right',
      }}>{value}</span>
    </div>
  )
}

export default function Dashboard() {
  const { user, data } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('OVERVIEW')

  useEffect(() => {
    if (!user?.authenticated) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const runData = data.run
  const score = runData?.score?.total ?? 0
  const verdict = runData?.score?.verdict ?? 'ANALYZING...'
  const target = runData?.score?.targetCompany ?? ''
  const breakdown = runData?.score?.breakdown ?? {}
  const scoreColor = score >= 60 ? T.accent : score < 40 ? T.red : T.text

  const TabComponent = tabComponents[activeTab]

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      background: T.bg,
      overflow: 'hidden',
    }}>
      {/* Fixed sidebar */}
      <div style={{
        width: '260px',
        minWidth: '260px',
        height: '100vh',
        borderRight: `1px solid ${T.border}`,
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}>
        {/* User section */}
        <div style={{ padding: '24px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <img
              src={user?.user?.avatar || `https://github.com/${user?.user?.username || 'ghost'}.png`}
              alt=""
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: `1px solid ${T.border}`,
              }}
            />
            <div>
              <div style={{
                ...heading,
                fontSize: '14px',
                fontWeight: '700',
                color: T.white,
                lineHeight: '1.2',
              }}>{user?.user?.displayName || user?.user?.username || 'DEV'}</div>
              <div style={{
                ...mono,
                fontSize: '11px',
                color: T.muted,
              }}>@{user?.user?.username || 'unknown'}</div>
            </div>
          </div>

          {/* Gmail status — clickable if not connected */}
          <div
            onClick={() => { if (!user?.gmail) window.location.href = `${API}/auth/gmail/auth` }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: user?.gmail ? 'default' : 'pointer',
            }}
          >
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: user?.gmail ? T.accent : T.red,
            }} />
            <span style={{
              ...mono,
              fontSize: '10px',
              color: user?.gmail ? T.muted : T.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textDecoration: user?.gmail ? 'none' : 'underline',
            }}>
              {user?.gmail ? 'gmail connected' : '+ connect gmail'}
            </span>
          </div>
        </div>

        <div style={{ height: '1px', background: T.border }} />

        {/* Score section */}
        <div style={{ padding: '20px' }}>
          <div style={{
            ...mono,
            fontSize: '10px',
            color: T.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '4px',
          }}>HIREABILITY SCORE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{
              ...mono,
              fontSize: '72px',
              fontWeight: '600',
              color: scoreColor,
              lineHeight: '1',
            }}>{score}</span>
            <span style={{
              ...mono,
              fontSize: '24px',
              color: T.muted,
            }}>/100</span>
          </div>
          <div style={{
            ...heading,
            fontSize: '12px',
            color: scoreColor,
            fontWeight: '700',
            marginTop: '6px',
            letterSpacing: '0.1em',
          }}>{verdict.toUpperCase()}</div>
          {target && (
            <div style={{
              ...mono,
              fontSize: '12px',
              color: T.muted,
              marginTop: '4px',
            }}>{target}</div>
          )}
        </div>

        <div style={{ height: '1px', background: T.border }} />

        {/* Score breakdown */}
        <div style={{ padding: '20px' }}>
          <ScoreBar label="Consistency" value={breakdown.consistency ?? 0} />
          <ScoreBar label="Project Q." value={breakdown.projectQuality ?? breakdown.project_quality ?? 0} />
          <ScoreBar label="Activity" value={breakdown.activity ?? 0} />
          <ScoreBar label="Diversity" value={breakdown.diversity ?? 0} />
          <ScoreBar label="Collaboration" value={breakdown.collaboration ?? 0} />
        </div>

        <div style={{ height: '1px', background: T.border }} />

        {/* Navigation tabs */}
        <div style={{ padding: '12px 0' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 20px',
                textAlign: 'left',
                ...heading,
                fontSize: '12px',
                fontWeight: '500',
                color: activeTab === tab ? T.white : T.muted,
                borderLeft: activeTab === tab ? `4px solid ${T.accent}` : '4px solid transparent',
                background: 'transparent',
                transition: 'none',
                letterSpacing: '0.06em',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ height: '1px', background: T.border }} />

        {/* Coral engine panel */}
        <div style={{ padding: '16px 20px', marginTop: 'auto' }}>
          <div style={{
            ...mono,
            fontSize: '10px',
            color: T.text,
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}>CORAL ENGINE</div>
          <div style={{ height: '1px', background: T.border, marginBottom: '8px' }} />
          <div style={{ ...mono, fontSize: '10px', color: T.muted, lineHeight: '2' }}>
            <div>sql interface <span style={{ color: T.accent }}>✓</span></div>
            <div>cross-source <span style={{ color: T.accent }}>✓</span></div>
            <div>schema learning <span style={{ color: T.accent }}>✓</span></div>
            <div>caching 5min <span style={{ color: T.accent }}>✓</span></div>
            <div>mcp-stdio <span style={{ color: T.accent }}>✓</span></div>
          </div>
          <div style={{ height: '1px', background: T.border, margin: '8px 0' }} />
          <div style={{ ...mono, fontSize: '10px', color: T.muted, lineHeight: '1.8' }}>
            3 sources active<br />
            <span style={{ color: T.accent }}>github</span> · <span style={{ color: T.accent }}>linear</span> · <span style={{ color: T.accent }}>sentry</span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '40px',
      }}>
        {TabComponent ? <TabComponent /> : (
          <div style={{ color: T.muted, ...mono, fontSize: '12px' }}>Select a tab</div>
        )}
      </div>
    </div>
  )
}