import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { API } from './api'
import { AppContext, useApp } from './context'
import Landing from './components/Landing'
import Scanning from './components/Scanning'
import Dashboard from './components/Dashboard'

function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [data, setData] = useState({
    run: null,
    focus: null,
    growth: null,
    portfolio: null,
    week: null,
    mcpInsight: null,
    schema: null,
  })
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})
  const [dataLoaded, setDataLoaded] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/me`, { withCredentials: true })
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
      const res = await axios.get(`${API}${path}`, { withCredentials: true })
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
    // succeed if at least one endpoint returned data
    setDataLoaded(results.some(r => r !== null))
    return results
  }, [fetchEndpoint])

  const fetchSchema = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/analyze/schema`, { withCredentials: true })
      setData(prev => ({ ...prev, schema: res.data }))
      return res.data
    } catch (e) {
      setErrors(prev => ({ ...prev, schema: e.response?.data?.error || e.message }))
      return null
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const value = {
    user,
    authChecked,
    data,
    loading,
    errors,
    dataLoaded,
    checkAuth,
    fetchAllData,
    fetchEndpoint,
    fetchSchema,
    API,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function AuthGate({ children }) {
  const { user, authChecked } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (!authChecked) return
    // only need github auth to proceed — gmail is optional
    if (user?.authenticated) {
      if (window.location.pathname === '/') {
        navigate('/scanning', { replace: true })
      }
    } else if (!user?.authenticated) {
      if (window.location.pathname === '/dashboard' || window.location.pathname === '/scanning') {
        navigate('/', { replace: true })
      }
    }
  }, [user, authChecked, navigate, searchParams])

  if (!authChecked) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0c0c0e',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          color: '#888896',
          letterSpacing: '0.1em',
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