import { useApp } from '../../context'

const T = {
  bg: '#0c0c0e',
  surface: '#111114',
  text: '#e8e8e8',
  muted: '#888896',
  accent: '#c8ff00',
  red: '#ff4444',
  border: '#2a2a30',
}

const heading = {
  fontFamily: "'Space Grotesk', sans-serif",
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const mono = { fontFamily: "'JetBrains Mono', monospace" }

export default function FocusToday() {
  const { data, loading, errors } = useApp()
  const focus = data.focus

  if (loading.focus) {
    return (
      <div style={{ border: `1px solid ${T.border}`, padding: '40px', position: 'relative', overflow: 'hidden' }} className="scan-line-container">
        <div style={{ ...mono, fontSize: '12px', color: T.muted }}>LOADING...</div>
      </div>
    )
  }

  if (errors.focus) {
    return (
      <div style={{ borderLeft: `3px solid ${T.red}`, padding: '14px 20px', ...mono, fontSize: '13px', color: T.red }}>
        ERROR: {errors.focus}
      </div>
    )
  }

  if (!focus) return null

  return (
    <div>
      <div style={{
        ...heading,
        fontSize: '12px',
        fontWeight: '700',
        color: T.white,
        marginBottom: '20px',
        letterSpacing: '0.1em',
      }}>FOCUS TODAY</div>

      <div style={{
        ...mono,
        fontSize: '11px',
        color: T.muted,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '16px',
      }}>FOCUS FOR TODAY</div>

      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '28px',
        color: T.text,
        maxWidth: '700px',
        lineHeight: '1.4',
        marginBottom: '48px',
      }}>
        {focus.focusTask || focus.task || 'Complete outstanding tasks and review progress.'}
      </div>

      <div style={{ display: 'flex', gap: '48px' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            ...mono,
            fontSize: '10px',
            color: T.muted,
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}>WHY</div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '15px',
            color: T.text,
            lineHeight: '1.7',
          }}>
            {focus.reason || 'No reason provided.'}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            ...mono,
            fontSize: '10px',
            color: T.muted,
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}>EST. TIME</div>
          <div style={{
            ...mono,
            fontSize: '24px',
            color: T.text,
            marginBottom: '8px',
          }}>
            {focus.estimatedTime || focus.time || '2h'}
          </div>
          {focus.impact && (
            <span style={{
              ...mono,
              fontSize: '10px',
              padding: '4px 8px',
              background: T.accent,
              color: T.bg,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              {focus.impact}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}