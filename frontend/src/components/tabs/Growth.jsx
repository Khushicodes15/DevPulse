import { useApp } from '../../context'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

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

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
}

function getLangColor(lang) {
  return LANG_COLORS[lang] || '#888896'
}

export default function Growth() {
  const { data, loading, errors } = useApp()
  const growth = data.growth

  if (loading.growth) {
    return (
      <div style={{ border: `1px solid ${T.border}`, padding: '40px', position: 'relative', overflow: 'hidden' }} className="scan-line-container">
        <div style={{ ...mono, fontSize: '12px', color: T.muted }}>LOADING...</div>
      </div>
    )
  }

  if (errors.growth) {
    return (
      <div style={{ borderLeft: `3px solid ${T.red}`, padding: '14px 20px', ...mono, fontSize: '13px', color: T.red }}>
        ERROR: {errors.growth}
      </div>
    )
  }

  if (!growth) return null

  const trajectory = growth.trajectory || 'Growing'
  const momentum = growth.momentum || 'Steady'
  const consistencyScore = growth.consistencyScore ?? growth.consistency_score ?? 0
  const activeLanguages = growth.activeLanguages ?? growth.active_languages ?? 0
  const monthlyCreation = growth.monthlyCreation || growth.monthly_creation || {}
  const languageTimeline = growth.languageTimeline || growth.language_timeline || []
  const nextMilestone = growth.nextMilestone || growth.next_milestone || ''
  const languageEvolution = growth.languageEvolution || growth.language_evolution || ''

  const chartData = Object.entries(monthlyCreation).map(([month, count]) => ({
    month,
    count,
  }))

  return (
    <div>
      <div style={{
        ...heading,
        fontSize: '12px',
        fontWeight: '700',
        color: T.white,
        marginBottom: '20px',
        letterSpacing: '0.1em',
      }}>GROWTH</div>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {[
          { label: 'TRAJECTORY', value: trajectory },
          { label: 'MOMENTUM', value: momentum },
          { label: 'CONSISTENCY', value: `${consistencyScore}/100` },
          { label: 'ACTIVE LANGUAGES', value: activeLanguages },
        ].map(s => (
          <div key={s.label} style={{
            border: `1px solid ${T.border}`,
            padding: '12px 20px',
            flex: '1 1 auto',
          }}>
            <div style={{
              ...mono,
              fontSize: '10px',
              color: T.muted,
              letterSpacing: '0.1em',
              marginBottom: '4px',
            }}>{s.label}</div>
            <div style={{
              ...mono,
              fontSize: '18px',
              color: T.text,
            }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          padding: '20px',
          marginBottom: '32px',
        }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ ...mono, fontSize: 10, fill: T.muted }}
                axisLine={{ stroke: T.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ ...mono, fontSize: 10, fill: T.muted }}
                axisLine={{ stroke: T.border }}
                tickLine={false}
              />
              <Bar dataKey="count" fill={T.accent} radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Language timeline */}
      {languageTimeline.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            ...mono,
            fontSize: '11px',
            color: T.muted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>LANGUAGE TIMELINE</div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            {languageTimeline.map((item, i) => (
              <div key={i} style={{
                border: `1px solid ${T.border}`,
                padding: '8px 14px',
                whiteSpace: 'nowrap',
                ...mono,
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'fadeIn 200ms ease forwards',
                animationDelay: `${i * 40}ms`,
                opacity: 0,
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: getLangColor(item.language),
                  flexShrink: 0,
                }} />
                <span style={{ color: T.text }}>{item.name}</span>
                <span style={{ color: T.muted }}>{item.language}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI insights */}
      {(nextMilestone || languageEvolution) && (
        <div style={{
          border: `1px solid ${T.border}`,
          padding: '24px',
          borderLeft: `4px solid ${T.accent}`,
        }}>
          {nextMilestone && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                ...mono,
                fontSize: '10px',
                color: T.accent,
                letterSpacing: '0.1em',
                marginBottom: '8px',
              }}>NEXT MILESTONE</div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '15px',
                color: T.text,
                lineHeight: '1.7',
              }}>{nextMilestone}</div>
            </div>
          )}
          {languageEvolution && (
            <div>
              <div style={{
                ...mono,
                fontSize: '10px',
                color: T.accent,
                letterSpacing: '0.1em',
                marginBottom: '8px',
              }}>LANGUAGE EVOLUTION</div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '15px',
                color: T.text,
                lineHeight: '1.7',
              }}>{languageEvolution}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}