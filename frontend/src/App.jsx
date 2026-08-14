import { useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
const tokenKey = 'quiz_platform_token'

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.detail || 'Request failed')
  }
  return data
}

function AuthPanel({ mode, onModeChange, onSubmit, loading, error }) {
  const [name, setName] = useState('Arjun Student')
  const [email, setEmail] = useState('student@example.com')
  const [password, setPassword] = useState('password123')

  return (
    <form
      className="auth-card"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({
          name,
          email,
          password,
          mode,
        })
      }}
    >
      <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          className={mode === 'login' ? 'tab active' : 'tab'}
          onClick={() => onModeChange('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'tab active' : 'tab'}
          onClick={() => onModeChange('register')}
        >
          Register
        </button>
      </div>

      {mode === 'register' ? (
        <label>
          Full name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
        </label>
      ) : null}

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter a password"
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <button className="primary" type="submit" disabled={loading}>
        {loading ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}
      </button>

      <p className="helper">
        API base: <code>{apiBase}</code>
      </p>
    </form>
  )
}

function ProtectedCard({ title, description, items, tone = 'neutral' }) {
  return (
    <section className={`feature-card tone-${tone}`}>
      <div className="feature-heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export default function App() {
  const [mode, setMode] = useState('register')
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) ?? '')
  const [user, setUser] = useState(null)
  const [roleInfo, setRoleInfo] = useState(null)
  const [probeMessage, setProbeMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('Day 2: authentication is wired to the backend.')

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }

    let cancelled = false
    request('/auth/me', { token })
      .then((data) => {
        if (!cancelled) {
          setUser(data)
          setNotice('Signed in and ready for protected routes.')
        }
      })
      .catch(() => {
        localStorage.removeItem(tokenKey)
        if (!cancelled) {
          setToken('')
          setUser(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setRoleInfo(null)
      return
    }

    let cancelled = false
    request('/auth/role', { token })
      .then((data) => {
        if (!cancelled) {
          setRoleInfo(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoleInfo(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const statusText = useMemo(() => {
    if (user) {
      return `${user.name} (${user.role})`
    }
    return 'No active session'
  }, [user])

  async function handleSubmit(payload) {
    setLoading(true)
    setError('')

    try {
      if (payload.mode === 'register') {
        await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            password: payload.password,
            role: 'STUDENT',
          }),
        })
        setMode('login')
        setNotice('Registration complete. You can now log in.')
      } else {
        const form = new URLSearchParams()
        form.set('username', payload.email)
        form.set('password', payload.password)

        const data = await request('/auth/login', {
          method: 'POST',
          body: form.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })

        localStorage.setItem(tokenKey, data.access_token)
        setToken(data.access_token)
        setNotice('Login successful.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      if (token) {
        await request('/auth/logout', { method: 'POST', token })
      }
    } catch {
      // Logout is best-effort for the current stateless token setup.
    } finally {
      localStorage.removeItem(tokenKey)
      setToken('')
      setUser(null)
      setNotice('Session cleared.')
    }
  }

  async function probeAccess(path, label) {
    setProbeMessage(`Checking ${label} access...`)
    try {
      const data = await request(path, { token })
      setProbeMessage(typeof data === 'string' ? data : data.message || `${label} access allowed`)
    } catch (err) {
      setProbeMessage(err instanceof Error ? err.message : `${label} access denied`)
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Quiz Management Platform</p>
          <h1>Role-based access for Day 3</h1>
          <p className="lede">
            FastAPI already protects admin and student routes. The UI now reads the active role and
            shows the correct dashboard so you can verify authorization before quiz work begins.
          </p>

          <div className="status-row">
            <span className="pill">{statusText}</span>
            <span className="notice">{notice}</span>
          </div>
        </div>

        <AuthPanel
          mode={mode}
          onModeChange={setMode}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />

        <section className="session-card">
          <h2>Current session</h2>
          {user ? (
            <>
              <p>
                <strong>{user.name}</strong> - {user.email}
              </p>
              <p>
                Role: <code>{user.role}</code>
              </p>
              <p>
                Status: <code>{user.status}</code>
              </p>
              {roleInfo ? (
                <p>
                  Role endpoint: <code>{roleInfo.role}</code> / <code>{roleInfo.status}</code>
                </p>
              ) : null}
              <button className="secondary" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <p>Register or log in to verify the backend auth flow.</p>
          )}
        </section>

        {user ? (
          <>
            <ProtectedCard
              title="Protected routes"
              description="These checks mirror the Day 3 backend dependencies."
              tone="admin"
              items={[
                'GET /api/v1/auth/me - current authenticated user',
                'GET /api/v1/admin/me - admin-only profile',
                'GET /api/v1/student/me - student-only profile',
              ]}
            />

            {user.role === 'ADMIN' ? (
              <section className="dashboard-grid">
                <ProtectedCard
                  title="Admin dashboard"
                  description="The control panel for managing the platform."
                  tone="admin"
                  items={[
                    'User management',
                    'Quiz management',
                    'Category and question control',
                    'Analytics and leaderboard foundations',
                  ]}
                />
                <div className="action-panel">
                  <h3>Admin route probes</h3>
                  <p>Use the buttons to verify admin-only access.</p>
                  <div className="button-row">
                    <button className="secondary" type="button" onClick={() => probeAccess('/admin/me', 'Admin profile')}>
                      Test admin profile
                    </button>
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => probeAccess('/admin/dashboard', 'Admin dashboard')}
                    >
                      Test admin dashboard
                    </button>
                  </div>
                  {probeMessage ? <p className="helper">{probeMessage}</p> : null}
                </div>
              </section>
            ) : (
              <section className="dashboard-grid">
                <ProtectedCard
                  title="Student dashboard"
                  description="The student experience for quiz participation."
                  tone="student"
                  items={[
                    'Quiz listing and discovery',
                    'Attempt history and results',
                    'Performance tracking',
                    'Leaderboard visibility',
                  ]}
                />
                <div className="action-panel">
                  <h3>Student route probes</h3>
                  <p>Use the buttons to verify student-only access.</p>
                  <div className="button-row">
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => probeAccess('/student/me', 'Student profile')}
                    >
                      Test student profile
                    </button>
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => probeAccess('/student/dashboard', 'Student dashboard')}
                    >
                      Test student dashboard
                    </button>
                  </div>
                  {probeMessage ? <p className="helper">{probeMessage}</p> : null}
                </div>
              </section>
            )}
          </>
        ) : null}
      </section>
    </main>
  )
}
