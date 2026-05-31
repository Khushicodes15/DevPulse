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

function StatBox({ label, value }) {
  return (
    <div style={{ border: `1px solid ${T.border}`, padding: '20px' }}>
      <div style={{
        ...mono, fontSize: '36px', fontWeight: '600',
        color: T.white, lineHeight: '1', marginBottom: '6px',
      }}>{value ?? '—'}</div>
      <div style={{
        ...mono, fontSize: '11px', color: T.muted,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>{label}</div>
    </div>
  )
}

function LoadingPanel() {
  return (
    <div style={{ border: `1px solid ${T.border}`, padding: '40px' }}>
      <div style={{ ...mono, fontSize: '12px', color: T.muted }}>LOADING DATA...</div>
    </div>
  )
}

function ErrorPanel({ message }) {
  return (
    <div style={{ borderLeft: `3px solid ${T.red}`, padding: '14px 20px', ...mono, fontSize: '13px', color: T.red }}>
      ERROR: {message}
    </div>
  )
}

export default function Overview() {
  const { data, loading, errors } = useApp()
  const runData = data.run

  if (loading.run) return <LoadingPanel />
  if (errors.run) return <ErrorPanel message={errors.run} />
  if (!runData) return <LoadingPanel />

  const ai = runData.ai || {}
  const github = runData.github || {}
  const score = runData.score || {}

  // correct data paths from backend response
  const profile = github.profile || {}
  const repos = profile.public_repos ?? '—'
  const languageList = github.languages || []
  const languageCount = languageList.length
  const since = profile.created_at ? new Date(profile.created_at).getFullYear() : '—'
  const recentEvents = github.recentEvents || []
  const gaps = score.gaps || []

  return (
    <div>
      <div style={{
        ...heading, fontSize: '12px', fontWeight: '700',
        color: T.white, marginBottom: '20px', letterSpacing: '0.1em',
      }}>OVERVIEW</div>

      {/* Top stat boxes */}
      <div style={{ display: 'flex', gap: '1px', marginBottom: '32px' }}>
        <div style={{ flex: 1 }}><StatBox label="PUBLIC REPOS" value={repos} /></div>
        <div style={{ flex: 1 }}><StatBox label="LANGUAGES" value={languageCount} /></div>
        <div style={{ flex: 1 }}><StatBox label="GITHUB SINCE" value={since} /></div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
        {/* Left: AI Summary */}
        <div style={{ flex: '0 0 65%' }}>
          <div style={{
            ...mono, fontSize: '11px', color: T.muted,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px',
          }}>INTELLIGENCE BRIEF</div>
          <div style={{ borderLeft: `4px solid ${T.accent}`, paddingLeft: '20px' }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '16px', color: T.white, lineHeight: '1.7', marginBottom: '20px',
            }}>
              {ai.summary || 'No summary available.'}
            </div>

            {ai.biggestBlocker && (
              <>
                <div style={{ ...mono, fontSize: '10px', color: T.red, letterSpacing: '0.1em', marginBottom: '6px' }}>
                  BIGGEST BLOCKER
                </div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '14px', color: T.red, lineHeight: '1.6', marginBottom: '20px',
                }}>{ai.biggestBlocker}</div>
              </>
            )}

            {ai.strengthSpotlight && (
              <>
                <div style={{ ...mono, fontSize: '10px', color: T.accent, letterSpacing: '0.1em', marginBottom: '6px' }}>
                  STRENGTH
                </div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '14px', color: T.accent, lineHeight: '1.6',
                }}>{ai.strengthSpotlight}</div>
              </>
            )}
          </div>
        </div>

        {/* Right: Gaps */}
        <div style={{ flex: '0 0 35%' }}>
          <div style={{
            ...mono, fontSize: '11px', color: T.muted,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px',
          }}>IDENTIFIED GAPS</div>
          <div style={{ borderTop: `1px solid ${T.border}` }}>
            {gaps.length === 0 && (
              <div style={{ ...mono, fontSize: '12px', color: T.muted, padding: '16px 0' }}>
                No gaps identified.
              </div>
            )}
            {gaps.map((gap, i) => (
              <div key={i} style={{
                padding: '12px 0',
                borderBottom: `1px solid ${T.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    ...mono, fontSize: '10px', padding: '2px 6px', letterSpacing: '0.05em',
                    background: (gap.priority || '').toUpperCase() === 'HIGH' ? T.red : '#b8960e',
                    color: T.white,
                  }}>
                    {gap.priority || 'MED'}
                  </span>
                  <span style={{ ...mono, fontSize: '11px', color: T.text }}>
                    {gap.area || ''}
                  </span>
                </div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '13px', color: T.muted, lineHeight: '1.5',
                }}>
                  {gap.gap || gap.text || ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Languages */}
      {languageList.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            ...mono, fontSize: '11px', color: T.muted,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px',
          }}>LANGUAGES</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {languageList.map((lang, i) => (
              <div key={i} style={{
                border: `1px solid ${T.border}`, padding: '6px 14px',
                ...mono, fontSize: '11px', color: T.text,
              }}>
                {lang.language} <span style={{ color: T.muted }}>{lang.repo_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div>
        <div style={{
          ...mono, fontSize: '11px', color: T.muted,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px',
        }}>RECENT ACTIVITY</div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {recentEvents.length === 0 && (
            <div style={{ ...mono, fontSize: '12px', color: T.muted }}>No recent events.</div>
          )}
          {recentEvents.slice(0, 20).map((evt, i) => {
            const isPush = (evt.type || '').toLowerCase().includes('push')
            const date = evt.created_at
              ? new Date(evt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : ''
            return (
              <div key={i} style={{
                border: `1px solid ${isPush ? T.accent : T.border}`,
                padding: '8px 14px', whiteSpace: 'nowrap',
                ...mono, fontSize: '11px',
                color: isPush ? T.accent : T.muted,
              }}>
                {evt.type} <span style={{ color: T.muted }}>{date}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}