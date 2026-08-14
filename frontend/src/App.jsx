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

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function App() {
  const [mode, setMode] = useState('register')
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) ?? '')
  const [user, setUser] = useState(null)
  const [roleInfo, setRoleInfo] = useState(null)
  const [probeMessage, setProbeMessage] = useState('')
  const [adminStats, setAdminStats] = useState(null)
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

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      setAdminStats(null)
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

        const [stats, users] = await Promise.all([
          request('/admin/dashboard', { token }),
          request(`/admin/users${params.toString() ? `?${params.toString()}` : ''}`, { token }),
        ])

        if (!cancelled) {
          setAdminStats(stats)
          setAdminUsers(users.items ?? [])
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

      const [stats, users] = await Promise.all([
        request('/admin/dashboard', { token }),
        request(`/admin/users${params.toString() ? `?${params.toString()}` : ''}`, { token }),
      ])
      setAdminStats(stats)
      setAdminUsers(users.items ?? [])
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

        {user?.role === 'ADMIN' ? (
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
                <StatCard label="Avg score" value={`${adminStats.average_score}%`} />
              </div>
            ) : (
              <p className="helper">Loading admin statistics...</p>
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
      </section>
    </main>
  )
}
