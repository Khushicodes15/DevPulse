import { useState, useEffect, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { API } from './api'
import { AppContext, useApp } from './context'
import Landing from './components/Landing'
import Scanning from './components/Scanning'
import Dashboard from './components/Dashboard'

// Store sid globally so all requests can use it
let globalSid = null

function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [data, setData] = useState({
    run: null, focus: null, growth: null,
    portfolio: null, week: null, mcpInsight: null, schema: null,
  })
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})
  const [dataLoaded, setDataLoaded] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      // pick up sid from URL if present
      const urlParams = new URLSearchParams(window.location.search)
      const sid = urlParams.get('sid')
      if (sid) globalSid = sid

      const url = globalSid ? `${API}/api/me?sid=${globalSid}` : `${API}/api/me`
      const res = await axios.get(url, { withCredentials: true })
      setUser(res.data)
      return res.data
    } catch {
      setUser(null)
      return null
    } finally {
      setAuthChecked(true)
    }
  }, [])

  const fetchEndpoint = useCallback(async (key, path) => {
    setLoading(prev => ({ ...prev, [key]: true }))
    setErrors(prev => ({ ...prev, [key]: null }))
    try {
      const sep = path.includes('?') ? '&' : '?'
      const fullPath = globalSid ? `${path}${sep}sid=${globalSid}` : path
      const res = await axios.get(`${API}${fullPath}`, { withCredentials: true })
      setData(prev => ({ ...prev, [key]: res.data }))
      return res.data
    } catch (e) {
      const msg = e.response?.data?.error || e.message
      setErrors(prev => ({ ...prev, [key]: msg }))
      return null
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }, [])

  const fetchAllData = useCallback(async () => {
    const endpoints = [
      ['run', '/api/analyze/run'],
      ['focus', '/api/analyze/focus'],
      ['growth', '/api/analyze/growth'],
      ['portfolio', '/api/analyze/portfolio'],
      ['week', '/api/analyze/week'],
      ['mcpInsight', '/api/analyze/mcp-insight'],
    ]
    const results = await Promise.all(
      endpoints.map(([key, path]) => fetchEndpoint(key, path))
    )
    setDataLoaded(results.some(r => r !== null))
    return results
  }, [fetchEndpoint])

  const fetchSchema = useCallback(async () => {
    try {
      const sep = '?'
      const fullPath = globalSid ? `/api/analyze/schema${sep}sid=${globalSid}` : '/api/analyze/schema'
      const res = await axios.get(`${API}${fullPath}`, { withCredentials: true })
      setData(prev => ({ ...prev, schema: res.data }))
      return res.data
    } catch (e) {
      setErrors(prev => ({ ...prev, schema: e.response?.data?.error || e.message }))
      return null
    }
  }, [])

  useEffect(() => {
    // grab sid from URL immediately on mount
    const urlParams = new URLSearchParams(window.location.search)
    const sid = urlParams.get('sid')
    if (sid) globalSid = sid
    checkAuth()
  }, [checkAuth])

  const value = {
    user, authChecked, data, loading, errors, dataLoaded,
    checkAuth, fetchAllData, fetchEndpoint, fetchSchema, API,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function AuthGate({ children }) {
  const { user, authChecked } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (!authChecked) return
    if (user?.authenticated) {
      if (window.location.pathname === '/') {
        navigate('/scanning', { replace: true })
      }
    } else {
      // only redirect to landing if explicitly not authenticated
      // and not on a page with a sid param (mid-auth flow)
      const sid = searchParams.get('sid')
      if (!sid && (window.location.pathname === '/dashboard' || window.location.pathname === '/scanning')) {
        navigate('/', { replace: true })
      }
    }
  }, [user, authChecked, navigate, searchParams])

  if (!authChecked) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#0c0c0e',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px', color: '#888896', letterSpacing: '0.1em',
        }}>INITIALIZING...</div>
      </div>
    )
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthGate>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/scanning" element={<Scanning />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthGate>
      </AppProvider>
    </BrowserRouter>
  )
}