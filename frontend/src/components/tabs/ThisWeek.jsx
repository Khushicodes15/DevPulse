import { useApp } from '../../context'

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

export default function ThisWeek() {
  const { data, loading, errors } = useApp()
  const week = data.week

  if (loading.week) return (
    <div style={{ border: `1px solid ${T.border}`, padding: '40px' }}>
      <div style={{ ...mono, fontSize: '12px', color: T.muted }}>LOADING...</div>
    </div>
  )

  if (errors.week) return (
    <div style={{ borderLeft: `3px solid ${T.red}`, padding: '14px 20px', ...mono, fontSize: '13px', color: T.red }}>
      ERROR: {errors.week}
    </div>
  )

  if (!week) return (
    <div style={{ ...mono, fontSize: '12px', color: T.muted }}>No data available.</div>
  )

  const weekScore = week.weekScore ?? 0
  const streakStatus = week.streakStatus ?? ''
  const period = week.period
    ? `${week.period.from} — ${week.period.to}`
    : 'This week'
  const summary = week.summary ?? ''
  const wins = Array.isArray(week.wins) ? week.wins : []
  const missed = week.missed ?? ''
  const nextWeekFocus = week.nextWeekFocus ?? ''

  const streakIsGood = streakStatus.toLowerCase().includes('roll')

  return (
    <div>
      <div style={{
        ...heading, fontSize: '12px', fontWeight: '700',
        color: T.white, marginBottom: '20px', letterSpacing: '0.1em',
      }}>THIS WEEK</div>

      {/* Score + streak */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '8px' }}>
          <span style={{ ...mono, fontSize: '80px', fontWeight: '600', color: T.text, lineHeight: '1' }}>
            {weekScore}
          </span>
          <span style={{ ...mono, fontSize: '18px', color: T.muted }}>/10</span>
          {streakStatus && (
            <span style={{
              ...mono, fontSize: '11px', padding: '4px 10px', letterSpacing: '0.05em',
              background: streakIsGood ? T.accent : T.elevated,
              color: streakIsGood ? T.bg : T.text,
            }}>
              {streakStatus.toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ ...mono, fontSize: '13px', color: T.muted }}>{period}</div>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '16px', color: T.text, lineHeight: '1.7',
          marginBottom: '32px', maxWidth: '700px',
        }}>
          {summary}
        </div>
      )}

      {/* Wins + Missed */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            ...mono, fontSize: '11px', color: T.muted,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px',
          }}>WINS</div>
          {wins.length === 0 && (
            <div style={{ ...mono, fontSize: '12px', color: T.muted }}>No wins recorded.</div>
          )}
          {wins.map((win, i) => (
            <div key={i} style={{
              padding: '10px 0', borderBottom: `1px solid ${T.border}`,
              ...mono, fontSize: '13px', color: T.text, lineHeight: '1.6',
            }}>
              <span style={{ color: T.accent, marginRight: '8px' }}>›</span>
              {typeof win === 'string' ? win : (win.text || win.description || JSON.stringify(win))}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            ...mono, fontSize: '11px', color: T.muted,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px',
          }}>MISSED</div>
          {missed ? (
            <div style={{
              borderLeft: `3px solid ${T.red}`, paddingLeft: '16px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '15px', color: T.muted, lineHeight: '1.7',
            }}>
              {missed}
            </div>
          ) : (
            <div style={{ ...mono, fontSize: '12px', color: T.muted }}>Nothing missed.</div>
          )}
        </div>
      </div>

      {/* Next week focus */}
      {nextWeekFocus && (
        <div style={{ border: `1px solid ${T.accent}`, padding: '24px' }}>
          <div style={{
            ...mono, fontSize: '11px', color: T.accent,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px',
          }}>NEXT WEEK FOCUS</div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '20px', color: T.text, lineHeight: '1.5',
          }}>
            {nextWeekFocus}
          </div>
        </div>
      )}
    </div>
  )
}