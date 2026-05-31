import { useState } from 'react'
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

export default function Schema() {
  const { data, loading, errors, fetchSchema } = useApp()
  const schema = data.schema

  const [selectedTable, setSelectedTable] = useState(null)
  const [showAllGithub, setShowAllGithub] = useState(false)

  const handleFetchSchema = async () => {
    await fetchSchema()
  }

  if (loading.schema && !schema) {
    return (
      <div style={{ border: `1px solid ${T.border}`, padding: '40px', position: 'relative', overflow: 'hidden' }} className="scan-line-container">
        <div style={{ ...mono, fontSize: '12px', color: T.muted }}>LOADING SCHEMA...</div>
      </div>
    )
  }

  if (errors.schema) {
    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{ borderLeft: `3px solid ${T.red}`, padding: '14px 20px', ...mono, fontSize: '13px', color: T.red, marginBottom: '16px' }}>
          ERROR: {errors.schema}
        </div>
        <button
          onClick={handleFetchSchema}
          style={{
            padding: '10px 20px',
            border: `1px solid ${T.accent}`,
            background: 'transparent',
            color: T.accent,
            ...mono,
            fontSize: '11px',
            letterSpacing: '0.1em',
            cursor: 'pointer',
          }}
        >
          RETRY
        </button>
      </div>
    )
  }

  if (!schema) {
    return (
      <div>
        <div style={{
          ...heading,
          fontSize: '12px',
          fontWeight: '700',
          color: T.white,
          marginBottom: '20px',
          letterSpacing: '0.1em',
        }}>SCHEMA</div>
        <div style={{
          border: `1px solid ${T.border}`,
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{ ...mono, fontSize: '12px', color: T.muted, marginBottom: '20px' }}>
            Schema data not loaded
          </div>
          <button
            onClick={handleFetchSchema}
            style={{
              padding: '12px 24px',
              border: `1px solid ${T.accent}`,
              background: 'transparent',
              color: T.accent,
              ...mono,
              fontSize: '11px',
              letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          >
            LOAD SCHEMA
          </button>
        </div>
      </div>
    )
  }

  const githubTables = schema.github || []
  const linearTables = schema.linear || []
  const sentryTables = schema.sentry || []

  const totalTables = githubTables.length + linearTables.length + sentryTables.length

  const displayedGithub = showAllGithub ? githubTables : githubTables.slice(0, 30)

  const columns = selectedTable ? (schema.columns?.[selectedTable] || []) : []

  return (
    <div>
      <div style={{
        ...heading,
        fontSize: '12px',
        fontWeight: '700',
        color: T.white,
        marginBottom: '20px',
        letterSpacing: '0.1em',
      }}>SCHEMA</div>

      {/* Top stat */}
      <div style={{ marginBottom: '32px' }}>
        <span style={{
          ...mono,
          fontSize: '48px',
          fontWeight: '600',
          color: T.accent,
        }}>{totalTables}</span>
        <span style={{
          ...mono,
          fontSize: '16px',
          color: T.muted,
          marginLeft: '12px',
        }}>TABLES DISCOVERED</span>
      </div>

      {/* Three columns */}
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* GitHub */}
        <div style={{ flex: 1 }}>
          <div style={{
            ...mono,
            fontSize: '11px',
            color: T.accent,
            letterSpacing: '0.1em',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}>GITHUB</div>
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: `1px solid ${T.border}`,
            padding: '12px',
          }}>
            {displayedGithub.map((table, i) => (
              <div
                key={i}
                onClick={() => setSelectedTable(selectedTable === table ? null : table)}
                style={{
                  padding: '6px 8px',
                  cursor: 'pointer',
                  ...mono,
                  fontSize: '11px',
                  color: selectedTable === table ? T.accent : T.muted,
                  borderBottom: `1px solid ${T.border}`,
                  background: selectedTable === table ? T.surface : 'transparent',
                  letterSpacing: '0.03em',
                  animation: 'fadeIn 200ms ease forwards',
                  animationDelay: `${Math.min(i, 20) * 20}ms`,
                  opacity: 0,
                }}
              >
                {table}
              </div>
            ))}
            {githubTables.length > 30 && (
              <button
                onClick={() => setShowAllGithub(!showAllGithub)}
                style={{
                  padding: '8px',
                  width: '100%',
                  ...mono,
                  fontSize: '10px',
                  color: T.accent,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  marginTop: '8px',
                }}
              >
                {showAllGithub ? 'SHOW LESS' : `SHOW ALL (${githubTables.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Linear */}
        <div style={{ flex: 1 }}>
          <div style={{
            ...mono,
            fontSize: '11px',
            color: T.accent,
            letterSpacing: '0.1em',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}>LINEAR</div>
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: `1px solid ${T.border}`,
            padding: '12px',
          }}>
            {linearTables.map((table, i) => (
              <div
                key={i}
                onClick={() => setSelectedTable(selectedTable === table ? null : table)}
                style={{
                  padding: '6px 8px',
                  cursor: 'pointer',
                  ...mono,
                  fontSize: '11px',
                  color: selectedTable === table ? T.accent : T.muted,
                  borderBottom: `1px solid ${T.border}`,
                  background: selectedTable === table ? T.surface : 'transparent',
                  letterSpacing: '0.03em',
                }}
              >
                {table}
              </div>
            ))}
          </div>
        </div>

        {/* Sentry */}
        <div style={{ flex: 1 }}>
          <div style={{
            ...mono,
            fontSize: '11px',
            color: T.accent,
            letterSpacing: '0.1em',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}>SENTRY</div>
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: `1px solid ${T.border}`,
            padding: '12px',
          }}>
            {sentryTables.map((table, i) => (
              <div
                key={i}
                onClick={() => setSelectedTable(selectedTable === table ? null : table)}
                style={{
                  padding: '6px 8px',
                  cursor: 'pointer',
                  ...mono,
                  fontSize: '11px',
                  color: selectedTable === table ? T.accent : T.muted,
                  borderBottom: `1px solid ${T.border}`,
                  background: selectedTable === table ? T.surface : 'transparent',
                  letterSpacing: '0.03em',
                }}
              >
                {table}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table columns panel */}
      {selectedTable && columns.length > 0 && (
        <div style={{
          marginTop: '24px',
          border: `1px solid ${T.accent}`,
          padding: '20px',
        }}>
          <div style={{
            ...mono,
            fontSize: '11px',
            color: T.accent,
            letterSpacing: '0.1em',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}>
            COLUMNS: {selectedTable}
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            {columns.map((col, i) => (
              <div
                key={i}
                style={{
                  padding: '4px 10px',
                  background: T.elevated,
                  ...mono,
                  fontSize: '11px',
                  color: T.text,
                  letterSpacing: '0.03em',
                }}
              >
                {col}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTable && columns.length === 0 && (
        <div style={{
          marginTop: '24px',
          border: `1px solid ${T.border}`,
          padding: '20px',
          ...mono,
          fontSize: '11px',
          color: T.muted,
        }}>
          No column data available for {selectedTable}
        </div>
      )}
    </div>
  )
}