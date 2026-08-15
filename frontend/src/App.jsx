import { useEffect, useMemo, useRef, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api/v1'
const tokenKey = 'quiz_platform_token'

async function request(path, options = {}) {
  const headers = new Headers(options.headers ?? {})
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.detail || 'Request failed')
  }
  return data
}

function AuthPanel({ mode, onModeChange, onSubmit, loading, error, showModeToggle = true }) {
  const [name, setName] = useState('Arjun Student')
  const [email, setEmail] = useState('student@example.com')
  const [password, setPassword] = useState('password123')
  const panelTitle = mode === 'login' ? 'Welcome back' : 'Create your account'
  const panelSubtitle =
    mode === 'login'
      ? 'Sign in with your email and password to continue.'
      : 'Start a new student account and join the platform.'

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
      <div className="auth-panel-head">
        {mode === 'login' || mode === 'register' ? (
          <div className="auth-avatar" aria-hidden="true">
            <UserOutlineIcon />
          </div>
        ) : null}
        <p className="auth-badge">Account access</p>
        <h2>{panelTitle}</h2>
        <p>{panelSubtitle}</p>
      </div>

      {showModeToggle ? (
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
      ) : null}

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

      {mode === 'login' ? (
        <button
          type="button"
          className="auth-forgot-password"
          onClick={() => {
            setPassword('')
          }}
        >
          Forgot password?
        </button>
      ) : null}

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

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function UserOutlineIcon({ className = '' }) {
  return (
    <svg
      className={`user-outline-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19c1.4-3.2 4.1-5 6.5-5s5.1 1.8 6.5 5" />
    </svg>
  )
}

export default function App() {
  const [mode, setMode] = useState('register')
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) ?? '')
  const [pathname, setPathname] = useState(() => window.location.pathname || '/')
  const [user, setUser] = useState(null)
  const [roleInfo, setRoleInfo] = useState(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [studentActiveTab, setStudentActiveTab] = useState('start-quiz')
  const [probeMessage, setProbeMessage] = useState('')
  const [studentQuizzes, setStudentQuizzes] = useState([])
  const [selectedStudentQuizId, setSelectedStudentQuizId] = useState('')
  const [selectedStudentQuiz, setSelectedStudentQuiz] = useState(null)
  const [studentStartInfo, setStudentStartInfo] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [studentAnswers, setStudentAnswers] = useState({})
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [studentSubmissionResult, setStudentSubmissionResult] = useState(null)
  const [submittingAttempt, setSubmittingAttempt] = useState(false)
  const [studentAttempts, setStudentAttempts] = useState([])
  const [selectedAttemptHistoryId, setSelectedAttemptHistoryId] = useState('')
  const [selectedAttemptReview, setSelectedAttemptReview] = useState(null)
  const [studentDashboard, setStudentDashboard] = useState(null)
  const [studentLeaderboard, setStudentLeaderboard] = useState(null)
  const [selectedLeaderboardCategory, setSelectedLeaderboardCategory] = useState('')
  const [adminStats, setAdminStats] = useState(null)
  const [adminAnalytics, setAdminAnalytics] = useState(null)
  const [adminUsers, setAdminUsers] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [categories, setCategories] = useState([])
  const [questions, setQuestions] = useState([])
  const [adminQuery, setAdminQuery] = useState('')
  const [adminStatusFilter, setAdminStatusFilter] = useState('')
  const [quizQuery, setQuizQuery] = useState('')
  const [quizStatusFilter, setQuizStatusFilter] = useState('')
  const [selectedQuizId, setSelectedQuizId] = useState('')
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    category: 'Python',
    difficulty: 'Intermediate',
    duration: 20,
    passing_score: 60,
    max_attempts: 1,
    status: 'DRAFT',
    thumbnail_url: '',
  })
  const [editingQuizId, setEditingQuizId] = useState(null)
  const [categoryQuery, setCategoryQuery] = useState('')
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  })
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [questionForm, setQuestionForm] = useState({
    quiz_id: '',
    question_text: '',
    marks: 1,
    explanation: '',
    difficulty: 'Intermediate',
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ],
  })
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [adminMessage, setAdminMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('Day 2: authentication is wired to the backend.')
  const profileMenuRef = useRef(null)

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
          if (pathname === '/login' || pathname === '/register' || pathname === '/auth') {
            navigate(data.role === 'ADMIN' ? '/admin' : '/student')
          }
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

  useEffect(() => {
    if (!token || user?.role !== 'STUDENT') {
      setStudentQuizzes([])
      setSelectedStudentQuiz(null)
      setStudentStartInfo(null)
      setStudentAnswers({})
      setStudentSubmissionResult(null)
      setSubmittingAttempt(false)
      setStudentAttempts([])
      setSelectedAttemptHistoryId('')
      setSelectedAttemptReview(null)
      setStudentDashboard(null)
      setStudentLeaderboard(null)
      setSelectedLeaderboardCategory('')
      setCurrentQuestionIndex(0)
      setRemainingSeconds(0)
      return
    }

    let cancelled = false

    async function loadStudentQuizzes() {
      try {
        const data = await request('/student/quizzes', { token })
        if (!cancelled) {
          setStudentQuizzes(data.items ?? [])
          if (!selectedStudentQuizId && (data.items ?? []).length > 0) {
            const firstQuiz = data.items[0]
            setSelectedStudentQuizId(String(firstQuiz.id))
          }
        }
      } catch (err) {
        if (!cancelled) {
          setProbeMessage(err instanceof Error ? err.message : 'Unable to load student quizzes')
        }
      }
    }

    loadStudentQuizzes()

    return () => {
      cancelled = true
    }
  }, [token, user?.role, selectedStudentQuizId])

  useEffect(() => {
    if (!token || user?.role !== 'STUDENT') {
      return
    }

    let cancelled = false

    async function loadStudentAttempts() {
      try {
        const data = await request('/student/attempts', { token })
        if (!cancelled) {
          setStudentAttempts(data.items ?? [])
          if (!selectedAttemptHistoryId && (data.items ?? []).length > 0) {
            const latestAttempt = (data.items ?? []).find((item) => item.status === 'SUBMITTED') ?? data.items[0]
            setSelectedAttemptHistoryId(String(latestAttempt.attempt_id))
          }
        }
      } catch (err) {
        if (!cancelled) {
          setProbeMessage(err instanceof Error ? err.message : 'Unable to load attempt history')
        }
      }
    }

    loadStudentAttempts()

    return () => {
      cancelled = true
    }
  }, [token, user?.role])

  useEffect(() => {
    if (!token || user?.role !== 'STUDENT') {
      setStudentLeaderboard(null)
      return
    }

    let cancelled = false
    const params = new URLSearchParams()
    if (selectedLeaderboardCategory) {
      params.set('category', selectedLeaderboardCategory)
    }

    request(`/student/leaderboard${params.toString() ? `?${params.toString()}` : ''}`, { token })
      .then((data) => {
        if (!cancelled) {
          setStudentLeaderboard(data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProbeMessage(err instanceof Error ? err.message : 'Unable to load leaderboard')
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, user?.role, selectedLeaderboardCategory])

  useEffect(() => {
    if (!token || user?.role !== 'STUDENT') {
      setStudentDashboard(null)
      return
    }

    let cancelled = false

    request('/student/dashboard', { token })
      .then((data) => {
        if (!cancelled) {
          setStudentDashboard(data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProbeMessage(err instanceof Error ? err.message : 'Unable to load student dashboard')
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, user?.role])

  useEffect(() => {
    if (!token || user?.role !== 'STUDENT' || !selectedAttemptHistoryId) {
      setSelectedAttemptReview(null)
      return
    }

    let cancelled = false

    request(`/student/attempts/${selectedAttemptHistoryId}`, { token })
      .then((data) => {
        if (!cancelled) {
          setSelectedAttemptReview(data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProbeMessage(err instanceof Error ? err.message : 'Unable to load attempt review')
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, user?.role, selectedAttemptHistoryId])

  useEffect(() => {
    if (!token || user?.role !== 'STUDENT' || !selectedStudentQuizId) {
      setSelectedStudentQuiz(null)
      return
    }

    let cancelled = false

    request(`/student/quizzes/${selectedStudentQuizId}`, { token })
      .then((data) => {
        if (!cancelled) {
          setSelectedStudentQuiz(data)
          setCurrentQuestionIndex(0)
          setStudentAnswers({})
          setStudentStartInfo(null)
          setStudentSubmissionResult(null)
          setSubmittingAttempt(false)
          setRemainingSeconds(data.duration * 60)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProbeMessage(err instanceof Error ? err.message : 'Unable to load quiz details')
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, user?.role, selectedStudentQuizId])

  useEffect(() => {
    if (!studentStartInfo?.expires_at) {
      return
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(studentStartInfo.expires_at).getTime() - Date.now()) / 1000),
      )
      setRemainingSeconds(remaining)
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [studentStartInfo?.expires_at])

  useEffect(() => {
    if (!studentStartInfo || studentSubmissionResult || submittingAttempt) {
      return
    }

    if (remainingSeconds === 0) {
      void submitAttempt(true)
    }
  }, [remainingSeconds, studentStartInfo, studentSubmissionResult, submittingAttempt])

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      setAdminStats(null)
      setAdminAnalytics(null)
      setAdminUsers([])
      setQuizzes([])
      setCategories([])
      setQuestions([])
      return
    }

    let cancelled = false

    async function loadAdminData() {
      try {
        const params = new URLSearchParams()
        if (adminQuery.trim()) {
          params.set('search', adminQuery.trim())
        }
        if (adminStatusFilter) {
          params.set('status', adminStatusFilter)
        }

        const [stats, users, analytics] = await Promise.all([
          request('/admin/dashboard', { token }),
          request(`/admin/users${params.toString() ? `?${params.toString()}` : ''}`, { token }),
          request('/admin/analytics', { token }),
        ])

        if (!cancelled) {
          setAdminStats(stats)
          setAdminUsers(users.items ?? [])
          setAdminAnalytics(analytics)
        }
      } catch (err) {
        if (!cancelled) {
          setAdminMessage(err instanceof Error ? err.message : 'Unable to load admin data')
        }
      }
    }

    loadAdminData()

    return () => {
      cancelled = true
    }
  }, [token, user?.role, adminQuery, adminStatusFilter])

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      setQuizzes([])
      return
    }

    let cancelled = false

    async function loadQuizData() {
      try {
        const params = new URLSearchParams()
        if (quizQuery.trim()) {
          params.set('search', quizQuery.trim())
        }
        if (quizStatusFilter) {
          params.set('status', quizStatusFilter)
        }

        const data = await request(`/admin/quizzes${params.toString() ? `?${params.toString()}` : ''}`, { token })
        if (!cancelled) {
          setQuizzes(data.items ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setAdminMessage(err instanceof Error ? err.message : 'Unable to load quizzes')
        }
      }
    }

    loadQuizData()

    return () => {
      cancelled = true
    }
  }, [token, user?.role, quizQuery, quizStatusFilter])

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      setCategories([])
      return
    }

    let cancelled = false
    request(`/admin/categories${categoryQuery.trim() ? `?search=${encodeURIComponent(categoryQuery.trim())}` : ''}`, {
      token,
    })
      .then((data) => {
        if (!cancelled) {
          setCategories(data.items ?? [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAdminMessage(err instanceof Error ? err.message : 'Unable to load categories')
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, user?.role, categoryQuery])

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN' || !selectedQuizId) {
      setQuestions([])
      return
    }

    let cancelled = false
    request(`/admin/quizzes/${selectedQuizId}/questions`, { token })
      .then((data) => {
        if (!cancelled) {
          setQuestions(data.items ?? [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAdminMessage(err instanceof Error ? err.message : 'Unable to load questions')
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, user?.role, selectedQuizId])

  useEffect(() => {
    if (!selectedQuizId && quizzes.length > 0) {
      setSelectedQuizId(String(quizzes[0].id))
      setQuestionForm((current) => ({ ...current, quiz_id: String(quizzes[0].id) }))
    }
  }, [quizzes, selectedQuizId])

  const statusText = useMemo(() => {
    if (user) {
      return `${user.name} (${user.role})`
    }
    return 'No active session'
  }, [user])

  const timerLabel = useMemo(() => {
    const total = Math.max(0, remainingSeconds)
    const minutes = String(Math.floor(total / 60)).padStart(2, '0')
    const seconds = String(total % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  }, [remainingSeconds])

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
        navigate('/login')
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
      navigate('/login')
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

  async function refreshAdminData() {
    if (!token || user?.role !== 'ADMIN') {
      return
    }

    try {
      const params = new URLSearchParams()
      if (adminQuery.trim()) {
        params.set('search', adminQuery.trim())
      }
      if (adminStatusFilter) {
        params.set('status', adminStatusFilter)
      }

      const [stats, users, analytics] = await Promise.all([
        request('/admin/dashboard', { token }),
        request(`/admin/users${params.toString() ? `?${params.toString()}` : ''}`, { token }),
        request('/admin/analytics', { token }),
      ])
      setAdminStats(stats)
      setAdminUsers(users.items ?? [])
      setAdminAnalytics(analytics)
      setAdminMessage('Admin data refreshed.')
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Refresh failed')
    }
  }

  async function refreshQuizzes() {
    if (!token || user?.role !== 'ADMIN') {
      return
    }

    try {
      const params = new URLSearchParams()
      if (quizQuery.trim()) {
        params.set('search', quizQuery.trim())
      }
      if (quizStatusFilter) {
        params.set('status', quizStatusFilter)
      }
      const data = await request(`/admin/quizzes${params.toString() ? `?${params.toString()}` : ''}`, {
        token,
      })
      setQuizzes(data.items ?? [])
      setAdminMessage('Quiz list refreshed.')
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Unable to refresh quizzes')
    }
  }

  async function refreshCategories() {
    if (!token || user?.role !== 'ADMIN') {
      return
    }

    try {
      const params = new URLSearchParams()
      if (categoryQuery.trim()) {
        params.set('search', categoryQuery.trim())
      }
      const data = await request(`/admin/categories${params.toString() ? `?${params.toString()}` : ''}`, {
        token,
      })
      setCategories(data.items ?? [])
      setAdminMessage('Categories refreshed.')
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Unable to refresh categories')
    }
  }

  async function refreshQuestions(quizId = selectedQuizId) {
    if (!token || user?.role !== 'ADMIN' || !quizId) {
      return
    }

    try {
      const data = await request(`/admin/quizzes/${quizId}/questions`, { token })
      setQuestions(data.items ?? [])
      setAdminMessage('Questions refreshed.')
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Unable to refresh questions')
    }
  }

  async function updateUserStatus(userId, currentIsActive) {
    try {
      await request(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          is_active: !currentIsActive,
          status: currentIsActive ? 'INACTIVE' : 'ACTIVE',
        }),
      })
      setAdminMessage('User status updated.')
      await refreshAdminData()
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Unable to update user status')
    }
  }

  async function deleteUser(userId) {
    try {
      await request(`/admin/users/${userId}`, { method: 'DELETE', token })
      setAdminMessage('User deleted.')
      await refreshAdminData()
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Unable to delete user')
    }
  }

  function startQuizEdit(quiz) {
    setEditingQuizId(quiz.id)
    setQuizForm({
      title: quiz.title,
      description: quiz.description ?? '',
      category: quiz.category,
      difficulty: quiz.difficulty,
      duration: quiz.duration,
      passing_score: quiz.passing_score,
      max_attempts: quiz.max_attempts,
      status: quiz.status,
      thumbnail_url: quiz.thumbnail_url ?? '',
    })
  }

  function resetQuizForm() {
    setEditingQuizId(null)
    setQuizForm({
      title: '',
      description: '',
      category: 'Python',
      difficulty: 'Intermediate',
      duration: 20,
      passing_score: 60,
      max_attempts: 1,
      status: 'DRAFT',
      thumbnail_url: '',
    })
  }

  async function saveQuiz(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...quizForm,
        duration: Number(quizForm.duration),
        passing_score: Number(quizForm.passing_score),
        max_attempts: Number(quizForm.max_attempts),
        description: quizForm.description || null,
        thumbnail_url: quizForm.thumbnail_url || null,
      }

      const path = editingQuizId ? `/admin/quizzes/${editingQuizId}` : '/admin/quizzes'
      const method = editingQuizId ? 'PUT' : 'POST'
      await request(path, {
        method,
        token,
        body: JSON.stringify(payload),
      })
      setAdminMessage(editingQuizId ? 'Quiz updated.' : 'Quiz created.')
      resetQuizForm()
      await refreshQuizzes()
      await refreshAdminData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save quiz')
    } finally {
      setLoading(false)
    }
  }

  async function toggleQuizPublish(quiz) {
    try {
      await request(`/admin/quizzes/${quiz.id}/publish`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          is_published: !quiz.is_published,
          status: quiz.is_published ? 'UNPUBLISHED' : 'PUBLISHED',
        }),
      })
      setAdminMessage(quiz.is_published ? 'Quiz unpublished.' : 'Quiz published.')
      await refreshQuizzes()
      await refreshAdminData()
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Unable to update quiz visibility')
    }
  }

  async function deleteQuiz(quizId) {
    try {
      await request(`/admin/quizzes/${quizId}`, { method: 'DELETE', token })
      setAdminMessage('Quiz deleted.')
      await refreshQuizzes()
      await refreshAdminData()
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Unable to delete quiz')
    }
  }

  function startCategoryEdit(category) {
    setEditingCategoryId(category.id)
    setCategoryForm({
      name: category.name,
      description: category.description ?? '',
    })
  }

  function resetCategoryForm() {
    setEditingCategoryId(null)
    setCategoryForm({
      name: '',
      description: '',
    })
  }

  async function saveCategory(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: categoryForm.name,
        description: categoryForm.description || null,
      }
      const path = editingCategoryId ? `/admin/categories/${editingCategoryId}` : '/admin/categories'
      const method = editingCategoryId ? 'PUT' : 'POST'
      await request(path, {
        method,
        token,
        body: JSON.stringify(payload),
      })
      setAdminMessage(editingCategoryId ? 'Category updated.' : 'Category created.')
      resetCategoryForm()
      await refreshCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save category')
    } finally {
      setLoading(false)
    }
  }

  async function deleteCategory(categoryId) {
    try {
      await request(`/admin/categories/${categoryId}`, { method: 'DELETE', token })
      setAdminMessage('Category deleted.')
      await refreshCategories()
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Unable to delete category')
    }
  }

  function startQuestionEdit(question) {
    setEditingQuestionId(question.id)
    setSelectedQuizId(String(question.quiz_id))
    setQuestionForm({
      quiz_id: String(question.quiz_id),
      question_text: question.question_text,
      marks: question.marks,
      explanation: question.explanation ?? '',
      difficulty: question.difficulty,
      options:
        question.options?.length > 0
          ? question.options.map((option) => ({
              option_text: option.option_text,
              is_correct: option.is_correct,
            }))
          : [
              { option_text: '', is_correct: true },
              { option_text: '', is_correct: false },
              { option_text: '', is_correct: false },
              { option_text: '', is_correct: false },
            ],
    })
  }

  function resetQuestionForm() {
    setEditingQuestionId(null)
    setQuestionForm({
      quiz_id: selectedQuizId,
      question_text: '',
      marks: 1,
      explanation: '',
      difficulty: 'Intermediate',
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
      ],
    })
  }

  function updateQuestionOption(index, key, value) {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [key]: value } : option,
      ),
    }))
  }

  async function saveQuestion(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        quiz_id: Number(questionForm.quiz_id),
        question_text: questionForm.question_text,
        marks: Number(questionForm.marks),
        explanation: questionForm.explanation || null,
        difficulty: questionForm.difficulty,
        options: questionForm.options,
      }

      const path = editingQuestionId ? `/admin/questions/${editingQuestionId}` : `/admin/quizzes/${questionForm.quiz_id}/questions`
      const method = editingQuestionId ? 'PUT' : 'POST'
      await request(path, {
        method,
        token,
        body: JSON.stringify(payload),
      })
      setAdminMessage(editingQuestionId ? 'Question updated.' : 'Question created.')
      resetQuestionForm()
      await refreshQuestions(questionForm.quiz_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save question')
    } finally {
      setLoading(false)
    }
  }

  async function deleteQuestion(questionId) {
    try {
      await request(`/admin/questions/${questionId}`, { method: 'DELETE', token })
      setAdminMessage('Question deleted.')
      await refreshQuestions()
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Unable to delete question')
    }
  }

  async function startSelectedQuiz() {
    if (!selectedStudentQuizId) {
      return
    }

    try {
      const data = await request(`/student/quizzes/${selectedStudentQuizId}/start`, {
        method: 'POST',
        token,
      })
      setStudentStartInfo(data)
      setStudentSubmissionResult(null)
      setSelectedAttemptHistoryId('')
      setSelectedAttemptReview(null)
      setCurrentQuestionIndex(0)
      setRemainingSeconds(Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)))
      setStudentAnswers({})
      setNotice('Quiz started. Timer is running.')
    } catch (err) {
      setProbeMessage(err instanceof Error ? err.message : 'Unable to start quiz')
    }
  }

  function selectAnswer(questionId, optionId) {
    setStudentAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }))
  }

  async function submitAttempt(isAutoSubmit = false) {
    if (!studentStartInfo || submittingAttempt || studentSubmissionResult) {
      return
    }

    setSubmittingAttempt(true)
    setProbeMessage('')

    try {
      const payload = {
        answers: Object.entries(studentAnswers).map(([questionId, selectedOptionId]) => ({
          question_id: Number(questionId),
          selected_option_id: selectedOptionId,
        })),
      }

      const result = await request(`/student/attempts/${studentStartInfo.attempt_id}/submit`, {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      })
      setStudentSubmissionResult(result)
      setSelectedAttemptHistoryId(String(result.attempt_id))
      setSelectedAttemptReview(result)
      setStudentStartInfo(null)
      setStudentAttempts((current) =>
        current.map((item) =>
          item.attempt_id === result.attempt_id
            ? {
                ...item,
                status: result.status,
                submitted_at: result.submitted_at,
                score: result.score,
                total_marks: result.total_marks,
                percentage: result.percentage,
                correct_count: result.correct_count,
                incorrect_count: result.incorrect_count,
                unanswered_count: result.unanswered_count,
                passed: result.passed,
                time_taken_seconds: result.time_taken_seconds,
              }
            : item,
        ),
      )
      try {
        const dashboard = await request('/student/dashboard', { token })
        setStudentDashboard(dashboard)
        const leaderboard = await request(
          `/student/leaderboard${selectedLeaderboardCategory ? `?category=${encodeURIComponent(selectedLeaderboardCategory)}` : ''}`,
          { token },
        )
        setStudentLeaderboard(leaderboard)
      } catch {
        // Best-effort refresh; the submitted result is still shown below.
      }
      setNotice(isAutoSubmit ? 'Time is up. The quiz was submitted automatically.' : 'Quiz submitted successfully.')
    } catch (err) {
      setProbeMessage(err instanceof Error ? err.message : 'Unable to submit quiz')
    } finally {
      setSubmittingAttempt(false)
    }
  }

  const activeStudentQuestion = selectedStudentQuiz?.questions?.[currentQuestionIndex] ?? null
  const answeredCount = Object.keys(studentAnswers).length
  const activeAttemptReview = selectedAttemptReview ?? studentSubmissionResult
  const dashboardAverage = studentDashboard?.average_score ?? 0
  const leaderboardCategoryLabel = studentLeaderboard?.selected_category ?? selectedLeaderboardCategory
  const marketingStats = [
    { label: 'Authentication', value: 'JWT + role guards' },
    { label: 'Operations', value: 'Admin + student workspaces' },
    { label: 'Assessment', value: 'Timed quizzes and scoring' },
    { label: 'Insights', value: 'Analytics + leaderboard' },
  ]
  const authHighlights = [
    {
      label: 'Fast setup',
      value: 'Use the same login contract for student and admin access.',
    },
    {
      label: 'Role routing',
      value: 'The app opens the correct workspace after sign in.',
    },
    {
      label: 'Audit ready',
      value: 'Routes, results, and activity stay visible in one place.',
    },
  ]
  const isLandingPage = pathname === '/'
  const isLoginPage = pathname === '/login' || pathname === '/auth'
  const isRegisterPage = pathname === '/register'
  const isAdminPage = pathname === '/admin'
  const isStudentPage = pathname === '/student'
  const isDashboardPage = pathname === '/dashboard'
  const isWorkspacePage = isAdminPage || isStudentPage || isDashboardPage
  const isStudentRole = user?.role === 'STUDENT'
  const dashboardPath = user?.role === 'ADMIN' ? '/admin' : '/student'
  const workspaceTitle = user?.role === 'ADMIN' ? 'Admin control center' : 'Student learning center'
  const workspaceSubtitle = roleInfo
    ? `${roleInfo.role} · ${roleInfo.status}`
    : user
      ? `${user.role} · ${user.status}`
      : 'Guest access'

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || '/')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setProfileMenuOpen(false)
  }, [pathname, user?.id])

  useEffect(() => {
    if (isStudentPage) {
      setStudentActiveTab('start-quiz')
    }
  }, [isStudentPage])

  useEffect(() => {
    if (!profileMenuOpen) {
      return
    }

    const onPointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [profileMenuOpen])

  useEffect(() => {
    if (!user) {
      if (isDashboardPage || isAdminPage || isStudentPage) {
        navigate('/login')
      }
      return
    }

    if (isDashboardPage) {
      navigate(user.role === 'ADMIN' ? '/admin' : '/student')
    }

    if (isAdminPage && user.role !== 'ADMIN') {
      navigate('/student')
    }

    if (isStudentPage && user.role !== 'STUDENT') {
      navigate('/admin')
    }
  }, [isAdminPage, isDashboardPage, isStudentPage, user])

  useEffect(() => {
    const titleMap = {
      '/': 'QuizFlow | Quiz Management',
      '/login': 'QuizFlow | Sign In',
      '/register': 'QuizFlow | Register',
      '/dashboard': 'QuizFlow | Dashboard',
      '/admin': 'QuizFlow | Admin',
      '/student': 'QuizFlow | Student',
    }
    document.title = titleMap[pathname] ?? 'QuizFlow'
  }, [pathname])

  useEffect(() => {
    document.body.classList.add('theme-frozen-teal')
    return () => {
      document.body.classList.remove('theme-frozen-teal')
    }
  }, [])

  function navigate(to) {
    if (!to || to === pathname) {
      return
    }
    setProfileMenuOpen(false)
    window.history.pushState({}, '', to)
    setPathname(to)
  }

  function openWorkspaceDetails() {
    if (!user) {
      navigate('/login')
      return
    }
    navigate(dashboardPath)
  }

  function scrollToStudentSection(sectionId, tabName) {
    if (!user) {
      navigate('/login')
      return
    }

    if (!isStudentPage) {
      navigate('/student')
      return
    }

    setStudentActiveTab(tabName)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">Q</div>
          <div>
            <p className="brand-name">QuizFlow</p>
            <p className="brand-subtitle">Assessment operations workspace</p>
          </div>
        </div>

        <nav className="topbar-nav" aria-label="Primary">
          {!user ? (
            <>
              <button
                type="button"
                className={isLandingPage ? 'topbar-link active' : 'topbar-link'}
                onClick={() => navigate('/')}
              >
                Home
              </button>
              <button
                type="button"
                className={isLoginPage ? 'topbar-link active' : 'topbar-link'}
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button
                type="button"
                className={isRegisterPage ? 'topbar-link active' : 'topbar-link'}
                onClick={() => navigate('/register')}
              >
                Register
              </button>
            </>
          ) : isStudentRole ? (
            <>
              <button
                type="button"
                className={studentActiveTab === 'start-quiz' ? 'topbar-link active' : 'topbar-link'}
                onClick={() => scrollToStudentSection('student-quizzes', 'start-quiz')}
              >
                Start quiz
              </button>
              <button
                type="button"
                className={studentActiveTab === 'ranking' ? 'topbar-link active' : 'topbar-link'}
                onClick={() => scrollToStudentSection('student-ranking', 'ranking')}
              >
                Ranking
              </button>
              <button
                type="button"
                className={studentActiveTab === 'quiz-details' ? 'topbar-link active' : 'topbar-link'}
                onClick={() => scrollToStudentSection('quiz-details', 'quiz-details')}
              >
                Quiz details
              </button>
            </>
          ) : (
            <>
              <button type="button" className="topbar-link active" onClick={openWorkspaceDetails}>
                Dashboard
              </button>
              <span className="topbar-status topbar-role-status">{workspaceSubtitle}</span>
            </>
          )}

          <div className="profile-menu-anchor" ref={profileMenuRef}>
            <button
              type="button"
              className="profile-button"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((current) => !current)}
            >
              <UserOutlineIcon className="profile-icon" />
            </button>

            {profileMenuOpen ? (
              <div className="profile-menu" role="menu" aria-label="Profile menu">
                <div className="profile-menu-header">
                  <div className="profile-menu-avatar">
                    <span>{user?.name?.trim()?.charAt(0)?.toUpperCase() ?? 'Q'}</span>
                  </div>
                  <div>
                    <p className="profile-menu-title">{user ? user.name : 'Guest user'}</p>
                    <p className="profile-menu-subtitle">
                      {user ? user.email : 'Sign in to unlock your workspace'}
                    </p>
                    <div className="profile-menu-badges">
                      <span>{user ? user.role : 'GUEST'}</span>
                      <span>{user ? user.status : 'SIGNED OUT'}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-menu-body">
                  <button type="button" className="profile-menu-item" onClick={openWorkspaceDetails}>
                    <strong>My Account</strong>
                    <span>{user ? workspaceTitle : 'Open sign in'}</span>
                  </button>
                  <button
                    type="button"
                    className="profile-menu-item"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      setNotice('Profile update panel will be added in the next day.')
                    }}
                  >
                    <strong>Update Profile</strong>
                    <span>Change account details and preferences</span>
                  </button>
                  <button
                    type="button"
                    className="profile-menu-item"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      setNotice('Settings panel is coming in a later task.')
                    }}
                  >
                    <strong>Settings</strong>
                    <span>Manage alerts, privacy, and display options</span>
                  </button>
                  {roleInfo ? (
                    <div className="profile-menu-meta">
                      <span>Workspace</span>
                      <strong>{workspaceTitle}</strong>
                      <p>
                        {user?.name} - {user?.email}
                      </p>
                      <p>
                        Endpoint status: <code>{roleInfo.role}</code> / <code>{roleInfo.status}</code>
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="profile-menu-footer">
                  {user ? (
                    <button type="button" className="secondary danger full-width" onClick={handleLogout}>
                      Logout
                    </button>
                  ) : (
                    <div className="button-row">
                      <button type="button" className="secondary" onClick={() => navigate('/login')}>
                        Login
                      </button>
                      <button type="button" className="secondary" onClick={() => navigate('/register')}>
                        Register
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </nav>
      </header>

      {isLandingPage ? (
        <section className="hero landing-hero">
          <div className="hero-copy">
            <p className="eyebrow">Quiz Management Platform</p>
            <h1>Build, run, and measure assessments in one workspace.</h1>
            <p className="lede">
              A polished FastAPI and React product for admin control, student quiz delivery, timed
              attempts, performance analytics, and leaderboard tracking.
            </p>

            <div className="status-row">
              <span className="pill">{statusText}</span>
              <span className="notice">{notice}</span>
            </div>

            <div className="marketing-grid">
              {marketingStats.map((item) => (
                <article className="marketing-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
          </div>

          <section className="feature-card landing-panel tone-admin">
            <div className="feature-heading">
              <p className="eyebrow">Product modules</p>
              <h3>What the platform includes</h3>
            </div>
            <ul>
              <li>Separate admin and student pages</li>
              <li>Quiz creation, publishing, and timed attempts</li>
              <li>Results, history, analytics, and leaderboard views</li>
              <li>JWT auth with protected backend routes</li>
            </ul>
          </section>
        </section>
      ) : null}

      {isLoginPage || isRegisterPage ? (
        <section className="hero auth-hero">
          <div className="hero-copy">
            <p className="eyebrow">Secure access</p>
            {isLoginPage ? <h1>Sign in to your account.</h1> : <h1>Create your account.</h1>}
            <p className="lede">
              {isLoginPage
                ? 'Use your email and password to open the correct workspace.'
                : 'Create a new account to join the quiz platform and continue to your workspace.'}
            </p>
            <div className="status-row">
              <span className="pill">{statusText}</span>
              <span className="notice">{notice}</span>
            </div>

            <div className="auth-feature-grid">
              {authHighlights.map((item) => (
                <article className="auth-feature-card" key={item.label}>
                  <strong>{item.label}</strong>
                  <p>{item.value}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="hero-aside">
            <AuthPanel
              mode={isRegisterPage ? 'register' : 'login'}
              onModeChange={setMode}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
              showModeToggle={false}
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
          </div>
        </section>
      ) : null}

      {isWorkspacePage ? (
        <>
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
          ) : (
            <section className="table-card workspace-locked">
              <p className="eyebrow">Workspace locked</p>
              <h2>Sign in to open the dashboard.</h2>
              <p className="helper">
                The admin and student views are available after authentication.
              </p>
              <button className="primary" type="button" onClick={() => navigate('/login')}>
                Go to auth
              </button>
            </section>
          )}
        </>
      ) : null}

        {isWorkspacePage && user?.role === 'ADMIN' ? (
          <section className="admin-board">
            <div className="admin-header">
              <div>
                <p className="eyebrow">Admin Dashboard</p>
                <h2>Platform overview and user management</h2>
              </div>
              <button className="secondary" type="button" onClick={refreshAdminData}>
                Refresh data
              </button>
            </div>

            {adminStats ? (
              <div className="stats-grid">
                <StatCard label="Total users" value={adminStats.total_users} />
                <StatCard label="Students" value={adminStats.total_students} />
                <StatCard label="Admins" value={adminStats.total_admins} />
                <StatCard label="Active users" value={adminStats.active_users} />
                <StatCard label="Inactive users" value={adminStats.inactive_users} />
                <StatCard label="Total quizzes" value={adminStats.total_quizzes} />
                <StatCard label="Published quizzes" value={adminStats.published_quizzes} />
                <StatCard label="Draft quizzes" value={adminStats.draft_quizzes} />
                <StatCard label="Unpublished quizzes" value={adminStats.unpublished_quizzes} />
                <StatCard label="Quiz attempts" value={adminStats.total_quiz_attempts} />
                <StatCard label="Avg score" value={`${adminStats.average_score}%`} />
              </div>
            ) : (
              <p className="helper">Loading admin statistics...</p>
            )}

            {adminAnalytics ? (
              <section className="table-card analytics-panel">
                <div className="table-heading">
                  <h3>Analytics overview</h3>
                  <span>{adminAnalytics.completed_attempts} completed attempts</span>
                </div>
                <div className="stats-grid analytics-stats">
                  <StatCard label="Passed" value={adminAnalytics.passed_attempts} />
                  <StatCard label="Failed" value={adminAnalytics.failed_attempts} />
                  <StatCard label="Average score" value={`${adminAnalytics.average_score}%`} />
                  <StatCard label="Best score" value={`${adminAnalytics.best_score}%`} />
                </div>

                <div className="analytics-grid">
                  <div className="analytics-card">
                    <div className="table-heading">
                      <h4>Quiz statistics</h4>
                      <span>{adminAnalytics.quiz_performance.length} quizzes</span>
                    </div>
                    <div className="analytics-list">
                      {adminAnalytics.quiz_performance.length > 0 ? (
                        adminAnalytics.quiz_performance.map((item) => (
                          <article className="analytics-row" key={item.quiz_id}>
                            <div className="analytics-meta">
                              <strong>{item.quiz_title}</strong>
                              <span>{item.category}</span>
                            </div>
                            <div className="analytics-bar">
                              <div className="analytics-fill" style={{ width: `${Math.max(6, item.average_score)}%` }} />
                            </div>
                            <div className="analytics-values">
                              <span>{item.attempts} attempts</span>
                              <span>{item.average_score}% avg</span>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="helper">Quiz analytics will appear after students submit attempts.</p>
                      )}
                    </div>
                  </div>

                  <div className="analytics-card">
                    <div className="table-heading">
                      <h4>Pass/fail breakdown</h4>
                      <span>{adminAnalytics.category_performance.length} categories</span>
                    </div>
                    <div className="analytics-list">
                      {adminAnalytics.category_performance.length > 0 ? (
                        adminAnalytics.category_performance.map((item) => (
                          <article className="analytics-row" key={item.category}>
                            <div className="analytics-meta">
                              <strong>{item.category}</strong>
                              <span>{item.quizzes} quizzes</span>
                            </div>
                            <div className="analytics-bar">
                              <div className="analytics-fill category" style={{ width: `${Math.max(6, item.average_score)}%` }} />
                            </div>
                            <div className="analytics-values">
                              <span>{item.attempts} attempts</span>
                              <span>{item.passed_attempts} passed</span>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="helper">Category-level performance will show up after more attempts.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="analytics-recent">
                  <div className="table-heading">
                    <h4>Recent attempts</h4>
                    <span>{adminAnalytics.recent_attempts.length} shown</span>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Quiz</th>
                          <th>Score</th>
                          <th>Status</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminAnalytics.recent_attempts.map((attempt) => (
                          <tr key={attempt.attempt_id}>
                            <td>
                              <strong>{attempt.user_name}</strong>
                              <p className="table-note">{attempt.user_email}</p>
                            </td>
                            <td>{attempt.quiz_title}</td>
                            <td>{attempt.percentage}%</td>
                            <td>
                              <span className={attempt.passed ? 'status-pill active' : 'status-pill inactive'}>
                                {attempt.passed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                            <td>{new Date(attempt.submitted_at).toLocaleString()}</td>
                          </tr>
                        ))}
                        {adminAnalytics.recent_attempts.length === 0 ? (
                          <tr>
                            <td colSpan="5">No completed attempts yet.</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ) : (
              <section className="table-card">
                <p className="helper">Loading admin analytics...</p>
              </section>
            )}

            <div className="filters-panel">
              <label>
                Search users
                <input
                  value={adminQuery}
                  onChange={(event) => setAdminQuery(event.target.value)}
                  placeholder="Search by name or email"
                />
              </label>
              <label>
                Status filter
                <select
                  value={adminStatusFilter}
                  onChange={(event) => setAdminStatusFilter(event.target.value)}
                >
                  <option value="">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
            </div>

            {adminMessage ? <p className="helper">{adminMessage}</p> : null}

            <div className="table-card">
              <div className="table-heading">
                <h3>Users</h3>
                <span>{adminUsers.length} records</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.email}</td>
                        <td>{item.role}</td>
                        <td>
                          <span className={`status-pill ${item.is_active ? 'active' : 'inactive'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="secondary"
                              type="button"
                              onClick={() => updateUserStatus(item.id, item.is_active)}
                            >
                              {item.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="secondary danger" type="button" onClick={() => deleteUser(item.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {adminUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5">No users found.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <section className="table-card">
              <div className="table-heading">
                <h3>{editingQuizId ? 'Edit quiz' : 'Create quiz'}</h3>
                <div className="button-row">
                  <button className="secondary" type="button" onClick={refreshQuizzes}>
                    Refresh quizzes
                  </button>
                  {editingQuizId ? (
                    <button className="secondary" type="button" onClick={resetQuizForm}>
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </div>

              <form className="quiz-form" onSubmit={saveQuiz}>
                <label>
                  Title
                  <input
                    value={quizForm.title}
                    onChange={(event) => setQuizForm({ ...quizForm, title: event.target.value })}
                    placeholder="JavaScript Fundamentals"
                  />
                </label>
                <label>
                  Category
                  <input
                    value={quizForm.category}
                    onChange={(event) => setQuizForm({ ...quizForm, category: event.target.value })}
                    placeholder="JavaScript"
                  />
                </label>
                <label>
                  Difficulty
                  <select
                    value={quizForm.difficulty}
                    onChange={(event) => setQuizForm({ ...quizForm, difficulty: event.target.value })}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
                <label>
                  Duration (minutes)
                  <input
                    type="number"
                    min="1"
                    value={quizForm.duration}
                    onChange={(event) => setQuizForm({ ...quizForm, duration: event.target.value })}
                  />
                </label>
                <label>
                  Passing score
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quizForm.passing_score}
                    onChange={(event) => setQuizForm({ ...quizForm, passing_score: event.target.value })}
                  />
                </label>
                <label>
                  Maximum attempts
                  <input
                    type="number"
                    min="1"
                    value={quizForm.max_attempts}
                    onChange={(event) => setQuizForm({ ...quizForm, max_attempts: event.target.value })}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={quizForm.status}
                    onChange={(event) => setQuizForm({ ...quizForm, status: event.target.value })}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="UNPUBLISHED">Unpublished</option>
                  </select>
                </label>
                <label className="full-row">
                  Description
                  <textarea
                    rows="4"
                    value={quizForm.description}
                    onChange={(event) => setQuizForm({ ...quizForm, description: event.target.value })}
                    placeholder="Short quiz description"
                  />
                </label>
                <label className="full-row">
                  Thumbnail URL
                  <input
                    value={quizForm.thumbnail_url}
                    onChange={(event) => setQuizForm({ ...quizForm, thumbnail_url: event.target.value })}
                    placeholder="https://example.com/image.png"
                  />
                </label>
                <div className="full-row button-row">
                  <button className="primary" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingQuizId ? 'Update quiz' : 'Create quiz'}
                  </button>
                </div>
              </form>
            </section>

            <section className="table-card">
              <div className="table-heading">
                <h3>Quizzes</h3>
                <span>{quizzes.length} records</span>
              </div>

              <div className="filters-panel quiz-filters">
                <label>
                  Search quizzes
                  <input
                    value={quizQuery}
                    onChange={(event) => setQuizQuery(event.target.value)}
                    placeholder="Search by title"
                  />
                </label>
                <label>
                  Status filter
                  <select
                    value={quizStatusFilter}
                    onChange={(event) => setQuizStatusFilter(event.target.value)}
                  >
                    <option value="">All</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="UNPUBLISHED">Unpublished</option>
                  </select>
                </label>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Difficulty</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map((quiz) => (
                      <tr key={quiz.id}>
                        <td>
                          <strong>{quiz.title}</strong>
                          {quiz.description ? <p className="table-note">{quiz.description}</p> : null}
                        </td>
                        <td>{quiz.category}</td>
                        <td>{quiz.difficulty}</td>
                        <td>{quiz.duration} min</td>
                        <td>
                          <span className={`status-pill ${quiz.is_published ? 'active' : 'inactive'}`}>
                            {quiz.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="secondary" type="button" onClick={() => startQuizEdit(quiz)}>
                              Edit
                            </button>
                            <button className="secondary" type="button" onClick={() => toggleQuizPublish(quiz)}>
                              {quiz.is_published ? 'Unpublish' : 'Publish'}
                            </button>
                            <button className="secondary danger" type="button" onClick={() => deleteQuiz(quiz.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {quizzes.length === 0 ? (
                      <tr>
                        <td colSpan="6">No quizzes found.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="table-card">
              <div className="table-heading">
                <h3>Categories</h3>
                <div className="button-row">
                  <button className="secondary" type="button" onClick={refreshCategories}>
                    Refresh categories
                  </button>
                  {editingCategoryId ? (
                    <button className="secondary" type="button" onClick={resetCategoryForm}>
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </div>

              <form className="quiz-form" onSubmit={saveCategory}>
                <label className="full-row">
                  Name
                  <input
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                    placeholder="Python"
                  />
                </label>
                <label className="full-row">
                  Description
                  <textarea
                    rows="3"
                    value={categoryForm.description}
                    onChange={(event) =>
                      setCategoryForm({ ...categoryForm, description: event.target.value })
                    }
                    placeholder="Category description"
                  />
                </label>
                <div className="full-row button-row">
                  <button className="primary" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingCategoryId ? 'Update category' : 'Create category'}
                  </button>
                </div>
              </form>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.description || '-'}</td>
                        <td>
                          <div className="table-actions">
                            <button className="secondary" type="button" onClick={() => startCategoryEdit(category)}>
                              Edit
                            </button>
                            <button className="secondary danger" type="button" onClick={() => deleteCategory(category.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="3">No categories found.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="table-card">
              <div className="table-heading">
                <h3>Questions</h3>
                <div className="button-row">
                  <select
                    value={selectedQuizId}
                    onChange={(event) => {
                      setSelectedQuizId(event.target.value)
                      setQuestionForm((current) => ({ ...current, quiz_id: event.target.value }))
                      setEditingQuestionId(null)
                    }}
                  >
                    <option value="">Select a quiz</option>
                    {quizzes.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </option>
                    ))}
                  </select>
                  <button className="secondary" type="button" onClick={() => refreshQuestions(selectedQuizId)}>
                    Refresh questions
                  </button>
                  {editingQuestionId ? (
                    <button className="secondary" type="button" onClick={resetQuestionForm}>
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </div>

              <form className="question-form" onSubmit={saveQuestion}>
                <label>
                  Quiz
                  <select
                    value={questionForm.quiz_id}
                    onChange={(event) => setQuestionForm({ ...questionForm, quiz_id: event.target.value })}
                  >
                    <option value="">Select a quiz</option>
                    {quizzes.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Marks
                  <input
                    type="number"
                    min="1"
                    value={questionForm.marks}
                    onChange={(event) => setQuestionForm({ ...questionForm, marks: event.target.value })}
                  />
                </label>
                <label>
                  Difficulty
                  <select
                    value={questionForm.difficulty}
                    onChange={(event) => setQuestionForm({ ...questionForm, difficulty: event.target.value })}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
                <label className="full-row">
                  Question text
                  <textarea
                    rows="4"
                    value={questionForm.question_text}
                    onChange={(event) =>
                      setQuestionForm({ ...questionForm, question_text: event.target.value })
                    }
                    placeholder="What is Python?"
                  />
                </label>
                <label className="full-row">
                  Explanation
                  <textarea
                    rows="3"
                    value={questionForm.explanation}
                    onChange={(event) => setQuestionForm({ ...questionForm, explanation: event.target.value })}
                    placeholder="Explain the correct answer"
                  />
                </label>
                <div className="full-row options-grid">
                  {questionForm.options.map((option, index) => (
                    <div className="option-card" key={`${index}-${option.option_text}`}>
                      <label>
                        Option {index + 1}
                        <input
                          value={option.option_text}
                          onChange={(event) => updateQuestionOption(index, 'option_text', event.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                      </label>
                      <label className="option-check">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={option.is_correct}
                          onChange={() =>
                            setQuestionForm((current) => ({
                              ...current,
                              options: current.options.map((item, optionIndex) => ({
                                ...item,
                                is_correct: optionIndex === index,
                              })),
                            }))
                          }
                        />
                        Correct answer
                      </label>
                    </div>
                  ))}
                </div>
                <div className="full-row button-row">
                  <button className="primary" type="submit" disabled={loading || !questionForm.quiz_id}>
                    {loading ? 'Saving...' : editingQuestionId ? 'Update question' : 'Create question'}
                  </button>
                </div>
              </form>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Marks</th>
                      <th>Difficulty</th>
                      <th>Options</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((question) => (
                      <tr key={question.id}>
                        <td>
                          <strong>{question.question_text}</strong>
                          {question.explanation ? <p className="table-note">{question.explanation}</p> : null}
                        </td>
                        <td>{question.marks}</td>
                        <td>{question.difficulty}</td>
                        <td>
                          {question.options?.map((option) => (
                            <div key={option.id} className={option.is_correct ? 'correct-option' : ''}>
                              {option.option_text}
                              {option.is_correct ? ' (correct)' : ''}
                            </div>
                          ))}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="secondary" type="button" onClick={() => startQuestionEdit(question)}>
                              Edit
                            </button>
                            <button className="secondary danger" type="button" onClick={() => deleteQuestion(question.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {questions.length === 0 ? (
                      <tr>
                        <td colSpan="5">No questions found for the selected quiz.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        ) : null}

        {isWorkspacePage && user?.role === 'STUDENT' ? (
          <section className="student-board">
            <div className="student-header">
              <div>
                <p className="eyebrow">Student Dashboard</p>
                <h2>Track progress, history, and quiz performance</h2>
              </div>
              <span className="timer-pill">Timer {timerLabel}</span>
            </div>

            {studentDashboard ? (
              <section className="table-card dashboard-panel">
                <div className="table-heading">
                  <h3>Performance snapshot</h3>
                  <span>{studentDashboard.completed_attempts} completed attempts</span>
                </div>
                <div className="stats-grid student-stats">
                  <StatCard label="Total attempts" value={studentDashboard.total_attempts} />
                  <StatCard label="Completed" value={studentDashboard.completed_attempts} />
                  <StatCard label="Passed" value={studentDashboard.passed_attempts} />
                  <StatCard label="Failed" value={studentDashboard.failed_attempts} />
                  <StatCard label="Average score" value={`${dashboardAverage}%`} />
                  <StatCard label="Best score" value={`${studentDashboard.best_score}%`} />
                  <StatCard label="Time spent" value={formatDuration(studentDashboard.total_time_spent_seconds)} />
                </div>

                <div className="dashboard-grid-two">
                  <div className="chart-card">
                    <div className="table-heading">
                      <h4>Score trend</h4>
                      <span>Latest submissions</span>
                    </div>
                    <div className="score-chart">
                      {studentDashboard.performance_points.length > 0 ? (
                        studentDashboard.performance_points.map((point) => (
                          <div className="score-row" key={point.attempt_id}>
                            <div className="score-label">
                              <strong>{point.quiz_title}</strong>
                              <span>{new Date(point.submitted_at).toLocaleDateString()}</span>
                            </div>
                            <div className="score-bar">
                              <div
                                className={point.passed ? 'score-fill passed' : 'score-fill failed'}
                                style={{ width: `${Math.max(6, point.percentage)}%` }}
                              />
                            </div>
                            <strong>{point.percentage}%</strong>
                          </div>
                        ))
                      ) : (
                        <p className="helper">Complete a quiz to see your performance trend.</p>
                      )}
                    </div>
                  </div>

                  <div className="chart-card">
                    <div className="table-heading">
                      <h4>Category performance</h4>
                      <span>{studentDashboard.category_performance.length} categories</span>
                    </div>
                    <div className="category-stack">
                      {studentDashboard.category_performance.length > 0 ? (
                        studentDashboard.category_performance.map((item) => (
                          <div className="category-card" key={item.category}>
                            <div className="category-head">
                              <strong>{item.category}</strong>
                              <span>{item.attempts} attempts</span>
                            </div>
                            <div className="score-bar">
                              <div className="score-fill category" style={{ width: `${Math.max(6, item.average_percentage)}%` }} />
                            </div>
                            <div className="category-foot">
                              <span>Average {item.average_percentage}%</span>
                              <span>Passed {item.passed_attempts}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="helper">Category analytics will appear after your first completed quiz.</p>
                      )}
                    </div>
                  </div>
                </div>

                <section className="recent-attempts-panel">
                  <div className="table-heading">
                    <h4>Recent attempts</h4>
                    <span>{studentDashboard.recent_attempts.length} shown</span>
                  </div>
                  <div className="recent-attempts-list">
                    {studentDashboard.recent_attempts.length > 0 ? (
                      studentDashboard.recent_attempts.map((attempt) => (
                        <article className="recent-attempt-card" key={attempt.attempt_id}>
                          <div className="recent-attempt-head">
                            <strong>{attempt.quiz_title}</strong>
                            <span className={attempt.passed ? 'status-pill active' : 'status-pill inactive'}>
                              {attempt.passed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                          <div className="recent-attempt-meta">
                            <span>{new Date(attempt.submitted_at).toLocaleDateString()}</span>
                            <span>{attempt.percentage}%</span>
                            <span>
                              {attempt.score}/{attempt.total_marks}
                            </span>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="helper">Your recent attempts will appear here after you submit a quiz.</p>
                    )}
                  </div>
                </section>
              </section>
            ) : (
              <section className="table-card">
                <p className="helper">Loading student dashboard...</p>
              </section>
            )}

            {studentLeaderboard ? (
              <section className="table-card leaderboard-panel" id="student-ranking">
                <div className="table-heading">
                  <h3>Leaderboard</h3>
                  <span>{studentLeaderboard.overall.length} students ranked</span>
                </div>

                <div className="leaderboard-tabs">
                  <button
                    type="button"
                    className={!selectedLeaderboardCategory ? 'tab active' : 'tab'}
                    onClick={() => setSelectedLeaderboardCategory('')}
                  >
                    Overall
                  </button>
                  {studentLeaderboard.categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={leaderboardCategoryLabel === category ? 'tab active' : 'tab'}
                      onClick={() => setSelectedLeaderboardCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="leaderboard-grid">
                  <div className="leaderboard-card">
                    <div className="table-heading">
                      <h4>Overall ranking</h4>
                      <span>All completed attempts</span>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Student</th>
                            <th>Attempts</th>
                            <th>Average</th>
                            <th>Best</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentLeaderboard.overall.map((item) => (
                            <tr key={item.user_id}>
                              <td>#{item.rank}</td>
                              <td>
                                <strong>{item.user_name}</strong>
                                <p className="table-note">{item.user_email}</p>
                              </td>
                              <td>{item.attempts}</td>
                              <td>{item.average_score}%</td>
                              <td>{item.best_score}%</td>
                            </tr>
                          ))}
                          {studentLeaderboard.overall.length === 0 ? (
                            <tr>
                              <td colSpan="5">No leaderboard data yet.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="leaderboard-card">
                    <div className="table-heading">
                      <h4>
                        Category ranking
                        {leaderboardCategoryLabel ? ` - ${leaderboardCategoryLabel}` : ''}
                      </h4>
                      <span>{studentLeaderboard.category_leaderboard.length} students</span>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Student</th>
                            <th>Attempts</th>
                            <th>Average</th>
                            <th>Passed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentLeaderboard.category_leaderboard.map((item) => (
                            <tr key={`${item.category}-${item.user_id}`}>
                              <td>#{item.rank}</td>
                              <td>
                                <strong>{item.user_name}</strong>
                                <p className="table-note">{item.user_email}</p>
                              </td>
                              <td>{item.attempts}</td>
                              <td>{item.average_score}%</td>
                              <td>{item.passed_attempts}</td>
                            </tr>
                          ))}
                          {studentLeaderboard.category_leaderboard.length === 0 ? (
                            <tr>
                              <td colSpan="5">No category ranking available yet.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="table-card">
                <p className="helper">Loading leaderboard...</p>
              </section>
            )}

            <div className="student-layout">
              <aside className="table-card student-sidebar" id="student-quizzes">
                <div className="table-heading">
                  <h3>Published quizzes</h3>
                  <span>{studentQuizzes.length} available</span>
                </div>
                <div className="student-quiz-list">
                  {studentQuizzes.map((quiz) => (
                    <button
                      key={quiz.id}
                      type="button"
                      className={String(quiz.id) === selectedStudentQuizId ? 'student-quiz-item active' : 'student-quiz-item'}
                      onClick={() => setSelectedStudentQuizId(String(quiz.id))}
                    >
                      <strong>{quiz.title}</strong>
                      <span>{quiz.category}</span>
                      <span>
                        {quiz.duration} min - {quiz.questions_count} questions
                      </span>
                    </button>
                  ))}
                  {studentQuizzes.length === 0 ? <p className="helper">No published quizzes yet.</p> : null}
                </div>
              </aside>

              <div className="student-main">
                <section className="table-card" id="quiz-details">
                  <div className="table-heading">
                    <h3>Quiz details</h3>
                    <button
                      className="primary"
                      type="button"
                      disabled={!selectedStudentQuiz}
                      onClick={startSelectedQuiz}
                    >
                      Start quiz
                    </button>
                  </div>

                  {selectedStudentQuiz ? (
                    <>
                      <div className="detail-grid">
                        <div>
                          <span>Title</span>
                          <strong>{selectedStudentQuiz.title}</strong>
                        </div>
                        <div>
                          <span>Category</span>
                          <strong>{selectedStudentQuiz.category}</strong>
                        </div>
                        <div>
                          <span>Difficulty</span>
                          <strong>{selectedStudentQuiz.difficulty}</strong>
                        </div>
                        <div>
                          <span>Duration</span>
                          <strong>{selectedStudentQuiz.duration} minutes</strong>
                        </div>
                        <div>
                          <span>Passing score</span>
                          <strong>{selectedStudentQuiz.passing_score}%</strong>
                        </div>
                        <div>
                          <span>Questions</span>
                          <strong>{selectedStudentQuiz.questions_count}</strong>
                        </div>
                      </div>
                      <p className="table-note">{selectedStudentQuiz.description || 'No description available.'}</p>
                    </>
                  ) : (
                    <p className="helper">Select a quiz to inspect its details.</p>
                  )}
                </section>

                {studentStartInfo ? (
                  <section className="table-card">
                    <div className="table-heading">
                      <h3>Active attempt</h3>
                      <span>Attempt #{studentStartInfo.attempt_id}</span>
                    </div>
                    <div className="attempt-banner">
                      <div>
                        <span>Remaining time</span>
                        <strong>{timerLabel}</strong>
                      </div>
                      <div>
                        <span>Questions</span>
                        <strong>{studentStartInfo.question_count}</strong>
                      </div>
                      <div>
                        <span>Answered</span>
                        <strong>{answeredCount}</strong>
                      </div>
                    </div>

                    {activeStudentQuestion ? (
                      <div className="question-shell">
                        <div className="question-nav">
                          {selectedStudentQuiz.questions.map((question, index) => (
                            <button
                              key={question.id}
                              type="button"
                              className={
                                index === currentQuestionIndex
                                  ? 'question-dot active'
                                  : studentAnswers[question.id]
                                    ? 'question-dot answered'
                                    : 'question-dot'
                              }
                              onClick={() => setCurrentQuestionIndex(index)}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>

                        <div className="question-card">
                          <p className="eyebrow">
                            Question {currentQuestionIndex + 1} of {selectedStudentQuiz.questions.length}
                          </p>
                          <h4>{activeStudentQuestion.question_text}</h4>
                          <div className="option-list">
                            {activeStudentQuestion.options.map((option) => (
                              <label key={option.id} className="option-row">
                                <input
                                  type="radio"
                                  name={`question-${activeStudentQuestion.id}`}
                                  checked={studentAnswers[activeStudentQuestion.id] === option.id}
                                  disabled={Boolean(studentSubmissionResult)}
                                  onChange={() => selectAnswer(activeStudentQuestion.id, option.id)}
                                />
                                <span>{option.option_text}</span>
                              </label>
                            ))}
                          </div>
                          <div className="button-row">
                            <button
                              className="secondary"
                              type="button"
                              disabled={currentQuestionIndex === 0}
                              onClick={() => setCurrentQuestionIndex((value) => Math.max(0, value - 1))}
                            >
                              Previous
                            </button>
                            <button
                              className="secondary"
                              type="button"
                              disabled={currentQuestionIndex >= selectedStudentQuiz.questions.length - 1}
                              onClick={() =>
                                setCurrentQuestionIndex((value) =>
                                  Math.min(selectedStudentQuiz.questions.length - 1, value + 1),
                                )
                              }
                            >
                              Next
                            </button>
                            <button
                              className="primary"
                              type="button"
                              disabled={submittingAttempt || Boolean(studentSubmissionResult)}
                              onClick={() => submitAttempt(false)}
                            >
                              {submittingAttempt ? 'Submitting...' : 'Submit quiz'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="helper">Start the quiz to begin the timer and question navigation.</p>
                    )}

                    {activeAttemptReview ? (
                      <div className="result-panel">
                        <div className="table-heading">
                          <h3>Result summary</h3>
                          <span className={activeAttemptReview.passed ? 'status-pill active' : 'status-pill inactive'}>
                            {activeAttemptReview.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        <div className="detail-grid">
                          <div>
                            <span>Score</span>
                            <strong>
                              {activeAttemptReview.score}/{activeAttemptReview.total_marks}
                            </strong>
                          </div>
                          <div>
                            <span>Percentage</span>
                            <strong>{activeAttemptReview.percentage}%</strong>
                          </div>
                          <div>
                            <span>Correct</span>
                            <strong>{activeAttemptReview.correct_count}</strong>
                          </div>
                          <div>
                            <span>Incorrect</span>
                            <strong>{activeAttemptReview.incorrect_count}</strong>
                          </div>
                          <div>
                            <span>Unanswered</span>
                            <strong>{activeAttemptReview.unanswered_count}</strong>
                          </div>
                          <div>
                            <span>Time taken</span>
                            <strong>{activeAttemptReview.time_taken_seconds}s</strong>
                          </div>
                        </div>

                        <div className="result-review">
                          {activeAttemptReview.results.map((item, index) => (
                            <article key={item.question_id} className="review-card">
                              <div className="table-heading">
                                <h4>
                                  Question {index + 1}
                                </h4>
                                <span className={item.is_correct ? 'status-pill active' : 'status-pill inactive'}>
                                  {item.is_correct ? 'Correct' : 'Incorrect'}
                                </span>
                              </div>
                              <p>{item.question_text}</p>
                              <div className="review-lines">
                                <div>
                                  <span>Your answer</span>
                                  <strong>{item.selected_option_text || 'Not answered'}</strong>
                                </div>
                                <div>
                                  <span>Correct answer</span>
                                  <strong>{item.correct_option_text || '-'}</strong>
                                </div>
                                <div>
                                  <span>Marks</span>
                                  <strong>
                                    {item.marks_awarded}/{item.marks}
                                  </strong>
                                </div>
                              </div>
                              {item.explanation ? <p className="table-note">{item.explanation}</p> : null}
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <section className="table-card attempt-history">
                      <div className="table-heading">
                        <h3>Attempt history</h3>
                        <span>{studentAttempts.length} attempts</span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Quiz</th>
                              <th>Status</th>
                              <th>Score</th>
                              <th>Result</th>
                              <th>Submitted</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentAttempts.map((attempt) => (
                              <tr key={attempt.attempt_id}>
                                <td>
                                  <strong>{attempt.quiz_title}</strong>
                                  <p className="table-note">Attempt #{attempt.attempt_id}</p>
                                </td>
                                <td>
                                  <span className={`status-pill ${attempt.status === 'SUBMITTED' ? 'active' : 'inactive'}`}>
                                    {attempt.status}
                                  </span>
                                </td>
                                <td>
                                  {attempt.score != null && attempt.total_marks != null
                                    ? `${attempt.score}/${attempt.total_marks}`
                                    : '-'}
                                </td>
                                <td>
                                  {attempt.percentage != null ? `${attempt.percentage}%` : '-'}
                                  {attempt.passed != null ? (
                                    <p className="table-note">{attempt.passed ? 'Passed' : 'Failed'}</p>
                                  ) : null}
                                </td>
                                <td>
                                  {attempt.submitted_at
                                    ? new Date(attempt.submitted_at).toLocaleString()
                                    : 'Not submitted'}
                                </td>
                                <td>
                                  <div className="table-actions">
                                    <button
                                      className="secondary"
                                      type="button"
                                      disabled={attempt.status !== 'SUBMITTED'}
                                      onClick={() => setSelectedAttemptHistoryId(String(attempt.attempt_id))}
                                    >
                                      View review
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {studentAttempts.length === 0 ? (
                              <tr>
                                <td colSpan="6">No attempts found yet.</td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </section>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
    </main>
  )
}
