import { useApp } from '../../context'

const T = {
  bg: '#0c0c0e',
  surface: '#111114',
  elevated: '#1a1a1f',
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

export default function Portfolio() {
  const { data, loading, errors } = useApp()
  const portfolio = data.portfolio

  if (loading.portfolio) {
    return (
      <div style={{ border: `1px solid ${T.border}`, padding: '40px', position: 'relative', overflow: 'hidden' }} className="scan-line-container">
        <div style={{ ...mono, fontSize: '12px', color: T.muted }}>LOADING...</div>
      </div>
    )
  }

  if (errors.portfolio) {
    return (
      <div style={{ borderLeft: `3px solid ${T.red}`, padding: '14px 20px', ...mono, fontSize: '13px', color: T.red }}>
        ERROR: {errors.portfolio}
      </div>
    )
  }

  if (!portfolio) return null

  const ai = portfolio.ai || {}
  const headline = ai.headline || portfolio.headline || ''
  const stats = portfolio.stats || {}
  const repos = portfolio.repos || portfolio.repositories || []
  const flagship = portfolio.flagshipProjects || portfolio.flagship_projects || []
  const gaps = portfolio.gaps || []
  const quickWins = portfolio.quickWins || portfolio.quick_wins || []

  const totalRepos = stats.totalRepos || stats.total_repos || repos.length
  const withDescriptions = stats.withDescriptions || stats.with_descriptions || 0
  const starred = stats.starred || 0
  const activeLastMonth = stats.activeLastMonth || stats.active_last_month || 0

  return (
    <div>
      <div style={{
        ...heading,
        fontSize: '12px',
        fontWeight: '700',
        color: T.white,
        marginBottom: '20px',
        letterSpacing: '0.1em',
      }}>PORTFOLIO</div>

      {/* Headline */}
      {headline && (
        <div style={{
          ...heading,
          fontSize: '22px',
          fontWeight: '700',
          color: T.white,
          marginBottom: '24px',
          borderBottom: `1px solid ${T.border}`,
          paddingBottom: '20px',
        }}>
          {headline}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1px', marginBottom: '32px' }}>
        {[
          { label: 'TOTAL REPOS', value: totalRepos },
          { label: 'WITH DESCRIPTIONS', value: withDescriptions },
          { label: 'STARRED', value: starred },
          { label: 'ACTIVE LAST MONTH', value: activeLastMonth },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, border: `1px solid ${T.border}`, padding: '16px 20px' }}>
            <div style={{ ...mono, fontSize: '28px', fontWeight: '600', color: T.text, lineHeight: '1', marginBottom: '6px' }}>{s.value}</div>
            <div style={{ ...mono, fontSize: '10px', color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Flagship projects */}
      {flagship.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            ...mono,
            fontSize: '11px',
            color: T.muted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>FLAGSHIP PROJECTS</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            {flagship.slice(0, 3).map((proj, i) => (
              <div key={i} style={{
                flex: 1,
                border: `1px solid ${T.accent}`,
                padding: '20px',
                animation: 'fadeIn 200ms ease forwards',
                animationDelay: `${i * 80}ms`,
                opacity: 0,
              }}>
                <div style={{
                  ...heading,
                  fontSize: '14px',
                  fontWeight: '700',
                  color: T.white,
                  marginBottom: '8px',
                  letterSpacing: '0.04em',
                }}>
                  {proj.name || proj.repo_name || 'Untitled'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  {proj.language && (
                    <span style={{
                      ...mono,
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: T.elevated,
                      color: T.muted,
                      letterSpacing: '0.05em',
                    }}>
                      {proj.language}
                    </span>
                  )}
                  <span style={{ ...mono, fontSize: '12px', color: T.accent }}>
                    {proj.stars || proj.stargazers || 0} ★
                  </span>
                </div>
                <div style={{
                  ...mono,
                  fontSize: '11px',
                  color: T.muted,
                }}>
                  {proj.pushedAt || proj.last_pushed
                    ? `Last pushed: ${new Date(proj.pushedAt || proj.last_pushed).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                    : 'No recent activity'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All repos table */}
      {repos.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            ...mono,
            fontSize: '11px',
            color: T.muted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>ALL REPOSITORIES</div>
          <div style={{ border: `1px solid ${T.border}` }}>
            <div style={{
              display: 'flex',
              borderBottom: `1px solid ${T.border}`,
              padding: '10px 16px',
              ...mono,
              fontSize: '10px',
              color: T.muted,
              letterSpacing: '0.1em',
            }}>
              <div style={{ flex: '0 0 35%' }}>NAME</div>
              <div style={{ flex: '0 0 15%' }}>LANGUAGE</div>
              <div style={{ flex: '0 0 10%' }}>STARS</div>
              <div style={{ flex: '0 0 20%' }}>LAST PUSHED</div>
              <div style={{ flex: '0 0 20%' }}>STATUS</div>
            </div>
            {repos.map((repo, i) => {
              const lastPushed = repo.pushedAt || repo.pushed_at || repo.updated_at
              const ninetyDaysAgo = new Date()
              ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
              const isActive = lastPushed && new Date(lastPushed) > ninetyDaysAgo
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    padding: '8px 16px',
                    height: '32px',
                    alignItems: 'center',
                    background: i % 2 === 0 ? T.surface : T.bg,
                    borderBottom: `1px solid ${T.border}`,
                    animation: 'fadeIn 200ms ease forwards',
                    animationDelay: `${i * 30}ms`,
                    opacity: 0,
                  }}
                >
                  <div style={{ flex: '0 0 35%', ...mono, fontSize: '11px', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {repo.name || 'Untitled'}
                  </div>
                  <div style={{ flex: '0 0 15%', ...mono, fontSize: '11px', color: T.muted }}>
                    {repo.language || '-'}
                  </div>
                  <div style={{ flex: '0 0 10%', ...mono, fontSize: '11px', color: T.text }}>
                    {repo.stars || repo.stargazers_count || 0}
                  </div>
                  <div style={{ flex: '0 0 20%', ...mono, fontSize: '11px', color: T.muted }}>
                    {lastPushed ? new Date(lastPushed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '-'}
                  </div>
                  <div style={{ flex: '0 0 20%' }}>
                    <span style={{
                      ...mono,
                      fontSize: '10px',
                      color: isActive ? T.accent : T.muted,
                      letterSpacing: '0.05em',
                    }}>
                      {isActive ? 'ACTIVE' : 'STALE'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Gaps and Quick Wins */}
      <div style={{ display: 'flex', gap: '32px' }}>
        {gaps.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{
              ...mono,
              fontSize: '11px',
              color: T.muted,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>GAPS</div>
            <div style={{ borderTop: `1px solid ${T.border}` }}>
              {gaps.map((gap, i) => (
                <div key={i} style={{
                  padding: '10px 0',
                  borderBottom: `1px solid ${T.border}`,
                  ...mono,
                  fontSize: '12px',
                  color: T.text,
                  lineHeight: '1.6',
                }}>
                  {typeof gap === 'string' ? gap : (gap.text || gap.description || '')}
                </div>
              ))}
            </div>
          </div>
        )}
        {quickWins.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{
              ...mono,
              fontSize: '11px',
              color: T.muted,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>QUICK WINS</div>
            <div style={{ borderTop: `1px solid ${T.border}` }}>
              {quickWins.map((win, i) => (
                <div key={i} style={{
                  padding: '10px 0',
                  borderBottom: `1px solid ${T.border}`,
                  ...mono,
                  fontSize: '12px',
                  color: T.accent,
                  lineHeight: '1.6',
                }}>
                  › {typeof win === 'string' ? win : (win.text || win.description || '')}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}