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

export default function CrossSource() {
  const { data, loading, errors } = useApp()
  const insight = data.mcpInsight

  if (loading.mcpInsight) {
    return (
      <div style={{ border: `1px solid ${T.border}`, padding: '40px', position: 'relative', overflow: 'hidden' }} className="scan-line-container">
        <div style={{ ...mono, fontSize: '12px', color: T.muted }}>LOADING...</div>
      </div>
    )
  }

  if (errors.mcpInsight) {
    return (
      <div style={{ borderLeft: `3px solid ${T.red}`, padding: '14px 20px', ...mono, fontSize: '13px', color: T.red }}>
        ERROR: {errors.mcpInsight}
      </div>
    )
  }

  if (!insight) return null

  const insightText = insight.insight || insight.ai_insight || ''
  const correlation = insight.correlation || ''
  const signal = insight.signal || ''
  const confidence = insight.confidence || insight.confidence_score || 0
  const sources = insight.sources || {}
  const queries = insight.queries || insight.sql_queries || []

  return (
    <div>
      <div style={{
        ...heading,
        fontSize: '12px',
        fontWeight: '700',
        color: T.white,
        marginBottom: '20px',
        letterSpacing: '0.1em',
      }}>CROSS-SOURCE</div>

      {/* Coral MCP banner */}
      <div style={{
        background: T.surface,
        border: `1px solid ${T.accent}`,
        padding: '14px 20px',
        marginBottom: '32px',
        ...mono,
        fontSize: '11px',
        color: T.accent,
        letterSpacing: '0.05em',
        lineHeight: '1.6',
      }}>
        CORAL MCP · TRANSPORT: mcp-stdio · SOURCES: github × linear × sentry · REAL-TIME CROSS-SOURCE JOIN
      </div>

      {/* Two columns */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
        {/* Left: AI Insight */}
        <div style={{ flex: '0 0 50%' }}>
          <div style={{
            ...mono,
            fontSize: '11px',
            color: T.muted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>CROSS-SOURCE INTELLIGENCE</div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '18px',
            color: T.text,
            lineHeight: '1.7',
            marginBottom: '20px',
          }}>
            {insightText}
          </div>

          {correlation && (
            <div style={{
              ...mono,
              fontSize: '12px',
              color: T.muted,
              marginBottom: '16px',
            }}>
              {correlation}
            </div>
          )}

          {signal && (
            <div style={{
              borderLeft: `3px solid ${T.accent}`,
              paddingLeft: '16px',
              marginBottom: '20px',
            }}>
              <div style={{
                ...mono,
                fontSize: '10px',
                color: T.accent,
                letterSpacing: '0.1em',
                marginBottom: '6px',
              }}>SIGNAL</div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '14px',
                color: T.text,
                lineHeight: '1.6',
              }}>
                {signal}
              </div>
            </div>
          )}

          {confidence > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                ...mono,
                fontSize: '10px',
                color: T.muted,
                letterSpacing: '0.1em',
              }}>CONFIDENCE</span>
              <span style={{
                ...mono,
                fontSize: '16px',
                color: confidence >= 80 ? T.accent : T.text,
              }}>
                {confidence}%
              </span>
            </div>
          )}
        </div>

        {/* Right: Raw data panels */}
        <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {['github', 'linear', 'sentry'].map(source => {
            const sourceData = sources[source] || sources[source + '_data'] || []
            const sourceLabel = source.toUpperCase()
            return (
              <div key={source} style={{
                border: `1px solid ${T.border}`,
                padding: '16px',
              }}>
                <div style={{
                  ...mono,
                  fontSize: '10px',
                  color: T.accent,
                  letterSpacing: '0.1em',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                }}>
                  {sourceLabel}.{source === 'github' ? 'user_repos' : source === 'linear' ? 'issues' : 'issues'} VIA MCP
                </div>
                {Array.isArray(sourceData) && sourceData.slice(0, 5).map((row, i) => (
                  <div
                    key={i}
                    style={{
                      ...mono,
                      fontSize: '11px',
                      color: T.muted,
                      lineHeight: '1.8',
                      borderBottom: `1px solid ${T.border}`,
                      paddingBottom: '4px',
                      marginBottom: '4px',
                    }}
                  >
                    {typeof row === 'object' ? Object.values(row).slice(0, 3).join(' · ') : row}
                  </div>
                ))}
                {(!Array.isArray(sourceData) || sourceData.length === 0) && (
                  <div style={{ ...mono, fontSize: '11px', color: T.muted }}>
                    No data available
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* SQL queries */}
      {queries.length > 0 && (
        <div>
          <div style={{
            ...mono,
            fontSize: '11px',
            color: T.muted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>SQL QUERIES RUN</div>
          <div style={{
            background: '#080810',
            border: `1px solid ${T.border}`,
            borderLeft: `3px solid ${T.accent}`,
            padding: '20px 24px',
          }}>
            {queries.map((q, i) => (
              <div
                key={i}
                style={{
                  ...mono,
                  fontSize: '12px',
                  color: '#aaa',
                  lineHeight: '2',
                  borderBottom: `1px solid ${T.border}`,
                  paddingBottom: '8px',
                  marginBottom: '8px',
                  animation: 'fadeIn 200ms ease forwards',
                  animationDelay: `${i * 60}ms`,
                  opacity: 0,
                }}
              >
                {q}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}