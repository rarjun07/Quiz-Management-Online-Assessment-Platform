import { useEffect, useMemo, useRef, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api/v1'
const tokenKey = 'quiz_platform_token'

const adminNavItems = [
  { id: 'overview', label: 'Home', route: '/admin/home' },
  { id: 'analytics', label: 'Analytics', route: '/admin/analytics' },
  { id: 'attempts', label: 'Attempts', route: '/admin/attempts' },
  { id: 'users', label: 'Users', route: '/admin/users' },
  { id: 'quizzes', label: 'Quizzes', route: '/admin/quizzes' },
  { id: 'content', label: 'Content', route: '/admin/content' },
]

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

function AuthPanel({ mode, onModeChange, onSubmit, loading, error, resetTokenValue = '', showModeToggle = true }) {
  const [name, setName] = useState('Arjun Student')
  const [email, setEmail] = useState('student@example.com')
  const [password, setPassword] = useState('password123')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const panelTitle =
    mode === 'forgot'
      ? 'Reset password'
      : mode === 'reset'
        ? 'Set new password'
        : mode === 'login'
          ? 'Welcome back'
          : 'Create your account'
  const panelSubtitle =
    mode === 'forgot'
      ? 'Enter your email and choose a new password.'
      : mode === 'reset'
        ? 'Enter your reset token and new password.'
        : mode === 'login'
          ? 'Sign in with your email and password to continue.'
          : 'Start a new student account and join the platform.'

  useEffect(() => {
    if (resetTokenValue) {
      setResetToken(resetTokenValue)
    }
  }, [resetTokenValue])

  useEffect(() => {
    if (mode === 'forgot') {
      setPassword('')
      setConfirmPassword('')
      setResetToken('')
    }
  }, [mode])

  return (
    <form
      className="auth-card"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({
          name,
          email,
          password,
          confirmPassword,
          resetToken,
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

      {showModeToggle && (mode === 'login' || mode === 'register') ? (
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

      {mode === 'reset' ? (
        <label>
          Reset token
          <input
            value={resetToken}
            onChange={(event) => setResetToken(event.target.value)}
            placeholder="Paste your reset token"
          />
        </label>
      ) : null}

      {mode !== 'forgot' ? (
        <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter a password"
        />
        </label>
      ) : null}

      {mode === 'forgot' ? (
        <>
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter a new password"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm your new password"
            />
          </label>
        </>
      ) : null}

      {mode === 'login' ? (
        <button
          type="button"
          className="auth-forgot-password"
          onClick={() => {
            onModeChange('forgot')
          }}
        >
          Forgot password?
        </button>
      ) : null}

      {mode === 'forgot' || mode === 'reset' ? (
        <div className="button-row">
          <button type="button" className="secondary" onClick={() => onModeChange('login')}>
            Back to login
          </button>
          {mode === 'reset' ? (
            <button type="button" className="secondary" onClick={() => onModeChange('forgot')}>
              Reset with email
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <button className="primary" type="submit" disabled={loading}>
        {loading
          ? 'Working...'
          : mode === 'forgot'
            ? 'Reset password'
            : mode === 'reset'
              ? 'Reset password'
              : mode === 'login'
                ? 'Login'
                : 'Create account'}
      </button>

    </form>
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

function formatNotificationTime(value) {
  if (!value) {
    return ''
  }
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) {
    return ''
  }
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (diffSeconds < 60) {
    return 'Just now'
  }
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
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

function SearchIcon({ className = '' }) {
  return (
    <svg
      className={`search-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="5.8" />
      <path d="M16.2 16.2 20 20" />
    </svg>
  )
}

function BellIcon({ className = '' }) {
  return (
    <svg
      className={`bell-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7.5 16.5h9" />
      <path d="M6.2 16.5c.9-.8 1.3-2 1.3-3.2V10a4.5 4.5 0 0 1 9 0v3.3c0 1.2.4 2.4 1.3 3.2" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}

const studentQuizCatalog = [
  {
    subject: 'Computer Science',
    description: 'Core computer science tests covering fundamentals, systems, networking, and theory.',
    tests: [
      { title: 'Computer Science Test (Random Questions)', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Computer Fundamentals Test 1', questions: 20, duration: 30, difficulty: 'Beginner' },
      { title: 'Computer Fundamentals Test 2', questions: 20, duration: 30, difficulty: 'Beginner' },
      { title: 'Computer Fundamentals Test 3', questions: 20, duration: 30, difficulty: 'Beginner' },
      { title: 'Object Oriented Programming Test 1', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Object Oriented Programming Test 2', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Object Oriented Programming Test 3', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Networking Test 1', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Networking Test 2', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Management Information Systems Test', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Computer Hardware Test', questions: 20, duration: 30, difficulty: 'Beginner' },
      { title: 'System Analysis and Design Test', questions: 20, duration: 30, difficulty: 'Advanced' },
      { title: 'Operating Systems Concepts Test', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Automation System Test', questions: 20, duration: 30, difficulty: 'Advanced' },
      { title: 'Electronic Principles Test', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Digital Computer Electronics Test', questions: 20, duration: 30, difficulty: 'Advanced' },
      { title: 'Database Systems Test', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Unix Test', questions: 20, duration: 30, difficulty: 'Advanced' },
      { title: 'Artificial Intelligence Test', questions: 20, duration: 30, difficulty: 'Advanced' },
      { title: 'Linux Test', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Disk Operating System (DOS) Test', questions: 20, duration: 30, difficulty: 'Beginner' },
    ],
  },
  {
    subject: 'Python',
    description: 'Syntax, data structures, functions, OOP, and practical scripting challenges.',
    tests: [
      { title: 'Python Basics Test 1', questions: 20, duration: 30, difficulty: 'Beginner' },
      { title: 'Python Basics Test 2', questions: 20, duration: 30, difficulty: 'Beginner' },
      { title: 'Python OOP Test', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Python Data Structures Test', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Python Advanced Test', questions: 20, duration: 30, difficulty: 'Advanced' },
    ],
  },
  {
    subject: 'JAVA',
    description: 'Core Java, collections, exceptions, multithreading, and JVM concepts.',
    tests: [
      { title: 'Java Basics Test 1', questions: 20, duration: 30, difficulty: 'Beginner' },
      { title: 'Java OOP Test', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Java Collections Test', questions: 20, duration: 30, difficulty: 'Intermediate' },
      { title: 'Java Advanced Test', questions: 20, duration: 30, difficulty: 'Advanced' },
    ],
  },
  {
    subject: 'HTML',
    description: 'Structure, semantic markup, forms, accessibility, and modern HTML5 concepts.',
    tests: [
      { title: 'HTML Basics Test 1', questions: 20, duration: 20, difficulty: 'Beginner' },
      { title: 'HTML Forms Test', questions: 20, duration: 20, difficulty: 'Beginner' },
      { title: 'HTML Semantic Elements Test', questions: 20, duration: 20, difficulty: 'Intermediate' },
    ],
  },
  {
    subject: 'CSS',
    description: 'Selectors, layout, responsive design, animations, and modern styling patterns.',
    tests: [
      { title: 'CSS Basics Test 1', questions: 20, duration: 20, difficulty: 'Beginner' },
      { title: 'CSS Layout Test', questions: 20, duration: 20, difficulty: 'Intermediate' },
      { title: 'CSS Responsive Design Test', questions: 20, duration: 20, difficulty: 'Advanced' },
    ],
  },
  {
    subject: 'JAVAScript',
    description: 'Language fundamentals, DOM, async patterns, and browser programming.',
    tests: [
      { title: 'JavaScript Basics Test 1', questions: 20, duration: 25, difficulty: 'Beginner' },
      { title: 'JavaScript DOM Test', questions: 20, duration: 25, difficulty: 'Intermediate' },
      { title: 'JavaScript Advanced Test', questions: 20, duration: 25, difficulty: 'Advanced' },
    ],
  },
  {
    subject: 'SQL',
    description: 'Queries, joins, indexing, normalization, and database design.',
    tests: [
      { title: 'SQL Basics Test 1', questions: 20, duration: 25, difficulty: 'Beginner' },
      { title: 'SQL Joins Test', questions: 20, duration: 25, difficulty: 'Intermediate' },
      { title: 'SQL Advanced Queries Test', questions: 20, duration: 25, difficulty: 'Advanced' },
    ],
  },
  {
    subject: 'Swift',
    description: 'Swift language fundamentals, iOS development basics, and app architecture.',
    tests: [
      { title: 'Swift Basics Test 1', questions: 20, duration: 25, difficulty: 'Beginner' },
      { title: 'Swift iOS Fundamentals Test', questions: 20, duration: 25, difficulty: 'Intermediate' },
      { title: 'Swift Advanced Test', questions: 20, duration: 25, difficulty: 'Advanced' },
    ],
  },
  {
    subject: 'PHP',
    description: 'Server-side scripting, forms, sessions, and PHP web application concepts.',
    tests: [
      { title: 'PHP Basics Test 1', questions: 20, duration: 25, difficulty: 'Beginner' },
      { title: 'PHP Web Development Test', questions: 20, duration: 25, difficulty: 'Intermediate' },
      { title: 'PHP Advanced Test', questions: 20, duration: 25, difficulty: 'Advanced' },
    ],
  },
]

function q(questionText, answer, distractors, explanation) {
  return { questionText, answer, distractors, explanation }
}

function stableOffset(value) {
  return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0)
}

const catalogQuestionBank = {
  'Computer Science': [
    q('Which component performs arithmetic and logical operations in a computer?', 'CPU', ['RAM', 'Hard disk', 'Power supply'], 'The CPU executes instructions and performs arithmetic and logic operations.'),
    q('What is the main purpose of RAM?', 'To temporarily store data currently being used', ['To store firmware permanently', 'To cool the processor', 'To connect to the internet'], 'RAM is volatile working memory used while programs are running.'),
    q('Which number system uses only 0 and 1?', 'Binary', ['Decimal', 'Hexadecimal', 'Octal'], 'Binary represents values with two digits: 0 and 1.'),
    q('What does an operating system mainly manage?', 'Hardware resources and application execution', ['Only web pages', 'Only database records', 'Only programming syntax'], 'An OS coordinates CPU, memory, storage, devices, and programs.'),
    q('Which data structure follows first in, first out order?', 'Queue', ['Stack', 'Tree', 'Graph'], 'A queue removes items in the same order they were inserted.'),
    q('What is the role of a primary key in a database table?', 'It uniquely identifies each row', ['It stores duplicate rows', 'It encrypts the table', 'It replaces every foreign key'], 'A primary key is unique and identifies one record.'),
    q('Which protocol is commonly used to translate domain names to IP addresses?', 'DNS', ['FTP', 'SMTP', 'SSH'], 'DNS resolves readable names such as example.com to IP addresses.'),
    q('What does TCP provide that UDP does not guarantee?', 'Reliable ordered delivery', ['Smaller IP addresses', 'HTML rendering', 'Disk formatting'], 'TCP uses acknowledgements and ordering to provide reliable transport.'),
    q('What is a process in an operating system?', 'A running program with its own memory space', ['A single CPU register', 'A file extension', 'A network cable'], 'A process is an executing program managed by the OS.'),
    q('What is the purpose of cache memory?', 'To store frequently used data close to the CPU', ['To permanently archive files', 'To replace the keyboard', 'To encrypt all packets'], 'Cache speeds access to recently or frequently used data.'),
    q('What does a compiler do?', 'Translates source code into executable or lower-level code', ['Deletes syntax errors automatically', 'Hosts a website', 'Designs database tables'], 'A compiler converts source code into a form the machine can execute or process.'),
    q('Which statement best describes hashing?', 'It maps data to a fixed-size value for lookup or verification', ['It always encrypts data reversibly', 'It increases screen brightness', 'It creates network cables'], 'Hash functions produce fixed-size digests used in tables and integrity checks.'),
    q('What is database normalization used for?', 'Reducing redundancy and improving data consistency', ['Making every table anonymous', 'Increasing duplicate columns', 'Turning SQL into HTML'], 'Normalization organizes tables to reduce duplicated data and update problems.'),
    q('What condition can cause a deadlock?', 'Processes wait forever for resources held by each other', ['A monitor loses power', 'A database has no rows', 'A variable has a string value'], 'Deadlock happens when tasks circularly wait for resources.'),
    q('What does Big O notation describe?', 'How algorithm cost grows with input size', ['The exact CPU temperature', 'The brand of a database', 'The number of pixels on screen'], 'Big O expresses asymptotic time or space growth.'),
    q('What is virtualization?', 'Running simulated computing environments on shared hardware', ['Changing a file extension', 'Printing source code', 'Removing all memory'], 'Virtualization lets virtual machines or containers share physical resources.'),
    q('Which idea best describes a REST API?', 'Resources exposed through standard HTTP operations', ['A spreadsheet formula language', 'A processor instruction set', 'A hard drive partition type'], 'REST commonly models resources and actions through HTTP methods and URLs.'),
    q('What is a packet in networking?', 'A small unit of data sent across a network', ['A database password', 'A compiler warning', 'A CPU core'], 'Networks split messages into packets for routing and delivery.'),
    q('What is machine learning?', 'Systems improving predictions from data patterns', ['Manual typing speed practice', 'Formatting HTML tags', 'Installing a power cable'], 'Machine learning uses data to train models that make predictions or decisions.'),
    q('Which storage type is non-volatile?', 'SSD storage', ['CPU register', 'RAM', 'Processor cache'], 'Non-volatile storage keeps data when power is off.'),
  ],
  Python: [
    q('Which keyword defines a function in Python?', 'def', ['func', 'function', 'method'], 'Python uses def to define a function.'),
    q('Which Python type is mutable?', 'list', ['tuple', 'str', 'int'], 'Lists can be changed after creation.'),
    q('What does a dictionary store?', 'Key-value pairs', ['Only ordered numbers', 'Only characters', 'Only duplicate keys'], 'A dict maps keys to values.'),
    q('What is the result of len([1, 2, 3])?', '3', ['2', '4', 'None'], 'len returns the number of items in the list.'),
    q('Which statement handles exceptions in Python?', 'try and except', ['catch and finally only', 'error and handle', 'rescue and ensure'], 'Python catches exceptions with try and except blocks.'),
    q('What does pip install?', 'Python packages', ['Operating systems', 'Browser cookies', 'CPU drivers'], 'pip is the standard package installer for Python.'),
    q('What is self used for in an instance method?', 'The current object instance', ['The parent package name', 'The return type', 'The Python interpreter'], 'self refers to the object receiving the method call.'),
    q('What is __init__ commonly used for?', 'Initializing a new object', ['Deleting a module', 'Starting a loop', 'Opening a database automatically'], '__init__ runs when a class instance is created.'),
    q('Which object is immutable?', 'tuple', ['list', 'dict', 'set'], 'Tuples cannot be changed after creation.'),
    q('What does yield create?', 'A generator sequence', ['A compiled binary', 'A class attribute only', 'A database row'], 'yield pauses a function and returns values lazily.'),
    q('What is a context manager commonly used for?', 'Managing setup and cleanup around a block', ['Changing the Python version', 'Creating random syntax', 'Disabling all exceptions'], 'with statements use context managers for resources such as files.'),
    q('Which style guide is commonly used for Python code?', 'PEP 8', ['RFC 2616', 'ECMA-262', 'ISO 9001'], 'PEP 8 describes common Python formatting conventions.'),
    q('What does items[1:4] return?', 'A slice from index 1 up to index 4', ['Only index 4', 'The whole list reversed', 'A syntax error always'], 'Python slicing stops before the end index.'),
    q('What does import math do?', 'Makes the math module available', ['Deletes math functions', 'Creates a class named math', 'Runs a web server'], 'import loads a module so its names can be used.'),
    q('What is a lambda in Python?', 'A small anonymous function', ['A package manager', 'A file type', 'A loop keyword'], 'lambda creates an expression-based anonymous function.'),
    q('What does a decorator do?', 'Wraps or modifies a function or class behavior', ['Comments out code', 'Changes source files into images', 'Forces integer division'], 'Decorators apply callable wrappers with @ syntax.'),
    q('Why can mutable default arguments be risky?', 'The same object can be reused across calls', ['They are always faster', 'They cannot store values', 'They disable imports'], 'Default argument objects are created once when the function is defined.'),
    q('Which value is considered falsy?', 'Empty string', ['Non-empty list', '42', 'True'], 'Empty containers and empty strings evaluate as false.'),
    q('What does pathlib help with?', 'Working with filesystem paths', ['Training neural networks only', 'Changing CSS styles', 'Sending email automatically'], 'pathlib provides object-oriented path handling.'),
    q('Which expression creates a list comprehension?', '[x * 2 for x in numbers]', ['list x * 2 in numbers', 'for x => numbers', 'new List(numbers)'], 'List comprehensions build lists from iterable expressions.'),
  ],
  JAVA: [
    q('What does the JVM execute?', 'Bytecode', ['Raw Java source only', 'CSS rules', 'SQL rows'], 'Java source is compiled to bytecode that runs on the JVM.'),
    q('What does the JDK include?', 'Tools to develop and run Java programs', ['Only a text editor', 'Only a browser', 'Only database tables'], 'The JDK includes the JRE plus development tools such as javac.'),
    q('What does static mean for a method?', 'It belongs to the class rather than an instance', ['It cannot be called', 'It is always private', 'It stores images'], 'Static members are associated with the class.'),
    q('What is an interface used for?', 'Defining a contract that classes can implement', ['Allocating RAM manually', 'Running SQL joins', 'Formatting HTML'], 'Interfaces specify methods and constants for implementers.'),
    q('Which collection allows indexed access and dynamic resizing?', 'ArrayList', ['HashMap', 'TreeSet', 'Thread'], 'ArrayList stores ordered elements and grows dynamically.'),
    q('What does HashMap store?', 'Key-value pairs', ['Only sorted integers', 'Only threads', 'Only exceptions'], 'HashMap maps keys to values.'),
    q('Which keyword prevents a class from being subclassed?', 'final', ['static', 'void', 'package'], 'A final class cannot be extended.'),
    q('What is garbage collection?', 'Automatic cleanup of unreachable objects', ['Manual SQL backup', 'CSS minification', 'Keyboard input handling'], 'The JVM reclaims memory from objects that can no longer be reached.'),
    q('Which method starts a Java thread?', 'start()', ['runNow()', 'executeMain()', 'beginClass()'], 'Calling start creates a new thread and invokes run on it.'),
    q('Why override equals and hashCode together?', 'Hash-based collections depend on both contracts', ['The compiler requires it for every class', 'It makes code run as JavaScript', 'It disables exceptions'], 'Objects equal by equals should have the same hashCode.'),
    q('What do generics provide?', 'Compile-time type checking for parameterized types', ['Automatic UI design', 'Database indexing only', 'Network routing'], 'Generics let collections and classes use typed parameters.'),
    q('What is a Java stream useful for?', 'Processing collections with operations like map and filter', ['Streaming video only', 'Opening ports only', 'Compiling bytecode manually'], 'Streams support functional-style data processing.'),
    q('What does try-with-resources manage?', 'Automatic closing of resources', ['Automatic class inheritance', 'Password hashing', 'HTML rendering'], 'Resources implementing AutoCloseable are closed automatically.'),
    q('What is a package?', 'A namespace for organizing related classes', ['A single CPU instruction', 'An exception type only', 'A CSS selector'], 'Packages group Java classes and avoid name conflicts.'),
    q('What is an abstract class?', 'A class that can define shared behavior and incomplete methods', ['A class that must be static', 'A class with no fields ever', 'A database table'], 'Abstract classes can contain implemented and abstract methods.'),
    q('What is constructor overloading?', 'Providing multiple constructors with different parameter lists', ['Running a constructor twice automatically', 'Deleting the default constructor only', 'Changing source code at runtime'], 'Overloaded constructors let objects be created in different ways.'),
    q('Why is String immutable in Java?', 'Its contents cannot be changed after creation', ['It cannot be printed', 'It is always null', 'It is not an object'], 'String operations create new String values instead of modifying existing ones.'),
    q('Which access modifier is most restrictive?', 'private', ['public', 'protected', 'default package access'], 'private members are visible only inside their class.'),
    q('What is checked at compile time for checked exceptions?', 'They must be caught or declared', ['They must be ignored', 'They must be public classes', 'They must be stored in arrays'], 'Checked exceptions require catch blocks or throws declarations.'),
    q('Which keyword is used to inherit a class?', 'extends', ['implements', 'inherits', 'using'], 'A Java class extends another class.'),
  ],
  HTML: [
    q('Which element represents the main heading of a page?', 'h1', ['head', 'title', 'section'], 'h1 marks the highest-level heading in page content.'),
    q('Which attribute provides alternative text for an image?', 'alt', ['href', 'srcset', 'role'], 'alt describes image content for accessibility and fallback.'),
    q('Which element creates a hyperlink?', 'a', ['link', 'nav', 'button'], 'The a element links to another resource with href.'),
    q('Which input type is best for email addresses?', 'email', ['textline', 'mailbox', 'address'], 'type=email enables email-specific validation and keyboards.'),
    q('Which element groups navigation links?', 'nav', ['aside', 'footer', 'canvas'], 'nav identifies major navigation blocks.'),
    q('What does the label element improve?', 'Form accessibility and clickable field labels', ['Image compression', 'CSS specificity', 'Server routing'], 'Labels associate text with form controls.'),
    q('Which element is used for tabular data rows?', 'tr', ['td', 'table-row', 'row'], 'tr defines a row inside a table.'),
    q('Which element stores metadata and links to resources?', 'head', ['header', 'main', 'body'], 'head contains metadata, stylesheets, scripts, and title.'),
    q('What is the purpose of semantic HTML?', 'To describe the meaning and structure of content', ['To encrypt all text', 'To remove CSS', 'To make every element a div'], 'Semantic elements help browsers, users, and assistive technology understand content.'),
    q('Which attribute points an anchor to its destination?', 'href', ['src', 'target-text', 'alt'], 'href defines the URL for a link.'),
    q('Which element embeds a video?', 'video', ['movie', 'media', 'source-only'], 'The video element displays video content.'),
    q('Which attribute makes an input required before submit?', 'required', ['must', 'validate', 'checked'], 'required prevents form submission until a value is provided.'),
    q('What is the correct element for independent self-contained content?', 'article', ['span', 'br', 'meta'], 'article represents content that can stand on its own.'),
    q('Which element creates a dropdown list?', 'select', ['dropdown', 'option-list', 'choice'], 'select contains option elements for a dropdown control.'),
    q('Which element contains the visible page content?', 'body', ['head', 'meta', 'title'], 'body holds rendered page content.'),
    q('Which attribute gives an element a unique identifier?', 'id', ['class', 'name-only', 'key'], 'id should uniquely identify one element in the document.'),
    q('What does the button type submit do in a form?', 'Submits the form', ['Resets browser cache', 'Downloads a file always', 'Creates a table'], 'A submit button sends the form data.'),
    q('Which element defines emphasized text?', 'em', ['bold', 'italic', 'mark-only'], 'em indicates stress emphasis semantically.'),
    q('Which element is best for page footer content?', 'footer', ['bottom', 'end', 'caption'], 'footer contains footer information for a page or section.'),
    q('What does iframe embed?', 'Another HTML page or external content frame', ['Only image pixels', 'Only CSS variables', 'Only table rows'], 'iframe displays another browsing context inside the page.'),
  ],
  CSS: [
    q('Which selector targets an element by id?', '#menu', ['.menu', 'menu', '*menu'], 'The # prefix selects an element by id.'),
    q('What does the box model include?', 'Content, padding, border, and margin', ['Only text and color', 'Only width and height', 'Only flex and grid'], 'Every element box is built from content, padding, border, and margin.'),
    q('Which property changes text color?', 'color', ['font-color', 'text-paint', 'foreground'], 'color controls the foreground text color.'),
    q('Which display value enables flexbox?', 'flex', ['block-flex', 'row', 'align'], 'display:flex creates a flex formatting context.'),
    q('Which property controls spacing inside an element?', 'padding', ['margin', 'gap-only', 'outline'], 'Padding is space between content and border.'),
    q('Which unit is relative to the root font size?', 'rem', ['px', 'vh', 'cm'], 'rem is based on the root element font size.'),
    q('Which property changes the stacking order of positioned elements?', 'z-index', ['stack', 'layer-index', 'order-index'], 'z-index controls stacking for positioned elements.'),
    q('What does media query support?', 'Applying styles based on viewport or device conditions', ['Running database queries', 'Submitting forms', 'Loading Python packages'], 'Media queries adapt CSS to conditions such as width.'),
    q('Which property rounds element corners?', 'border-radius', ['corner', 'radius-border', 'rounding'], 'border-radius controls corner curvature.'),
    q('Which grid property defines columns?', 'grid-template-columns', ['grid-columns-only', 'column-template', 'flex-columns'], 'grid-template-columns defines the column tracks.'),
    q('What does gap control in flex or grid layouts?', 'Space between rows and columns', ['Text color', 'Border thickness only', 'Image source'], 'gap sets spacing between layout items.'),
    q('Which pseudo-class targets hover state?', ':hover', ['::hover', ':over', '.hovering'], ':hover applies when the pointer is over an element.'),
    q('Which property controls font weight?', 'font-weight', ['text-bold', 'weight-font', 'boldness'], 'font-weight sets light, normal, bold, and numeric weights.'),
    q('What does position: fixed do?', 'Positions an element relative to the viewport', ['Removes it from the DOM', 'Makes it a grid item', 'Centers it automatically'], 'Fixed positioning anchors an element to the viewport.'),
    q('Which property controls overflow clipping or scrolling?', 'overflow', ['clip-mode', 'scroll-style', 'visibility-only'], 'overflow controls content that exceeds its box.'),
    q('Which value makes an element invisible but keeps layout space?', 'visibility: hidden', ['display: none', 'opacity: none', 'hidden: true'], 'visibility:hidden hides the element while preserving its layout space.'),
    q('Which property animates between two states?', 'transition', ['transform-only', 'timeline', 'motion-path-only'], 'transition defines animated changes between property values.'),
    q('What does object-fit: cover do for images?', 'Fills the box while preserving aspect ratio and cropping if needed', ['Stretches without ratio', 'Repeats the image', 'Turns image into SVG'], 'cover scales media to fill its container while maintaining ratio.'),
    q('Which selector targets direct children?', '>', ['+', '~', '*'], 'The child combinator selects direct child elements.'),
    q('What does minmax() do in CSS Grid?', 'Defines a track size range', ['Creates a color gradient', 'Measures font contrast', 'Runs JavaScript'], 'minmax sets minimum and maximum track sizes.'),
  ],
  JAVAScript: [
    q('Which keyword declares a block-scoped variable?', 'let', ['var', 'define', 'dim'], 'let creates block-scoped bindings.'),
    q('What does const prevent?', 'Reassigning the binding', ['Mutating every object property', 'Calling functions', 'Using arrays'], 'const prevents assigning a new value to the variable name.'),
    q('Which method converts JSON text into an object?', 'JSON.parse', ['JSON.stringify', 'Object.toJSON', 'parse.JSON'], 'JSON.parse reads a JSON string and returns a JavaScript value.'),
    q('What is a Promise?', 'An object representing eventual completion or failure', ['A CSS selector', 'A database row', 'A browser tab only'], 'Promises model asynchronous results.'),
    q('Which operator checks value and type equality?', '===', ['==', '=', '!='], '=== performs strict equality comparison.'),
    q('Which DOM method selects the first matching CSS selector?', 'querySelector', ['getAll', 'findStyle', 'selectFirstOnly'], 'document.querySelector returns the first matching element.'),
    q('What does addEventListener do?', 'Registers a function to run when an event occurs', ['Creates an HTML element', 'Starts a database', 'Compiles CSS'], 'Event listeners react to user or browser events.'),
    q('What does async before a function mean?', 'The function returns a Promise', ['The function becomes private', 'The function cannot await', 'The function is a class'], 'async functions always return promises and can use await.'),
    q('Which array method creates a new transformed array?', 'map', ['forEach', 'push', 'pop'], 'map returns a new array from callback results.'),
    q('Which array method keeps items that pass a test?', 'filter', ['reduce', 'join', 'shift'], 'filter returns only elements where the callback is truthy.'),
    q('What does localStorage store?', 'String key-value data in the browser', ['Server files', 'CPU cache', 'Compiled binaries'], 'localStorage persists string data per origin.'),
    q('Which syntax imports a named export?', 'import { item } from "./module.js"', ['include item from module', 'require named item only', 'using item module'], 'ES modules import named exports with braces.'),
    q('What is event bubbling?', 'An event propagating from target up through ancestors', ['A network retry', 'A CSS animation', 'A database lock'], 'Bubbling lets parent elements handle child events.'),
    q('Which value represents absence of an assigned value?', 'undefined', ['NaN only', 'false only', '0 only'], 'undefined is the default value for unassigned variables.'),
    q('What does NaN mean?', 'Not a Number', ['New array notation', 'Null and negative', 'Named async node'], 'NaN represents an invalid numeric result.'),
    q('What is closure?', 'A function retaining access to its outer scope', ['A browser closing', 'A finished CSS transition', 'A SQL commit'], 'Closures preserve lexical scope after outer functions return.'),
    q('Which method adds an item to the end of an array?', 'push', ['pop', 'shift', 'slice'], 'push appends values to an array.'),
    q('What does preventDefault do on an event?', 'Stops the browser default action', ['Stops JavaScript execution forever', 'Deletes the event target', 'Prevents all future clicks'], 'preventDefault cancels default behavior such as form submit navigation.'),
    q('Which API makes HTTP requests in modern browsers?', 'fetch', ['requestFile', 'httpOpen', 'net.query'], 'fetch sends network requests and returns a Promise.'),
    q('What does template literal syntax use?', 'Backticks', ['Single quotes only', 'Angle brackets', 'Parentheses only'], 'Template literals are enclosed with backticks and support interpolation.'),
  ],
  SQL: [
    q('Which clause filters rows before grouping?', 'WHERE', ['ORDER BY', 'HAVING', 'LIMIT'], 'WHERE filters source rows before grouping and aggregation.'),
    q('Which statement reads data from a table?', 'SELECT', ['INSERT', 'UPDATE', 'DROP'], 'SELECT retrieves rows and columns.'),
    q('Which clause sorts query results?', 'ORDER BY', ['GROUP BY', 'WHERE', 'JOIN'], 'ORDER BY controls result ordering.'),
    q('What does INNER JOIN return?', 'Rows with matching values in both tables', ['All rows from both tables always', 'Only unmatched left rows', 'Only table schemas'], 'INNER JOIN keeps rows where the join condition matches.'),
    q('Which aggregate counts rows?', 'COUNT', ['SUM', 'AVG', 'MAX'], 'COUNT returns the number of rows or non-null values.'),
    q('What does GROUP BY do?', 'Combines rows into groups for aggregation', ['Deletes duplicates automatically', 'Sorts only alphabetically', 'Creates foreign keys'], 'GROUP BY groups rows before aggregate calculations.'),
    q('Which command adds new rows?', 'INSERT', ['ALTER', 'SELECT', 'GRANT'], 'INSERT creates rows in a table.'),
    q('Which command changes existing rows?', 'UPDATE', ['CREATE', 'SELECT', 'TRUNCATE'], 'UPDATE modifies existing table data.'),
    q('Which command removes rows based on a condition?', 'DELETE', ['DROP DATABASE', 'SELECT', 'COMMIT'], 'DELETE removes matching rows from a table.'),
    q('What is a foreign key?', 'A column that references a key in another table', ['A key stored outside the database', 'A password field', 'A duplicate primary key'], 'Foreign keys model relationships between tables.'),
    q('What is an index used for?', 'Speeding up data lookup', ['Encrypting columns', 'Creating HTML tables', 'Changing row color'], 'Indexes help the database find rows efficiently.'),
    q('Which clause filters grouped results?', 'HAVING', ['WHERE ONLY', 'ORDER BY', 'FROM'], 'HAVING filters after GROUP BY aggregation.'),
    q('What does DISTINCT do?', 'Removes duplicate rows from the result', ['Deletes duplicate records from disk', 'Sorts descending', 'Creates an index'], 'DISTINCT returns unique result rows.'),
    q('Which SQL keyword limits returned rows in many databases?', 'LIMIT', ['TAKE', 'ROWS ONLY ALWAYS', 'SMALL'], 'LIMIT restricts how many rows are returned.'),
    q('What is normalization?', 'Organizing data to reduce redundancy and dependency problems', ['Compressing table files only', 'Encrypting usernames', 'Sorting every query'], 'Normalization splits data into related tables to avoid anomalies.'),
    q('Which transaction command saves changes permanently?', 'COMMIT', ['ROLLBACK', 'SAVEPOINT ONLY', 'UNDO'], 'COMMIT finalizes transaction changes.'),
    q('Which function returns the average of values?', 'AVG', ['MEANING', 'CENTER', 'AVERAGE_ROW'], 'AVG calculates arithmetic mean.'),
    q('What does LEFT JOIN preserve?', 'All rows from the left table', ['Only rows from the right table', 'Only duplicate rows', 'Only indexes'], 'LEFT JOIN returns left rows even when no right match exists.'),
    q('Which constraint prevents null values?', 'NOT NULL', ['NO EMPTY', 'REQUIRED KEY', 'NULL FALSE'], 'NOT NULL requires a value in the column.'),
    q('What does SQL injection exploit?', 'Unsafe construction of SQL from user input', ['Slow network cables', 'CSS inheritance', 'Browser zoom'], 'SQL injection happens when user input is treated as executable SQL.'),
  ],
  Swift: [
    q('Which keyword declares a constant in Swift?', 'let', ['var', 'const', 'static only'], 'let creates a constant binding.'),
    q('Which keyword declares a variable?', 'var', ['let', 'mut', 'dynamic'], 'var creates a mutable variable.'),
    q('What does an optional represent?', 'A value that may be present or nil', ['A value that is always an integer', 'A private class only', 'A compiled asset'], 'Optionals safely model missing values.'),
    q('Which symbol force unwraps an optional?', '!', ['?', '&', '#'], '! force unwraps but can crash if the value is nil.'),
    q('Which syntax safely unwraps an optional?', 'if let', ['if nil', 'unwrap force', 'maybe var'], 'if let binds a non-nil optional value safely.'),
    q('What is a struct in Swift?', 'A value type', ['A reference type always', 'A package manager', 'A database'], 'Swift structs are value types copied by value.'),
    q('What is a class in Swift?', 'A reference type', ['A value type only', 'A CSS rule', 'A SQL view'], 'Class instances are reference types.'),
    q('Which protocol commonly identifies unique values in lists?', 'Identifiable', ['UniqueList', 'IDOnly', 'Serializable'], 'Identifiable exposes an id used by SwiftUI lists and other APIs.'),
    q('What does guard help with?', 'Early exit when a condition is not met', ['Running a loop forever', 'Creating a storyboard', 'Encrypting strings'], 'guard keeps main logic less nested by exiting early.'),
    q('Which collection stores unique unordered values?', 'Set', ['Array', 'Dictionary', 'Tuple'], 'Set contains unique elements without guaranteed order.'),
    q('Which collection stores key-value pairs?', 'Dictionary', ['Array', 'Set', 'Range'], 'Dictionary maps keys to values.'),
    q('What does a closure do?', 'Captures and runs a block of code', ['Closes the app always', 'Deletes memory manually', 'Defines a database'], 'Closures are self-contained blocks that can capture values.'),
    q('Which framework is commonly used for declarative Apple UI?', 'SwiftUI', ['UIKitSQL', 'NodeKit', 'StyleSheet'], 'SwiftUI builds UI declaratively with Swift.'),
    q('What does @State do in SwiftUI?', 'Stores view-local mutable state', ['Creates a database table', 'Starts a network server', 'Marks a class final'], '@State lets a view own mutable state.'),
    q('Which keyword defines a protocol?', 'protocol', ['interface', 'contract', 'trait'], 'Swift uses protocol to define requirements.'),
    q('What is type inference?', 'The compiler determines a value type from context', ['The user manually types faster', 'The runtime ignores types', 'The app downloads types'], 'Swift can infer types from assigned values and expressions.'),
    q('Which access level is most restrictive?', 'private', ['public', 'open', 'internal'], 'private limits access to the enclosing declaration scope.'),
    q('What does enum define?', 'A type with a finite set of cases', ['Only an error message', 'Only an array index', 'A CSS selector'], 'Enums model related cases in one type.'),
    q('Which keyword handles errors thrown by a function?', 'do-catch', ['try-catch-finally', 'handle-error', 'rescue'], 'Swift handles thrown errors with do, try, and catch.'),
    q('What does Codable support?', 'Encoding and decoding data', ['Drawing vector icons only', 'Compiling CSS', 'Managing CPU threads only'], 'Codable combines Encodable and Decodable for data conversion.'),
  ],
  PHP: [
    q('Which symbol starts a PHP variable name?', '$', ['@', '#', '&'], 'PHP variables begin with a dollar sign.'),
    q('Which superglobal contains GET query parameters?', '$_GET', ['$_POST', '$_SESSION', '$_SERVER_ONLY'], '$_GET stores values from the query string.'),
    q('Which superglobal contains submitted form body data from POST?', '$_POST', ['$_GET', '$_FILES_ONLY', '$_COOKIE_ONLY'], '$_POST stores form data sent with POST.'),
    q('Which function outputs text in PHP?', 'echo', ['printTextOnly', 'console.log', 'writeLine'], 'echo writes output to the response.'),
    q('What does include do?', 'Loads and evaluates another PHP file', ['Creates a database', 'Starts a browser', 'Deletes a session'], 'include inserts another PHP file into the current script.'),
    q('Which function starts a session?', 'session_start()', ['start_session()', 'session_open_only()', 'new Session()'], 'session_start initializes or resumes a session.'),
    q('Which array contains uploaded file information?', '$_FILES', ['$_UPLOAD', '$_POST_FILES', '$_MEDIA'], '$_FILES describes files uploaded through forms.'),
    q('Which operator concatenates strings?', '.', ['+', '&', '||'], 'PHP uses the dot operator for string concatenation.'),
    q('What does PDO help with?', 'Database access using a consistent interface', ['CSS layout', 'Image compression only', 'HTML validation only'], 'PDO provides a database access abstraction layer.'),
    q('Why use prepared statements?', 'To bind values safely and reduce SQL injection risk', ['To make CSS faster', 'To remove all indexes', 'To create sessions automatically'], 'Prepared statements separate SQL structure from values.'),
    q('Which visibility allows access only inside the class?', 'private', ['public', 'protected', 'global'], 'private class members are only accessible within the defining class.'),
    q('Which keyword creates a class?', 'class', ['object', 'struct', 'module'], 'PHP defines classes with the class keyword.'),
    q('What does namespace help prevent?', 'Name collisions between classes or functions', ['Browser cache issues', 'Weak passwords', 'Slow monitors'], 'Namespaces organize code and avoid conflicting names.'),
    q('Which statement handles exceptions?', 'try and catch', ['except only', 'rescue only', 'handle and error'], 'PHP uses try-catch for exceptions.'),
    q('Which function returns the number of items in an array?', 'count()', ['length()', 'sizeOfOnly()', 'items()'], 'count returns the number of elements.'),
    q('What is Composer used for?', 'Managing PHP dependencies', ['Compiling Java', 'Designing database diagrams only', 'Running CSS animations'], 'Composer installs and autoloads PHP packages.'),
    q('Which file commonly stores Composer dependencies?', 'composer.json', ['package.php', 'requirements.txt', 'Gemfile'], 'composer.json declares PHP package dependencies.'),
    q('What does password_hash do?', 'Creates a secure password hash', ['Encrypts a whole database', 'Sends email', 'Starts a session'], 'password_hash creates salted password hashes for storage.'),
    q('What does header("Location: /path") commonly do?', 'Redirects the browser', ['Creates a file', 'Starts a SQL transaction', 'Changes a class name'], 'A Location header instructs the browser to navigate elsewhere.'),
    q('Which syntax accesses an object property?', '$object->property', ['$object.property', '$object::property only', 'object[property] only'], 'The arrow operator accesses instance properties and methods.'),
  ],
}

function buildCatalogQuizQuestions(subject, test) {
  const bank = catalogQuestionBank[subject] ?? catalogQuestionBank['Computer Science']
  const offset = stableOffset(`${subject}-${test.title}`)
  return Array.from({ length: test.questions }, (_, index) => {
    const source = bank[(offset + index) % bank.length]
    const questionId = `catalog-${subject}-${test.title}-${index + 1}`
    const correctIndex = (offset + index) % 4
    const optionTexts = [...source.distractors]
    optionTexts.splice(correctIndex, 0, source.answer)
    return {
      id: questionId,
      question_text: source.questionText,
      marks: 1,
      explanation: source.explanation,
      correct_option_id: `${questionId}-option-${correctIndex + 1}`,
      options: optionTexts.map((optionText, optionIndex) => ({
        id: `${questionId}-option-${optionIndex + 1}`,
        option_text: optionText,
      })),
    }
  })
}

function buildCatalogQuiz(subjectEntry, test) {
  return {
    id: `catalog-${subjectEntry.subject}-${test.title}`,
    title: test.title,
    category: subjectEntry.subject,
    difficulty: test.difficulty,
    duration: test.duration,
    questions_count: test.questions,
    passing_score: 60,
    max_attempts: 1,
    description: `${subjectEntry.description} ${test.title}.`,
    isCatalogQuiz: true,
    questions: buildCatalogQuizQuestions(subjectEntry.subject, test),
  }
}

function buildLocalAttemptInfo(quiz) {
  const startedAt = new Date()
  const expiresAt = new Date(startedAt.getTime() + Number(quiz.duration || 0) * 60 * 1000)
  return {
    attempt_id: `local-${quiz.id}-${startedAt.getTime()}`,
    quiz_id: quiz.id,
    quiz_title: quiz.title,
    category: quiz.category,
    difficulty: quiz.difficulty,
    question_count: quiz.questions?.length ?? quiz.questions_count ?? 0,
    started_at: startedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: 'IN_PROGRESS',
    quiz_snapshot: quiz,
    local: true,
  }
}

function buildLocalAttemptReview(quiz, answers, startedAt, submittedAt, attemptInfo) {
  const questions = quiz.questions ?? []
  const totalMarks = questions.reduce((sum, question) => sum + Number(question.marks ?? 1), 0)
  let score = 0
  let correctCount = 0
  let incorrectCount = 0
  let unansweredCount = 0

  const results = questions.map((question) => {
    const selectedOptionId = answers[question.id] ?? null
    const selectedOption = question.options.find((option) => option.id === selectedOptionId) ?? null
    const correctOption = question.options.find((option) => option.id === question.correct_option_id) ?? null
    const isCorrect = Boolean(selectedOptionId) && selectedOptionId === question.correct_option_id

    if (!selectedOptionId) {
      unansweredCount += 1
    } else if (isCorrect) {
      correctCount += 1
      score += Number(question.marks ?? 1)
    } else {
      incorrectCount += 1
    }

    return {
      question_id: question.id,
      question_text: question.question_text,
      selected_option_text: selectedOption?.option_text ?? null,
      correct_option_text: correctOption?.option_text ?? null,
      marks_awarded: isCorrect ? Number(question.marks ?? 1) : 0,
      marks: Number(question.marks ?? 1),
      explanation: question.explanation ?? '',
      is_correct: isCorrect,
    }
  })

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0
  const time_taken_seconds = Math.max(
    0,
    Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000),
  )

  return {
    attempt_id: attemptInfo.attempt_id,
    quiz_id: attemptInfo.quiz_id,
    quiz_title: attemptInfo.quiz_title,
    category: attemptInfo.category,
    difficulty: attemptInfo.difficulty,
    status: 'SUBMITTED',
    submitted_at: submittedAt,
    score,
    total_marks: totalMarks,
    percentage,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    unanswered_count,
    passed: percentage >= Number(quiz.passing_score ?? 60),
    time_taken_seconds,
    results,
    local: true,
  }
}

function findAvailableQuizById(quizId, backendQuizzes = []) {
  const id = String(quizId)
  const backendQuiz = backendQuizzes.find((quiz) => String(quiz.id) === id)
  if (backendQuiz) {
    return backendQuiz
  }
  return (
    studentQuizCatalog
      .flatMap((subjectEntry) => subjectEntry.tests.map((test) => buildCatalogQuiz(subjectEntry, test)))
      .find((quiz) => String(quiz.id) === id) ?? null
  )
}

export default function App() {
  const [mode, setMode] = useState('register')
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) ?? '')
  const [pathname, setPathname] = useState(() => window.location.pathname || '/')
  const [user, setUser] = useState(null)
  const [passwordResetToken, setPasswordResetToken] = useState('')
  const [roleInfo, setRoleInfo] = useState(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [probeMessage, setProbeMessage] = useState('')
  const [studentQuizzes, setStudentQuizzes] = useState([])
  const [selectedStudentQuizId, setSelectedStudentQuizId] = useState('')
  const [selectedStudentQuiz, setSelectedStudentQuiz] = useState(null)
  const [selectedCatalogTestTitle, setSelectedCatalogTestTitle] = useState('')
  const [studentSubjectFilter, setStudentSubjectFilter] = useState('All subjects')
  const [studentDifficultyFilter, setStudentDifficultyFilter] = useState('All levels')
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
  const [adminAttempts, setAdminAttempts] = useState([])
  const [adminAttemptQuery, setAdminAttemptQuery] = useState('')
  const [adminAttemptStatusFilter, setAdminAttemptStatusFilter] = useState('')
  const [selectedAdminAttemptReview, setSelectedAdminAttemptReview] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [categories, setCategories] = useState([])
  const [questions, setQuestions] = useState([])
  const [adminQuery, setAdminQuery] = useState('')
  const [adminStatusFilter, setAdminStatusFilter] = useState('')
  const [quizQuery, setQuizQuery] = useState('')
  const [quizStatusFilter, setQuizStatusFilter] = useState('')
  const [selectedQuizId, setSelectedQuizId] = useState('')
  const [quizQuestionTargets, setQuizQuestionTargets] = useState(() => {
    if (typeof window === 'undefined') {
      return {}
    }
    try {
      return JSON.parse(window.localStorage.getItem('quizflow_admin_question_targets') || '{}')
    } catch {
      return {}
    }
  })
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    category: 'Python',
    difficulty: 'Intermediate',
    duration: 20,
    question_target: 20,
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
  const [notice, setNotice] = useState('Welcome to QuizFlow.')
  const [studentNotifications, setStudentNotifications] = useState([])
  const [studentUnreadCount, setStudentUnreadCount] = useState(0)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [adminReadNotificationIds, setAdminReadNotificationIds] = useState([])
  const profileMenuRef = useRef(null)
  const notificationMenuRef = useRef(null)
  const attemptReviewRef = useRef(null)
  const liveAttemptRef = useRef(null)
  const submitAttemptLockRef = useRef(false)

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
          setNotice('Signed in successfully.')
          if (normalizedPathname === '/login' || normalizedPathname === '/register' || normalizedPathname === '/auth') {
            navigate(data.role === 'ADMIN' ? '/admin/home' : '/student/home')
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
            const latestSubmittedAttempt = (data.items ?? []).find((item) => item.status === 'SUBMITTED')
            setSelectedAttemptHistoryId(latestSubmittedAttempt ? String(latestSubmittedAttempt.attempt_id) : '')
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
      setStudentNotifications([])
      setStudentUnreadCount(0)
      setNotificationMenuOpen(false)
      return
    }

    void loadStudentNotifications({ quiet: true })
    const interval = window.setInterval(() => {
      void loadStudentNotifications({ quiet: true })
    }, 30000)

    return () => window.clearInterval(interval)
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

    const localAttempt = studentAttempts.find((attempt) => String(attempt.attempt_id) === String(selectedAttemptHistoryId))
    if (localAttempt?.local && localAttempt.review) {
      setSelectedAttemptReview(localAttempt.review)
      return
    }
    if (String(selectedAttemptHistoryId).startsWith('local-')) {
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
  }, [selectedAttemptHistoryId, studentAttempts, token, user?.role])

  useEffect(() => {
    if (selectedAttemptReview && pathname.replace(/\/+$/, '') === '/student/quiz-details') {
      window.setTimeout(() => {
        attemptReviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [pathname, selectedAttemptReview])

  useEffect(() => {
    if (studentStartInfo && pathname.replace(/\/+$/, '') === '/student/quiz-details') {
      window.setTimeout(() => {
        liveAttemptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [pathname, studentStartInfo])

  useEffect(() => {
    if (!token || user?.role !== 'STUDENT' || !selectedStudentQuizId) {
      setSelectedStudentQuiz(null)
      return
    }

    const localQuiz = findAvailableQuizById(selectedStudentQuizId, studentQuizzes)
    if (localQuiz?.isCatalogQuiz) {
      setSelectedStudentQuiz(localQuiz)
      setCurrentQuestionIndex(0)
      setStudentAnswers({})
      setStudentStartInfo((current) =>
        current && String(current.quiz_id) === String(localQuiz.id) ? current : null,
      )
      setStudentSubmissionResult(null)
      setSubmittingAttempt(false)
      setRemainingSeconds(Number(localQuiz.duration || 0) * 60)
      return
    }

    let cancelled = false

    request(`/student/quizzes/${selectedStudentQuizId}`, { token })
      .then((data) => {
        if (!cancelled) {
          setSelectedStudentQuiz(data)
          setCurrentQuestionIndex(0)
          setStudentAnswers({})
          setStudentStartInfo((current) =>
            current && String(current.quiz_id) === String(selectedStudentQuizId) ? current : null,
          )
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
  }, [selectedStudentQuizId, studentQuizzes, token, user?.role])

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
      setAdminAttempts([])
      setSelectedAdminAttemptReview(null)
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
        const attemptParams = new URLSearchParams()
        if (adminAttemptQuery.trim()) {
          attemptParams.set('search', adminAttemptQuery.trim())
        }
        if (adminAttemptStatusFilter) {
          attemptParams.set('status', adminAttemptStatusFilter)
        }

        const [stats, users, analytics, attempts] = await Promise.all([
          request('/admin/dashboard', { token }),
          request(`/admin/users${params.toString() ? `?${params.toString()}` : ''}`, { token }),
          request('/admin/analytics', { token }),
          request(`/admin/attempts${attemptParams.toString() ? `?${attemptParams.toString()}` : ''}`, { token }),
        ])

        if (!cancelled) {
          setAdminStats(stats)
          setAdminUsers(users.items ?? [])
          setAdminAnalytics(analytics)
          setAdminAttempts(attempts.items ?? [])
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
  }, [token, user?.role, adminQuery, adminStatusFilter, adminAttemptQuery, adminAttemptStatusFilter])

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
      if (payload.mode === 'forgot') {
        if (payload.password !== payload.confirmPassword) {
          throw new Error('New password and confirm password must match')
        }
        const data = await request('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: payload.email }),
        })
        if (!data.reset_token) {
          setNotice(data.message)
          return
        }
        await request('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            token: data.reset_token,
            password: payload.password,
          }),
        })
        setPasswordResetToken('')
        setMode('login')
        setNotice('Password reset successfully. You can now log in.')
      } else if (payload.mode === 'reset') {
        await request('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            token: payload.resetToken,
            password: payload.password,
          }),
        })
        setPasswordResetToken('')
        setMode('login')
        setNotice('Password reset successfully. You can now log in.')
      } else if (payload.mode === 'register') {
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

  async function loadStudentNotifications({ quiet = false } = {}) {
    if (!token || user?.role !== 'STUDENT') {
      return
    }

    if (!quiet) {
      setNotificationLoading(true)
    }
    try {
      const data = await request('/student/notifications?limit=20', { token })
      setStudentNotifications(data.items ?? [])
      setStudentUnreadCount(data.unread_count ?? 0)
    } catch (err) {
      if (!quiet) {
        setProbeMessage(err instanceof Error ? err.message : 'Unable to load notifications')
      }
    } finally {
      if (!quiet) {
        setNotificationLoading(false)
      }
    }
  }

  async function markNotificationRead(notification) {
    if (!token || user?.role !== 'STUDENT') {
      return
    }

    try {
      if (!notification.is_read) {
        const updated = await request(`/student/notifications/${notification.id}/read`, {
          method: 'PATCH',
          token,
        })
        setStudentNotifications((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        )
        setStudentUnreadCount((current) => Math.max(0, current - 1))
      }
      setNotificationMenuOpen(false)
      if (notification.action_url) {
        navigate(notification.action_url)
      }
    } catch (err) {
      setProbeMessage(err instanceof Error ? err.message : 'Unable to update notification')
    }
  }

  async function markAllStudentNotificationsRead() {
    if (!token || user?.role !== 'STUDENT') {
      return
    }

    setNotificationLoading(true)
    try {
      const data = await request('/student/notifications/read-all', { method: 'PATCH', token })
      setStudentNotifications(data.items ?? [])
      setStudentUnreadCount(data.unread_count ?? 0)
    } catch (err) {
      setProbeMessage(err instanceof Error ? err.message : 'Unable to update notifications')
    } finally {
      setNotificationLoading(false)
    }
  }

  function openAdminNotification(notification) {
    setAdminReadNotificationIds((current) =>
      current.includes(notification.id) ? current : [...current, notification.id],
    )
    setNotificationMenuOpen(false)
    goToAdminRoute(notification.section)
  }

  function markAllAdminNotificationsRead() {
    setAdminReadNotificationIds(adminNotifications.map((notification) => notification.id))
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
      const attemptParams = new URLSearchParams()
      if (adminAttemptQuery.trim()) {
        attemptParams.set('search', adminAttemptQuery.trim())
      }
      if (adminAttemptStatusFilter) {
        attemptParams.set('status', adminAttemptStatusFilter)
      }

      const [stats, users, analytics, attempts] = await Promise.all([
        request('/admin/dashboard', { token }),
        request(`/admin/users${params.toString() ? `?${params.toString()}` : ''}`, { token }),
        request('/admin/analytics', { token }),
        request(`/admin/attempts${attemptParams.toString() ? `?${attemptParams.toString()}` : ''}`, { token }),
      ])
      setAdminStats(stats)
      setAdminUsers(users.items ?? [])
      setAdminAnalytics(analytics)
      setAdminAttempts(attempts.items ?? [])
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

  async function refreshQuestions(quizId = selectedQuizId, options = {}) {
    if (!token || user?.role !== 'ADMIN' || !quizId) {
      return []
    }

    try {
      const data = await request(`/admin/quizzes/${quizId}/questions`, { token })
      const questionItems = data.items ?? []
      setQuestions(questionItems)
      if (!options.silent) {
        setAdminMessage('Questions refreshed.')
      }
      return questionItems
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Unable to refresh questions')
      return []
    }
  }

  async function openAdminAttemptReview(attemptId) {
    if (!token || user?.role !== 'ADMIN') {
      return
    }

    try {
      const data = await request(`/admin/attempts/${attemptId}`, { token })
      setSelectedAdminAttemptReview(data)
      setAdminMessage('Attempt review loaded.')
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : 'Unable to load attempt review')
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
      question_target: quizQuestionTargets[String(quiz.id)] ?? 20,
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
      question_target: 20,
      passing_score: 60,
      max_attempts: 1,
      status: 'DRAFT',
      thumbnail_url: '',
    })
  }

  function selectQuizForQuestionBuilder(quiz, target = quizQuestionTargets[String(quiz.id)] ?? null) {
    const quizId = String(quiz.id)
    if (target) {
      setQuizQuestionTargets((current) => ({
        ...current,
        [quizId]: Number(target),
      }))
    }
    setSelectedQuizId(quizId)
    setEditingQuestionId(null)
    setQuestionForm({
      quiz_id: quizId,
      question_text: '',
      marks: 1,
      explanation: '',
      difficulty: quiz.difficulty ?? 'Intermediate',
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
      ],
    })
    window.setTimeout(() => {
      document.getElementById('admin-question-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  async function saveQuiz(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { question_target: questionTarget, ...quizFields } = quizForm
      const targetCount = Math.max(1, Math.min(100, Number(questionTarget) || 1))
      const payload = {
        ...quizFields,
        duration: Number(quizForm.duration),
        passing_score: Number(quizForm.passing_score),
        max_attempts: Number(quizForm.max_attempts),
        description: quizForm.description || null,
        thumbnail_url: quizForm.thumbnail_url || null,
      }

      const path = editingQuizId ? `/admin/quizzes/${editingQuizId}` : '/admin/quizzes'
      const method = editingQuizId ? 'PUT' : 'POST'
      const savedQuiz = await request(path, {
        method,
        token,
        body: JSON.stringify(payload),
      })
      setQuizQuestionTargets((current) => ({
        ...current,
        [String(savedQuiz.id)]: targetCount,
      }))
      if (editingQuizId) {
        setAdminMessage('Quiz updated.')
      } else {
        setAdminMessage(`Quiz created. Add question 1 of ${targetCount}.`)
        selectQuizForQuestionBuilder(savedQuiz, targetCount)
      }
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

  function resetQuestionForm(quizId = selectedQuizId) {
    setEditingQuestionId(null)
    setQuestionForm({
      quiz_id: String(quizId || ''),
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
      const targetQuizId = String(questionForm.quiz_id)
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
      setSelectedQuizId(targetQuizId)
      const updatedQuestions = await refreshQuestions(targetQuizId, { silent: true })
      const targetCount = Number(quizQuestionTargets[targetQuizId] ?? 0)
      const updatedCount = updatedQuestions.length
      if (editingQuestionId) {
        setAdminMessage('Question updated.')
      } else if (targetCount && updatedCount < targetCount) {
        setAdminMessage(`Question ${updatedCount} saved. Add question ${updatedCount + 1} of ${targetCount}.`)
      } else if (targetCount && updatedCount >= targetCount) {
        setAdminMessage(`Question set complete: ${updatedCount}/${targetCount} questions added.`)
      } else {
        setAdminMessage('Question created.')
      }
      resetQuestionForm(targetQuizId)
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

    const quiz = selectedStudentQuiz ?? studentAvailableQuizzes.find((item) => String(item.id) === String(selectedStudentQuizId)) ?? null
    if (!quiz) {
      setProbeMessage('Unable to locate the selected quiz')
      return
    }

    if (quiz.isCatalogQuiz) {
      const localAttempt = buildLocalAttemptInfo(quiz)
      setSelectedStudentQuiz(quiz)
      setStudentStartInfo(localAttempt)
      setStudentSubmissionResult(null)
      setSelectedAttemptHistoryId('')
      setSelectedAttemptReview(null)
      setCurrentQuestionIndex(0)
      setRemainingSeconds(Number(quiz.duration || 0) * 60)
      setStudentAnswers({})
      setNotice('Quiz started. Timer is running.')
      navigate('/student/quiz-details')
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
      navigate('/student/quiz-details')
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

  function submitLocalAttempt(isAutoSubmit = false) {
    if (!studentStartInfo?.local || studentSubmissionResult) {
      return false
    }

    const quiz =
      studentStartInfo.quiz_snapshot ??
      selectedStudentQuiz ??
      studentAvailableQuizzes.find((item) => String(item.id) === String(studentStartInfo.quiz_id)) ??
      null
    if (!quiz?.questions?.length) {
      setProbeMessage('Unable to grade the local quiz')
      return false
    }

    const unansweredCount = quiz.questions.filter((question) => !studentAnswers[question.id]).length
    if (!isAutoSubmit && unansweredCount > 0) {
      const shouldSubmit = window.confirm(
        `You still have ${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'}. Submit anyway?`,
      )
      if (!shouldSubmit) {
        return false
      }
    }

    const submittedAt = new Date().toISOString()
    const result = buildLocalAttemptReview(
      quiz,
      studentAnswers,
      studentStartInfo.started_at,
      submittedAt,
      studentStartInfo,
    )
    const historyItem = {
      attempt_id: result.attempt_id,
      quiz_title: result.quiz_title,
      status: result.status,
      submitted_at: result.submitted_at,
      score: result.score,
      total_marks: result.total_marks,
      percentage: result.percentage,
      category: result.category,
      difficulty: result.difficulty,
      passed: result.passed,
      local: true,
      review: result,
    }

    setProbeMessage('')
    setStudentStartInfo(null)
    setStudentSubmissionResult(result)
    setSelectedAttemptReview(result)
    setSelectedAttemptHistoryId(String(result.attempt_id))
    setCurrentQuestionIndex(0)
    setStudentAttempts((current) => [
      historyItem,
      ...current.filter((item) => String(item.attempt_id) !== String(result.attempt_id)),
    ])
    setNotice(
      isAutoSubmit
        ? `Time is up. Quiz submitted automatically. Score: ${result.percentage}%.`
        : `Quiz submitted successfully. Score: ${result.percentage}%.`,
    )
    window.setTimeout(() => {
      attemptReviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return true
  }

  async function submitAttempt(isAutoSubmit = false) {
    if (!studentStartInfo || submittingAttempt || studentSubmissionResult || submitAttemptLockRef.current) {
      return
    }

    submitAttemptLockRef.current = true
    setSubmittingAttempt(true)
    setProbeMessage('')

    try {
      if (studentStartInfo.local) {
        submitLocalAttempt(isAutoSubmit)
        return
      }

      const activeQuestions = selectedStudentQuiz?.questions ?? []
      const unansweredCount = activeQuestions.filter((question) => !studentAnswers[question.id]).length
      if (!isAutoSubmit && unansweredCount > 0) {
        const shouldSubmit = window.confirm(
          `You still have ${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'}. Submit anyway?`,
        )
        if (!shouldSubmit) {
          return
        }
      }

      const payload = {
        answers: Object.entries(studentAnswers)
          .map(([questionId, selectedOptionId]) => ({
            question_id: Number(questionId),
            selected_option_id: Number(selectedOptionId),
          }))
          .filter((answer) => Number.isFinite(answer.question_id) && Number.isFinite(answer.selected_option_id)),
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
        await loadStudentNotifications({ quiet: true })
      } catch {
        // Best-effort refresh; the submitted result is still shown below.
      }
      setNotice(isAutoSubmit ? 'Time is up. The quiz was submitted automatically.' : 'Quiz submitted successfully.')
    } catch (err) {
      setProbeMessage(err instanceof Error ? err.message : 'Unable to submit quiz')
    } finally {
      setSubmittingAttempt(false)
      window.setTimeout(() => {
        submitAttemptLockRef.current = false
      }, 0)
    }
  }

  function handleManualSubmit(event) {
    event.preventDefault()
    void submitAttempt(false)
  }

  const activeStudentQuestion = selectedStudentQuiz?.questions?.[currentQuestionIndex] ?? null
  const answeredCount = Object.keys(studentAnswers).length
  const activeAttemptReview = selectedAttemptReview ?? studentSubmissionResult
  const dashboardAverage = studentDashboard?.average_score ?? 0
  const leaderboardCategoryLabel = studentLeaderboard?.selected_category ?? selectedLeaderboardCategory
  const studentCatalogQuizItems = useMemo(
    () =>
      studentQuizCatalog.flatMap((subjectEntry) =>
        subjectEntry.tests.map((catalogTest) => buildCatalogQuiz(subjectEntry, catalogTest)),
      ),
    [],
  )
  const studentAvailableQuizzes = useMemo(() => {
    const backendKeys = new Set(studentQuizzes.map((quiz) => `${quiz.category}::${quiz.title}`))
    return [
      ...studentQuizzes,
      ...studentCatalogQuizItems.filter((quiz) => !backendKeys.has(`${quiz.category}::${quiz.title}`)),
    ]
  }, [studentCatalogQuizItems, studentQuizzes])
  const studentSubjectOptions = useMemo(
    () => [
      'All subjects',
      ...new Set(
        [...studentQuizCatalog.map((item) => item.subject), ...studentAvailableQuizzes.map((item) => item.category)].filter(Boolean),
      ),
    ],
    [studentAvailableQuizzes],
  )
  const studentDifficultyOptions = useMemo(
    () => [
      'All levels',
      ...new Set(
        [
          ...studentQuizCatalog.flatMap((subject) => subject.tests.map((item) => item.difficulty)),
          ...studentAvailableQuizzes.map((item) => item.difficulty),
        ].filter(Boolean),
      ),
    ],
    [studentAvailableQuizzes],
  )
  const studentCatalogSubjects = useMemo(() => {
    return studentQuizCatalog.filter((subject) => {
      return studentSubjectFilter === 'All subjects' || subject.subject === studentSubjectFilter
    })
  }, [studentSubjectFilter])
  const studentCatalogTests = useMemo(() => {
    return studentCatalogSubjects.flatMap((subject) =>
      subject.tests
        .filter((test) => studentDifficultyFilter === 'All levels' || test.difficulty === studentDifficultyFilter)
        .map((test) => ({ ...test, subject: subject.subject, description: subject.description })),
    )
  }, [studentCatalogSubjects, studentDifficultyFilter])
  const studentFilteredQuizzes = useMemo(() => {
    return studentAvailableQuizzes.filter((quiz) => {
      const matchesSubject = studentSubjectFilter === 'All subjects' || quiz.category === studentSubjectFilter
      const matchesDifficulty =
        studentDifficultyFilter === 'All levels' || quiz.difficulty === studentDifficultyFilter
      return matchesSubject && matchesDifficulty
    })
  }, [studentAvailableQuizzes, studentDifficultyFilter, studentSubjectFilter])
  const getDefaultStudentQuizForFilters = (subjectFilter, difficultyFilter = studentDifficultyFilter) => {
    const matchingQuiz =
      studentAvailableQuizzes.find((quiz) => {
        const matchesSubject = subjectFilter === 'All subjects' || quiz.category === subjectFilter
        const matchesDifficulty = difficultyFilter === 'All levels' || quiz.difficulty === difficultyFilter
        return matchesSubject && matchesDifficulty
      }) ??
      studentAvailableQuizzes.find((quiz) => subjectFilter === 'All subjects' || quiz.category === subjectFilter) ??
      studentAvailableQuizzes[0] ??
      null

    return matchingQuiz
  }
  const normalizeStudentQuiz = (quiz, subjectFilter = studentSubjectFilter, difficultyFilter = studentDifficultyFilter) => {
    if (!quiz) {
      return null
    }

    const normalizedQuestions = Array.isArray(quiz.questions) ? quiz.questions : []
    return {
      ...quiz,
      id: quiz.id ?? `fallback-${subjectFilter}-${difficultyFilter}`,
      title: quiz.title ?? `${subjectFilter === 'All subjects' ? 'Quiz' : subjectFilter} setup`,
      category: quiz.category ?? subjectFilter ?? 'All subjects',
      difficulty: quiz.difficulty ?? difficultyFilter ?? 'Intermediate',
      duration: Number(quiz.duration ?? 30),
      questions_count: Number(quiz.questions_count ?? normalizedQuestions.length ?? 20),
      passing_score: Number(quiz.passing_score ?? 60),
      max_attempts: Number(quiz.max_attempts ?? 1),
      description: quiz.description ?? 'Select a quiz to view the setup details.',
      questions: normalizedQuestions,
    }
  }
  const selectStudentQuizForFilters = (subjectFilter, difficultyFilter = studentDifficultyFilter) => {
    const nextQuiz = getDefaultStudentQuizForFilters(subjectFilter, difficultyFilter)
    if (!nextQuiz) {
      setSelectedStudentQuizId('')
      setSelectedStudentQuiz(null)
      return
    }

    setSelectedStudentQuizId(String(nextQuiz.id))
    setSelectedStudentQuiz(nextQuiz.isCatalogQuiz ? nextQuiz : null)
  }
  const activeStudentQuiz =
    normalizeStudentQuiz(
      selectedStudentQuiz ??
        studentAvailableQuizzes.find((item) => String(item.id) === selectedStudentQuizId) ??
        getDefaultStudentQuizForFilters(studentSubjectFilter, studentDifficultyFilter),
    )

  useEffect(() => {
    if (!token || user?.role !== 'STUDENT' || studentAvailableQuizzes.length === 0) {
      return
    }

    const matchesCurrentFilters = (quiz) => {
      const matchesSubject = studentSubjectFilter === 'All subjects' || quiz.category === studentSubjectFilter
      const matchesDifficulty =
        studentDifficultyFilter === 'All levels' || quiz.difficulty === studentDifficultyFilter
      return matchesSubject && matchesDifficulty
    }

    const currentQuiz = studentAvailableQuizzes.find((quiz) => String(quiz.id) === selectedStudentQuizId)
    if (currentQuiz && matchesCurrentFilters(currentQuiz)) {
      if (currentQuiz.isCatalogQuiz) {
        setSelectedStudentQuiz(currentQuiz)
      } else if (selectedStudentQuiz) {
        setSelectedStudentQuiz(null)
      }
      return
    }

    const nextQuiz =
      studentAvailableQuizzes.find((quiz) => matchesCurrentFilters(quiz)) ??
      studentAvailableQuizzes.find(
        (quiz) => studentSubjectFilter === 'All subjects' || quiz.category === studentSubjectFilter,
      ) ??
      studentAvailableQuizzes[0]

    if (nextQuiz) {
      setSelectedStudentQuizId(String(nextQuiz.id))
      setSelectedStudentQuiz(nextQuiz.isCatalogQuiz ? nextQuiz : null)
    }
  }, [
    selectedStudentQuiz,
    selectedStudentQuizId,
    studentAvailableQuizzes,
    studentDifficultyFilter,
    studentSubjectFilter,
    token,
    user?.role,
  ])

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
  const studentJourney = [
    {
      step: '1',
      title: 'Create or sign in',
      copy: 'Students enter a protected workspace with their own dashboard, history, and profile menu.',
    },
    {
      step: '2',
      title: 'Choose a quiz',
      copy: 'Browse by subject and level, review duration, question count, passing score, and attempt limits.',
    },
    {
      step: '3',
      title: 'Attend the quiz',
      copy: 'Start a timed attempt, move through questions, submit answers, and get a clear result review.',
    },
    {
      step: '4',
      title: 'Track progress',
      copy: 'Use rankings, attempts, scores, and notifications to keep improving across subjects.',
    },
  ]
  const landingCapabilities = [
    {
      title: 'Student quiz delivery',
      copy: 'Published quizzes appear in the student workspace with subject filters, level filters, setup details, and live attempt controls.',
      meta: 'Timed attempts',
    },
    {
      title: 'Ranking and results',
      copy: 'Students can review scores, attempt history, correct answers, explanations, and overall or subject-wise leaderboard position.',
      meta: 'Progress tracking',
    },
    {
      title: 'New quiz notifications',
      copy: 'The notification bell shows unread alerts when an admin publishes a quiz or when a student ranking changes.',
      meta: 'Real-time awareness',
    },
    {
      title: 'Smart profile menu',
      copy: 'Account details, workspace access, settings entry points, and logout actions are grouped in a clean user menu.',
      meta: 'Account control',
    },
  ]
  const platformFeatures = [
    'Admin quiz creation, questions, options, publishing, and status control',
    'Student dashboard with attempts, pass/fail counts, best score, and recent activity',
    'Protected student and admin routes with role-based access',
    'Password reset flow, profile menu, search, notifications, and responsive layouts',
    'Analytics for quiz performance, recent attempts, category performance, and user management',
  ]
  const studentFeatureGuide = [
    {
      title: 'Start quizzes',
      copy: 'Open Start quiz, choose a subject and level, review quiz setup details, then begin a timed attempt.',
      action: 'Browse quizzes',
      route: '/student/start-quiz',
    },
    {
      title: 'Track ranking',
      copy: 'Use Ranking to compare overall and subject performance after completed attempts.',
      action: 'View ranking',
      route: '/student/ranking',
    },
    {
      title: 'Read notifications',
      copy: 'Use the bell icon for new quiz alerts and ranking movement updates from your student workspace.',
      action: 'Check bell',
      route: '/student/home',
    },
    {
      title: 'Manage profile',
      copy: 'Open the profile icon to view account details, workspace actions, settings entry points, and logout.',
      action: 'Open menu',
      route: '/student/home',
    },
  ]
  const studentHowItWorks = [
    'Choose a subject such as Python, Computer Science, JAVA, HTML, CSS, JavaScript, SQL, Swift, or PHP.',
    'Select a difficulty level and inspect duration, question count, passing score, and max attempts.',
    'Start the quiz, answer each question before the timer ends, and submit when ready.',
    'Review score, correct answers, explanations, attempt history, and leaderboard changes.',
  ]
  const studentWorkspaceBenefits = [
    { label: 'Quiz setup', value: 'Subject, level, time, questions, passing score, and attempts' },
    { label: 'Live attempt', value: 'Timer, question navigation, answer selection, and auto-submit support' },
    { label: 'Result review', value: 'Score, percentage, pass/fail status, correct answer, and explanation' },
    { label: 'Progress hub', value: 'Recent attempts, best score, average score, active subjects, and rankings' },
  ]
  const adminFeatureGuide = [
    {
      title: 'Manage quizzes',
      copy: 'Create quizzes, edit quiz details, control publication status, and keep student-facing assessments ready.',
      action: 'Open quizzes',
      route: '/admin/quizzes',
    },
    {
      title: 'Build content',
      copy: 'Maintain subjects, add real questions, mark correct options, set explanations, and organize quiz content.',
      action: 'Open content',
      route: '/admin/content',
    },
    {
      title: 'Review attempts',
      copy: 'Track submitted and in-progress attempts, inspect results, and review student answers when needed.',
      action: 'View attempts',
      route: '/admin/attempts',
    },
    {
      title: 'Read analytics',
      copy: 'Use score averages, pass/fail trends, recent attempts, and category performance to improve quizzes.',
      action: 'View analytics',
      route: '/admin/analytics',
    },
    {
      title: 'Manage users',
      copy: 'Search users, monitor roles, activate or deactivate accounts, and remove accounts when required.',
      action: 'Open users',
      route: '/admin/users',
    },
    {
      title: 'Check alerts',
      copy: 'Use the notification bell for draft quizzes, unpublished quizzes, inactive users, and new submissions.',
      action: 'Check bell',
      route: '/admin/home',
    },
  ]
  const adminHowItWorks = [
    'Use Home to review platform health, active users, quiz status, pending work, and operational alerts.',
    'Create categories and quizzes, then add questions, options, marks, difficulty, and explanations.',
    'Publish only ready quizzes so students can discover them from Start quiz with the correct setup details.',
    'Monitor attempts and analytics after students submit, then update weak questions or quiz settings.',
    'Manage student accounts and respond to notification items before they affect the live student experience.',
  ]
  const adminWorkspaceBenefits = [
    { label: 'Quiz operations', value: 'Create, edit, publish, unpublish, and audit quizzes from one workspace' },
    { label: 'Question control', value: 'Subjects, difficulty, marks, correct options, explanations, and answer choices' },
    { label: 'Student monitoring', value: 'Attempt status, score, pass/fail result, submitted time, and detailed review' },
    { label: 'Platform insight', value: 'User counts, active accounts, draft work, quiz attempts, averages, and alerts' },
  ]
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/'
  const normalizeRoute = (route) => route.replace(/\/+$/, '') || '/'
  const isLandingPage = normalizedPathname === '/'
  const isLoginPage = normalizedPathname === '/login' || normalizedPathname === '/auth'
  const isRegisterPage = normalizedPathname === '/register'
  const isAdminPage = normalizedPathname === '/admin'
  const isAdminHomePage = isAdminPage || normalizedPathname === '/admin/home'
  const isAdminAnalyticsPage = normalizedPathname === '/admin/analytics'
  const isAdminAttemptsPage = normalizedPathname === '/admin/attempts'
  const isAdminUsersPage = normalizedPathname === '/admin/users'
  const isAdminQuizzesPage = normalizedPathname === '/admin/quizzes'
  const isAdminContentPage = normalizedPathname === '/admin/content'
  const isAdminRoute =
    isAdminHomePage ||
    isAdminAnalyticsPage ||
    isAdminAttemptsPage ||
    isAdminUsersPage ||
    isAdminQuizzesPage ||
    isAdminContentPage
  const isStudentHomePage = normalizedPathname === '/student' || normalizedPathname === '/student/home'
  const isStudentStartQuizPage = normalizedPathname === '/student/start-quiz'
  const isStudentStartQuizSubjectPage = normalizedPathname.startsWith('/student/start-quiz/')
  const isStudentRankingPage = normalizedPathname === '/student/ranking'
  const isStudentQuizDetailsPage = normalizedPathname === '/student/quiz-details'
  const isStudentRoute =
    isStudentHomePage || isStudentStartQuizPage || isStudentStartQuizSubjectPage || isStudentRankingPage || isStudentQuizDetailsPage
  const isDashboardPage = normalizedPathname === '/dashboard'
  const isWorkspacePage = isAdminRoute || isStudentRoute || isDashboardPage
  const isStudentRole = user?.role === 'STUDENT'
  const isAdminRole = user?.role === 'ADMIN'
  const authPanelMode = isRegisterPage ? 'register' : mode === 'register' ? 'login' : mode
  const workspaceTitle = user?.role === 'ADMIN' ? 'Admin control center' : 'Student learning center'
  const workspaceSubtitle = roleInfo
    ? `${roleInfo.role} · ${roleInfo.status}`
    : user
      ? `${user.role} · ${user.status}`
      : 'Guest access'
  const adminNotifications = useMemo(() => {
    if (!isAdminRole) {
      return []
    }

    const notifications = []
    const inProgressAttempts = adminAttempts.filter((attempt) => attempt.status !== 'SUBMITTED').length
    const completedAttempts = adminAnalytics?.completed_attempts ?? 0
    const recentAttempt = adminAnalytics?.recent_attempts?.[0]
    const inactiveUsers = adminUsers.filter((item) => !item.is_active).length

    if (recentAttempt) {
      notifications.push({
        id: `recent-attempt-${recentAttempt.attempt_id}`,
        title: 'New quiz attempt submitted',
        message: `${recentAttempt.user_name} submitted ${recentAttempt.quiz_title} with ${recentAttempt.percentage}%.`,
        category: 'Attempts',
        created_at: recentAttempt.submitted_at,
        section: 'attempts',
      })
    }

    if (inProgressAttempts > 0) {
      notifications.push({
        id: `in-progress-attempts-${inProgressAttempts}`,
        title: 'Attempts in progress',
        message: `${inProgressAttempts} student attempt${inProgressAttempts === 1 ? ' is' : 's are'} currently not submitted.`,
        category: 'Live attempts',
        created_at: new Date().toISOString(),
        section: 'attempts',
      })
    }

    if ((adminStats?.draft_quizzes ?? 0) > 0) {
      notifications.push({
        id: `draft-quizzes-${adminStats.draft_quizzes}`,
        title: 'Draft quizzes need publishing',
        message: `${adminStats.draft_quizzes} quiz${adminStats.draft_quizzes === 1 ? ' is' : 'zes are'} still saved as draft.`,
        category: 'Quizzes',
        created_at: new Date().toISOString(),
        section: 'quizzes',
      })
    }

    if ((adminStats?.unpublished_quizzes ?? 0) > 0) {
      notifications.push({
        id: `unpublished-quizzes-${adminStats.unpublished_quizzes}`,
        title: 'Unpublished quizzes',
        message: `${adminStats.unpublished_quizzes} quiz${adminStats.unpublished_quizzes === 1 ? ' is' : 'zes are'} hidden from students.`,
        category: 'Quiz status',
        created_at: new Date().toISOString(),
        section: 'quizzes',
      })
    }

    if (inactiveUsers > 0) {
      notifications.push({
        id: `inactive-users-${inactiveUsers}`,
        title: 'Inactive users found',
        message: `${inactiveUsers} user account${inactiveUsers === 1 ? ' is' : 's are'} inactive.`,
        category: 'Users',
        created_at: new Date().toISOString(),
        section: 'users',
      })
    }

    if (completedAttempts > 0) {
      notifications.push({
        id: `completed-attempts-${completedAttempts}`,
        title: 'Analytics updated',
        message: `${completedAttempts} completed attempt${completedAttempts === 1 ? '' : 's'} available in analytics.`,
        category: 'Analytics',
        created_at: recentAttempt?.submitted_at ?? new Date().toISOString(),
        section: 'analytics',
      })
    }

    if (notifications.length === 0) {
      notifications.push({
        id: 'admin-all-clear',
        title: 'Workspace is up to date',
        message: 'No pending admin actions right now.',
        category: 'Admin',
        created_at: new Date().toISOString(),
        section: 'overview',
      })
    }

    return notifications
  }, [adminAnalytics, adminAttempts, adminStats, adminUsers, isAdminRole])
  const adminUnreadCount = adminNotifications.filter(
    (notification) => notification.id !== 'admin-all-clear' && !adminReadNotificationIds.includes(notification.id),
  ).length
  const selectedAdminQuiz = quizzes.find((quiz) => String(quiz.id) === String(selectedQuizId)) ?? null
  const selectedAdminQuizTarget = Number(quizQuestionTargets[String(selectedQuizId)] ?? 0)
  const selectedAdminQuestionCount = questions.length
  const selectedAdminQuestionRemaining = selectedAdminQuizTarget
    ? Math.max(selectedAdminQuizTarget - selectedAdminQuestionCount, 0)
    : 0
  const selectedAdminQuestionProgress = selectedAdminQuizTarget
    ? Math.min(100, Math.round((selectedAdminQuestionCount / selectedAdminQuizTarget) * 100))
    : 0

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || '/')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setProfileMenuOpen(false)
    setNotificationMenuOpen(false)
  }, [pathname, user?.id])

  useEffect(() => {
    if (normalizedPathname === '/student') {
      navigate('/student/home')
    }
    if (normalizedPathname === '/admin') {
      navigate('/admin/home')
    }
  }, [normalizedPathname])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem('quizflow_admin_question_targets', JSON.stringify(quizQuestionTargets))
  }, [quizQuestionTargets])

  const studentStartQuizSubjectName = useMemo(() => {
    if (!isStudentStartQuizSubjectPage) {
      return ''
    }
    const encodedSubject = normalizedPathname.slice('/student/start-quiz/'.length).split('/')[0] ?? ''
    try {
      return decodeURIComponent(encodedSubject)
    } catch {
      return encodedSubject
    }
  }, [isStudentStartQuizSubjectPage, normalizedPathname])
  const studentStartQuizSubject = useMemo(
    () => studentQuizCatalog.find((subject) => subject.subject === studentStartQuizSubjectName) ?? null,
    [studentStartQuizSubjectName],
  )
  const selectedCatalogTest =
    (studentStartQuizSubject?.tests.find((test) => test.title === selectedCatalogTestTitle) ?? null) ||
    studentStartQuizSubject?.tests[0] ||
    null

  useEffect(() => {
    if (!studentStartQuizSubject) {
      return
    }
    setStudentSubjectFilter(studentStartQuizSubject.subject)
    setStudentDifficultyFilter('All levels')
    setSelectedCatalogTestTitle(studentStartQuizSubject.tests[0]?.title ?? '')
  }, [studentStartQuizSubject])

  useEffect(() => {
    if (!studentStartQuizSubject || !selectedCatalogTest) {
      return
    }
    setSelectedStudentQuizId(buildCatalogQuiz(studentStartQuizSubject, selectedCatalogTest).id)
  }, [selectedCatalogTest, studentStartQuizSubject])

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
    if (!notificationMenuOpen) {
      return
    }

    const onPointerDown = (event) => {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setNotificationMenuOpen(false)
      }
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNotificationMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [notificationMenuOpen])

  useEffect(() => {
    if (!user) {
      if (isDashboardPage || isAdminPage || isStudentRoute) {
        navigate('/login')
      }
      return
    }

    if (isDashboardPage) {
      navigate(user.role === 'ADMIN' ? '/admin/home' : '/student/home')
    }

    if ((isAdminRoute || normalizedPathname === '/dashboard') && user.role !== 'ADMIN') {
      navigate('/student/home')
    }

    if (isStudentRoute && user.role !== 'STUDENT') {
      navigate('/admin/home')
    }
  }, [isAdminRoute, isDashboardPage, isStudentRoute, normalizedPathname, user])

  useEffect(() => {
    const titleMap = {
      '/': 'QuizFlow | Quiz Management',
      '/login': 'QuizFlow | Sign In',
      '/register': 'QuizFlow | Register',
      '/dashboard': 'QuizFlow | Dashboard',
      '/admin': 'QuizFlow | Admin',
      '/admin/home': 'QuizFlow | Admin Home',
      '/admin/analytics': 'QuizFlow | Admin Analytics',
      '/admin/attempts': 'QuizFlow | Admin Attempts',
      '/admin/users': 'QuizFlow | Admin Users',
      '/admin/quizzes': 'QuizFlow | Admin Quizzes',
      '/admin/content': 'QuizFlow | Admin Content',
      '/student': 'QuizFlow | Student Home',
      '/student/home': 'QuizFlow | Student Home',
      '/student/start-quiz': 'QuizFlow | Start Quiz',
      '/student/ranking': 'QuizFlow | Ranking',
      '/student/quiz-details': 'QuizFlow | Quiz Details',
    }
    document.title = titleMap[normalizedPathname] ?? 'QuizFlow'
  }, [normalizedPathname])

  useEffect(() => {
    document.body.classList.add('theme-frozen-teal')
    return () => {
      document.body.classList.remove('theme-frozen-teal')
    }
  }, [])

  function navigate(to) {
    const nextPath = to ? normalizeRoute(to) : ''
    if (!nextPath || nextPath === normalizedPathname) {
      return
    }
    setProfileMenuOpen(false)
    window.history.pushState({}, '', nextPath)
    setPathname(nextPath)
  }

  function openWorkspaceDetails() {
    if (!user) {
      navigate('/login')
      return
    }
    navigate(user?.role === 'ADMIN' ? '/admin/home' : '/student/home')
  }

  function goToAdminRoute(routeOrSection) {
    if (!user) {
      navigate('/login')
      return
    }

    if (!isAdminRole) {
      navigate('/student/home')
      return
    }

    const sectionRoutes = {
      overview: '/admin/home',
      analytics: '/admin/analytics',
      attempts: '/admin/attempts',
      users: '/admin/users',
      quizzes: '/admin/quizzes',
      content: '/admin/content',
    }
    navigate(sectionRoutes[routeOrSection] ?? routeOrSection ?? '/admin/home')
  }

  function goToStudentRoute(route) {
    if (!user) {
      navigate('/login')
      return
    }

    if (!isStudentRoute) {
      navigate('/student/home')
      return
    }

    navigate(route)
  }

  function renderQuestionManager() {
    return (
      <section className="table-card question-builder-panel" id="admin-question-builder">
        <div className="table-heading">
          <div>
            <h3>Question builder</h3>
            <p className="table-note">
              {selectedAdminQuiz
                ? `Add questions for ${selectedAdminQuiz.title}.`
                : 'Create or select a quiz before adding questions.'}
            </p>
          </div>
          <div className="button-row">
            <select
              value={selectedQuizId}
              onChange={(event) => {
                const nextQuizId = event.target.value
                setSelectedQuizId(nextQuizId)
                const nextQuiz = quizzes.find((quiz) => String(quiz.id) === String(nextQuizId))
                setQuestionForm({
                  quiz_id: nextQuizId,
                  question_text: '',
                  marks: 1,
                  explanation: '',
                  difficulty: nextQuiz?.difficulty ?? 'Intermediate',
                  options: [
                    { option_text: '', is_correct: true },
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false },
                  ],
                })
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
              <button className="secondary" type="button" onClick={() => resetQuestionForm()}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </div>

        <div className="question-progress-card">
          <div>
            <span>Planned questions</span>
            <strong>{selectedAdminQuizTarget || 'Not set'}</strong>
          </div>
          <div>
            <span>Added</span>
            <strong>{selectedAdminQuestionCount}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{selectedAdminQuizTarget ? selectedAdminQuestionRemaining : '-'}</strong>
          </div>
          <label>
            Set target
            <input
              type="number"
              min="1"
              max="100"
              value={selectedAdminQuizTarget || ''}
              disabled={!selectedQuizId}
              onChange={(event) => {
                const value = Math.max(1, Math.min(100, Number(event.target.value) || 1))
                setQuizQuestionTargets((current) => ({
                  ...current,
                  [String(selectedQuizId)]: value,
                }))
              }}
              placeholder="20"
            />
          </label>
          <div className="question-progress-bar full-row">
            <div style={{ width: `${selectedAdminQuestionProgress}%` }} />
          </div>
          <p className="helper full-row">
            {selectedQuizId
              ? selectedAdminQuizTarget
                ? selectedAdminQuestionRemaining > 0
                  ? `Next: add question ${selectedAdminQuestionCount + 1} of ${selectedAdminQuizTarget}.`
                  : `Target complete. You can publish this quiz when review is done.`
                : 'Set a target so the builder can guide question entry.'
              : 'Select a quiz to start adding questions.'}
          </p>
        </div>

        <form className="question-form" onSubmit={saveQuestion}>
          <label>
            Quiz
            <select
              value={questionForm.quiz_id}
              onChange={(event) => {
                const nextQuizId = event.target.value
                const nextQuiz = quizzes.find((quiz) => String(quiz.id) === String(nextQuizId))
                setSelectedQuizId(nextQuizId)
                setQuestionForm({
                  ...questionForm,
                  quiz_id: nextQuizId,
                  difficulty: nextQuiz?.difficulty ?? questionForm.difficulty,
                })
              }}
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
              onChange={(event) => setQuestionForm({ ...questionForm, question_text: event.target.value })}
              placeholder="Write the question exactly as students should see it"
            />
          </label>
          <label className="full-row">
            Explanation
            <textarea
              rows="3"
              value={questionForm.explanation}
              onChange={(event) => setQuestionForm({ ...questionForm, explanation: event.target.value })}
              placeholder="Explain why the correct answer is right"
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
              {loading
                ? 'Saving...'
                : editingQuestionId
                  ? 'Update question'
                  : selectedAdminQuizTarget && selectedAdminQuestionCount < selectedAdminQuizTarget
                    ? `Save question ${selectedAdminQuestionCount + 1} of ${selectedAdminQuizTarget}`
                    : 'Create question'}
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
    )
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">Q</div>
          <div>
            <p className="brand-name">QuizFlow</p>
          </div>
        </div>

        {user && isStudentRole ? (
          <div className="topbar-student-tabs" aria-label="Student navigation">
            <button
              type="button"
              className={isStudentHomePage ? 'topbar-link active' : 'topbar-link'}
              onClick={() => goToStudentRoute('/student/home')}
            >
              Home
            </button>
            <button
              type="button"
              className={isStudentStartQuizPage || isStudentStartQuizSubjectPage ? 'topbar-link active' : 'topbar-link'}
              onClick={() => goToStudentRoute('/student/start-quiz')}
            >
              Start quiz
            </button>
            <button
              type="button"
              className={isStudentRankingPage ? 'topbar-link active' : 'topbar-link'}
              onClick={() => goToStudentRoute('/student/ranking')}
            >
              Ranking
            </button>
            <button
              type="button"
              className={isStudentQuizDetailsPage ? 'topbar-link active' : 'topbar-link'}
              onClick={() => goToStudentRoute('/student/quiz-details')}
            >
              Quiz details
            </button>
          </div>
        ) : null}

        {user && isAdminRole ? (
          <div className="topbar-student-tabs topbar-admin-tabs" aria-label="Admin navigation">
            {adminNavItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={
                  normalizeRoute(item.route) === normalizedPathname ||
                  (item.route === '/admin/home' && normalizedPathname === '/admin')
                    ? 'topbar-link active'
                    : 'topbar-link'
                }
                onClick={() => goToAdminRoute(item.route)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

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
          ) : null}

          {user ? (
            <div className="topbar-search">
              <span className="topbar-search-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <input type="search" className="topbar-search-input" placeholder="Search" aria-label="Search" />
            </div>
          ) : null}

          {user && isStudentRole ? (
            <div className="notification-menu-anchor" ref={notificationMenuRef}>
              <button
                type="button"
                className="topbar-bell-button"
                aria-label={`Notifications${studentUnreadCount ? `, ${studentUnreadCount} unread` : ''}`}
                aria-haspopup="menu"
                aria-expanded={notificationMenuOpen}
                onClick={() => {
                  setNotificationMenuOpen((current) => !current)
                  void loadStudentNotifications()
                }}
              >
                <BellIcon />
                {studentUnreadCount > 0 ? (
                  <span className="notification-badge">{studentUnreadCount > 9 ? '9+' : studentUnreadCount}</span>
                ) : null}
              </button>

              {notificationMenuOpen ? (
                <div className="notification-menu" role="menu" aria-label="Notifications">
                  <div className="notification-menu-header">
                    <div>
                      <p className="notification-menu-title">Notifications</p>
                      <p className="notification-menu-subtitle">
                        {studentUnreadCount > 0 ? `${studentUnreadCount} unread` : 'All caught up'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="notification-mark-all"
                      disabled={notificationLoading || studentUnreadCount === 0}
                      onClick={markAllStudentNotificationsRead}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="notification-list">
                    {notificationLoading ? (
                      <p className="notification-empty">Loading notifications...</p>
                    ) : studentNotifications.length === 0 ? (
                      <p className="notification-empty">No notifications yet.</p>
                    ) : (
                      studentNotifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          className={notification.is_read ? 'notification-item' : 'notification-item unread'}
                          onClick={() => markNotificationRead(notification)}
                        >
                          <span className="notification-dot" aria-hidden="true" />
                          <span className="notification-content">
                            <strong>{notification.title}</strong>
                            <span>{notification.message}</span>
                            <small>
                              {notification.category} · {formatNotificationTime(notification.created_at)}
                            </small>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {user && isAdminRole ? (
            <div className="notification-menu-anchor" ref={notificationMenuRef}>
              <button
                type="button"
                className="topbar-bell-button"
                aria-label={`Admin notifications${adminUnreadCount ? `, ${adminUnreadCount} unread` : ''}`}
                aria-haspopup="menu"
                aria-expanded={notificationMenuOpen}
                onClick={() => setNotificationMenuOpen((current) => !current)}
              >
                <BellIcon />
                {adminUnreadCount > 0 ? (
                  <span className="notification-badge">{adminUnreadCount > 9 ? '9+' : adminUnreadCount}</span>
                ) : null}
              </button>

              {notificationMenuOpen ? (
                <div className="notification-menu" role="menu" aria-label="Admin notifications">
                  <div className="notification-menu-header">
                    <div>
                      <p className="notification-menu-title">Notifications</p>
                      <p className="notification-menu-subtitle">
                        {adminUnreadCount > 0 ? `${adminUnreadCount} unread` : 'All caught up'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="notification-mark-all"
                      disabled={adminUnreadCount === 0}
                      onClick={markAllAdminNotificationsRead}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="notification-list">
                    {adminNotifications.map((notification) => {
                      const isRead =
                        notification.id === 'admin-all-clear' || adminReadNotificationIds.includes(notification.id)

                      return (
                        <button
                          type="button"
                          key={notification.id}
                          className={isRead ? 'notification-item' : 'notification-item unread'}
                          onClick={() => openAdminNotification(notification)}
                        >
                          <span className="notification-dot" aria-hidden="true" />
                          <span className="notification-content">
                            <strong>{notification.title}</strong>
                            <span>{notification.message}</span>
                            <small>
                              {notification.category} · {formatNotificationTime(notification.created_at)}
                            </small>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

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
        <section className="landing-page">
          <section className="hero landing-hero">
            <div className="hero-copy">
              <p className="eyebrow">Quiz Management Platform</p>
              <h1>QuizFlow</h1>
              <p className="lede">
                A complete online assessment workspace where admins publish quizzes and students attend timed
                tests, review results, follow rankings, receive new quiz notifications, and manage their profile.
              </p>

              <div className="hero-actions">
                <button className="primary" type="button" onClick={() => navigate('/register')}>
                  Create student account
                </button>
                <button className="secondary" type="button" onClick={() => navigate('/login')}>
                  Login
                </button>
              </div>

              <div className="status-row">
                <span className="pill">{statusText}</span>
                <span className="notice">{notice}</span>
              </div>
            </div>

            <div className="landing-preview" aria-label="QuizFlow product preview">
              <div className="preview-topline">
                <span>Student workspace</span>
                <strong>Today</strong>
              </div>
              <div className="preview-grid">
                <div className="preview-stat">
                  <span>Available quizzes</span>
                  <strong>49</strong>
                </div>
                <div className="preview-stat">
                  <span>Best score</span>
                  <strong>100%</strong>
                </div>
                <div className="preview-stat">
                  <span>Current rank</span>
                  <strong>#4</strong>
                </div>
              </div>
              <div className="preview-quiz">
                <div>
                  <span>New quiz</span>
                  <strong>Python Basics Updated</strong>
                </div>
                <button type="button" onClick={() => navigate('/login')}>
                  Start
                </button>
              </div>
              <div className="preview-notification">
                <span>Notification</span>
                <p>Admin published a new quiz in Python.</p>
              </div>
            </div>
          </section>

          <section className="landing-section">
            <div className="section-heading">
              <p className="eyebrow">Student journey</p>
              <h2>From login to leaderboard in a clear flow.</h2>
            </div>
            <div className="journey-grid">
              {studentJourney.map((item) => (
                <article className="journey-card" key={item.step}>
                  <span>{item.step}</span>
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="landing-section split-section">
            <div className="section-heading">
              <p className="eyebrow">What students get</p>
              <h2>Everything needed to attend quizzes and track progress.</h2>
            </div>
            <div className="capability-grid">
              {landingCapabilities.map((item) => (
                <article className="capability-card" key={item.title}>
                  <span>{item.meta}</span>
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="landing-section platform-section">
            <div className="platform-copy">
              <p className="eyebrow">Platform coverage</p>
              <h2>Built for students, admins, and real assessment operations.</h2>
              <p>
                QuizFlow connects quiz publishing, timed participation, scoring, analytics, notifications,
                leaderboard visibility, account access, and profile actions in one consistent web experience.
              </p>
            </div>
            <div className="platform-list">
              {platformFeatures.map((item) => (
                <div className="platform-row" key={item}>
                  <span aria-hidden="true">OK</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="landing-section metric-strip">
            {marketingStats.map((item) => (
              <article className="marketing-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
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
              mode={authPanelMode}
              onModeChange={setMode}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
              resetTokenValue={passwordResetToken}
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

      {isWorkspacePage && !user ? (
        <section className="table-card workspace-locked">
          <p className="eyebrow">Workspace locked</p>
          <h2>Sign in to continue.</h2>
          <p className="helper">
            Your session may have expired. Sign in again to reopen the student workspace and continue where you left off.
          </p>
          <div className="button-row">
            <button className="primary" type="button" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="secondary" type="button" onClick={() => navigate('/register')}>
              Register
            </button>
            <button className="secondary" type="button" onClick={() => navigate('/')}>
              Home
            </button>
          </div>
        </section>
      ) : null}

        {isWorkspacePage && user?.role === 'ADMIN' ? (
          <section className="admin-board">
            <div className="admin-header">
              <div>
                <p className="eyebrow">
                  {isAdminAnalyticsPage
                    ? 'Admin Analytics'
                    : isAdminAttemptsPage
                      ? 'Admin Attempts'
                      : isAdminUsersPage
                        ? 'Admin Users'
                        : isAdminQuizzesPage
                          ? 'Admin Quizzes'
                          : isAdminContentPage
                            ? 'Admin Content'
                            : 'Admin Home'}
                </p>
                <h2>
                  {isAdminAnalyticsPage
                    ? 'Performance analytics and quiz outcomes'
                    : isAdminAttemptsPage
                      ? 'Student attempt monitoring and review'
                      : isAdminUsersPage
                        ? 'User management and account controls'
                        : isAdminQuizzesPage
                          ? 'Create, publish, and manage quizzes'
                          : isAdminContentPage
                            ? 'Manage categories and quiz questions'
                            : 'Platform overview and user management'}
                </h2>
              </div>
              <button className="secondary" type="button" onClick={refreshAdminData}>
                Refresh data
              </button>
            </div>

            {isAdminHomePage ? (
              <>
                <div className="admin-home-hero">
                  <div className="admin-page-copy">
                    <p className="eyebrow">Admin workspace</p>
                    <h2>Run quiz operations from one control center.</h2>
                    <p className="helper">
                      Use Admin Home to understand every admin feature, manage published quizzes, monitor students,
                      review attempts, follow analytics, control content, and respond to operational notifications.
                    </p>
                    <div className="button-row">
                      <button className="primary" type="button" onClick={() => goToAdminRoute('/admin/quizzes')}>
                        Manage quizzes
                      </button>
                      <button className="secondary" type="button" onClick={() => goToAdminRoute('/admin/analytics')}>
                        View analytics
                      </button>
                    </div>
                  </div>

                  <div className="admin-workspace-preview">
                    <div className="table-heading">
                      <h3>Platform snapshot</h3>
                      <span>{adminStats ? `${adminStats.active_users} active users` : 'Loading...'}</span>
                    </div>
                    <div className="stats-grid admin-stats">
                      <StatCard label="Students" value={adminStats?.total_students ?? 0} />
                      <StatCard label="Published quizzes" value={adminStats?.published_quizzes ?? 0} />
                      <StatCard label="Draft quizzes" value={adminStats?.draft_quizzes ?? 0} />
                      <StatCard label="Quiz attempts" value={adminStats?.total_quiz_attempts ?? 0} />
                    </div>
                  </div>
                </div>

                <section className="admin-guide-section">
                  <div className="section-heading">
                    <p className="eyebrow">Admin features</p>
                    <h2>What you can manage here.</h2>
                  </div>
                  <div className="admin-feature-grid">
                    {adminFeatureGuide.map((item) => (
                      <article className="admin-feature-card" key={item.title}>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.copy}</p>
                        </div>
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => {
                            if (item.title === 'Check alerts') {
                              setNotificationMenuOpen(true)
                              return
                            }
                            goToAdminRoute(item.route)
                          }}
                        >
                          {item.action}
                        </button>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="admin-guide-section admin-flow-section">
                  <div className="section-heading">
                    <p className="eyebrow">Admin workflow</p>
                    <h2>How the platform should be operated.</h2>
                  </div>
                  <div className="admin-flow-list">
                    {adminHowItWorks.map((item, index) => (
                      <article className="admin-flow-step" key={item}>
                        <span>{index + 1}</span>
                        <p>{item}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="admin-guide-section">
                  <div className="section-heading">
                    <p className="eyebrow">Control center</p>
                    <h2>What each admin area provides.</h2>
                  </div>
                  <div className="admin-benefit-grid">
                    {adminWorkspaceBenefits.map((item) => (
                      <article className="admin-benefit-card" key={item.label}>
                        <strong>{item.label}</strong>
                        <p>{item.value}</p>
                      </article>
                    ))}
                  </div>
                </section>

                {adminStats ? (
                  <section className="table-card">
                    <div className="table-heading">
                      <h3>Operational numbers</h3>
                      <span>Live platform data</span>
                    </div>
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
                  </section>
                ) : (
                  <section className="table-card">
                    <p className="helper">Loading admin statistics...</p>
                  </section>
                )}
              </>
            ) : null}

            {isAdminAnalyticsPage ? (
              adminAnalytics ? (
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
              )
            ) : null}

            {isAdminAttemptsPage ? (
              <>
            <section className="table-card">
              <div className="table-heading">
                <h3>Quiz attempts</h3>
                <span>{adminAttempts.length} records</span>
              </div>
              <div className="filters-panel quiz-filters">
                <label>
                  Search attempts
                  <input
                    value={adminAttemptQuery}
                    onChange={(event) => setAdminAttemptQuery(event.target.value)}
                    placeholder="Student, email, quiz, or category"
                  />
                </label>
                <label>
                  Status filter
                  <select
                    value={adminAttemptStatusFilter}
                    onChange={(event) => setAdminAttemptStatusFilter(event.target.value)}
                  >
                    <option value="">All</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="SUBMITTED">Submitted</option>
                  </select>
                </label>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Quiz</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Started</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminAttempts.map((attempt) => (
                      <tr key={attempt.attempt_id}>
                        <td>
                          <strong>{attempt.user_name}</strong>
                          <p className="table-note">{attempt.user_email}</p>
                        </td>
                        <td>
                          <strong>{attempt.quiz_title}</strong>
                          <p className="table-note">{attempt.category}</p>
                        </td>
                        <td>
                          <span className={`status-pill ${attempt.status === 'SUBMITTED' ? 'active' : 'inactive'}`}>
                            {attempt.status}
                          </span>
                        </td>
                        <td>
                          {attempt.percentage != null ? `${attempt.percentage}%` : '-'}
                          {attempt.passed != null ? (
                            <p className="table-note">{attempt.passed ? 'Passed' : 'Failed'}</p>
                          ) : null}
                        </td>
                        <td>{new Date(attempt.started_at).toLocaleString()}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="secondary"
                              type="button"
                              disabled={attempt.status !== 'SUBMITTED'}
                              onClick={() => openAdminAttemptReview(attempt.attempt_id)}
                            >
                              View result
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {adminAttempts.length === 0 ? (
                      <tr>
                        <td colSpan="6">No attempts found.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            {selectedAdminAttemptReview ? (
              <section className="table-card">
                <div className="table-heading">
                  <h3>Attempt result</h3>
                  <span className={selectedAdminAttemptReview.passed ? 'status-pill active' : 'status-pill inactive'}>
                    {selectedAdminAttemptReview.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
                <div className="detail-grid">
                  <div>
                    <span>Quiz</span>
                    <strong>{selectedAdminAttemptReview.quiz_title}</strong>
                  </div>
                  <div>
                    <span>Score</span>
                    <strong>
                      {selectedAdminAttemptReview.score}/{selectedAdminAttemptReview.total_marks}
                    </strong>
                  </div>
                  <div>
                    <span>Percentage</span>
                    <strong>{selectedAdminAttemptReview.percentage}%</strong>
                  </div>
                  <div>
                    <span>Time taken</span>
                    <strong>{selectedAdminAttemptReview.time_taken_seconds}s</strong>
                  </div>
                </div>
                <div className="result-review">
                  {selectedAdminAttemptReview.results.map((item, index) => (
                    <article key={item.question_id} className="review-card">
                      <div className="table-heading">
                        <h4>Question {index + 1}</h4>
                        <span className={item.is_correct ? 'status-pill active' : 'status-pill inactive'}>
                          {item.is_correct ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <p>{item.question_text}</p>
                      <div className="review-lines">
                        <div>
                          <span>Student answer</span>
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
              </section>
            ) : null}
              </>
            ) : null}

            {isAdminUsersPage ? (
              <>
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
              </>
            ) : null}

            {isAdminQuizzesPage ? (
              <>
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
                  Number of questions
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quizForm.question_target}
                    onChange={(event) => setQuizForm({ ...quizForm, question_target: event.target.value })}
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

            {renderQuestionManager()}

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
                            <button
                              className="secondary"
                              type="button"
                              onClick={() => selectQuizForQuestionBuilder(quiz)}
                            >
                              Add questions
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
              </>
            ) : null}

            {isAdminContentPage ? (
              <>
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
              </>
            ) : null}
          </section>
        ) : null}

        {isWorkspacePage && user?.role === 'STUDENT' ? (
          isStudentHomePage ? (
            <section className="student-page student-board" id="student-board">
              <div className="student-home-hero">
                <div className="student-page-copy">
                  <p className="eyebrow">Student Home</p>
                  <h2>Your student workspace for quizzes, progress, and rankings.</h2>
                  <p className="helper">
                    Use this page to understand every student feature, jump into published quizzes, monitor your
                    attempt history, follow rankings, read notifications, and manage your profile.
                  </p>
                  <div className="button-row">
                    <button className="primary" type="button" onClick={() => goToStudentRoute('/student/start-quiz')}>
                      Start quiz
                    </button>
                    <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/ranking')}>
                      Ranking
                    </button>
                  </div>
                </div>

                <div className="student-workspace-preview">
                  <div className="table-heading">
                    <h3>Today’s snapshot</h3>
                    <span>{studentDashboard ? `${studentDashboard.completed_attempts} completed` : 'Loading...'}</span>
                  </div>
                  <div className="stats-grid student-stats">
                    <StatCard label="Total attempts" value={studentDashboard?.total_attempts ?? 0} />
                    <StatCard label="Completed" value={studentDashboard?.completed_attempts ?? 0} />
                    <StatCard label="Best score" value={`${studentDashboard?.best_score ?? 0}%`} />
                    <StatCard label="Average score" value={`${dashboardAverage}%`} />
                  </div>
                </div>
              </div>

              <section className="student-guide-section">
                <div className="section-heading">
                  <p className="eyebrow">Student features</p>
                  <h2>What you can do here.</h2>
                </div>
                <div className="student-feature-grid">
                  {studentFeatureGuide.map((item) => (
                    <article className="student-feature-card" key={item.title}>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.copy}</p>
                      </div>
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          if (item.title === 'Read notifications') {
                            setNotificationMenuOpen(true)
                            void loadStudentNotifications()
                            return
                          }
                          if (item.title === 'Manage profile') {
                            setProfileMenuOpen(true)
                            return
                          }
                          goToStudentRoute(item.route)
                        }}
                      >
                        {item.action}
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="student-guide-section student-flow-section">
                <div className="section-heading">
                  <p className="eyebrow">How to attend a quiz</p>
                  <h2>Follow a simple, repeatable flow.</h2>
                </div>
                <div className="student-flow-list">
                  {studentHowItWorks.map((item, index) => (
                    <article className="student-flow-step" key={item}>
                      <span>{index + 1}</span>
                      <p>{item}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="student-guide-section">
                <div className="section-heading">
                  <p className="eyebrow">Workspace tools</p>
                  <h2>What each student feature shows.</h2>
                </div>
                <div className="student-benefit-grid">
                  {studentWorkspaceBenefits.map((item) => (
                    <article className="student-benefit-card" key={item.label}>
                      <strong>{item.label}</strong>
                      <p>{item.value}</p>
                    </article>
                  ))}
                </div>
              </section>

              {studentDashboard ? (
                <section className="dashboard-grid-two">
                  <section className="table-card">
                    <div className="table-heading">
                      <h3>Progress snapshot</h3>
                      <span>Performance at a glance</span>
                    </div>
                    <div className="stats-grid student-stats">
                      <StatCard label="Passed" value={studentDashboard.passed_attempts} />
                      <StatCard label="Failed" value={studentDashboard.failed_attempts} />
                      <StatCard label="Time spent" value={formatDuration(studentDashboard.total_time_spent_seconds)} />
                      <StatCard label="Recent attempts" value={studentDashboard.recent_attempts.length} />
                    </div>
                  </section>

                  <section className="table-card">
                    <div className="table-heading">
                      <h3>Active subjects</h3>
                      <span>{studentSubjectOptions.length - 1} available</span>
                    </div>
                    <div className="subject-chip-grid">
                      {studentSubjectOptions
                        .filter((subject) => subject !== 'All subjects')
                        .map((subject) => (
                          <button
                            key={subject}
                            type="button"
                            className="tab"
                            onClick={() => {
                              setStudentSubjectFilter(subject)
                              goToStudentRoute(`/student/start-quiz/${encodeURIComponent(subject)}`)
                            }}
                          >
                            {subject}
                          </button>
                        ))}
                    </div>
                  </section>
                </section>
              ) : (
                <section className="table-card">
                  <p className="helper">Loading student dashboard...</p>
                </section>
              )}

              <section className="table-card">
                <div className="table-heading">
                  <h3>New quizzes and recent attempts</h3>
                  <span>{studentQuizzes.length} published quizzes</span>
                </div>
                <div className="student-home-grid">
                  {studentQuizzes.slice(0, 4).map((quiz) => (
                    <button
                      key={quiz.id}
                      type="button"
                      className="student-home-card"
                      onClick={() => {
                        setSelectedStudentQuizId(String(quiz.id))
                        goToStudentRoute('/student/quiz-details')
                      }}
                    >
                      <strong>{quiz.title}</strong>
                      <span>{quiz.category}</span>
                      <span>
                        {quiz.difficulty} - {quiz.duration} min - {quiz.questions_count} questions
                      </span>
                    </button>
                  ))}
                  {studentQuizzes.length === 0 ? <p className="helper">No published quizzes yet.</p> : null}
                </div>

                <div className="recent-attempts-list">
                  {studentDashboard?.recent_attempts?.length > 0 ? (
                    studentDashboard.recent_attempts.slice(0, 3).map((attempt) => (
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
          ) : isStudentStartQuizSubjectPage && studentStartQuizSubject ? (
            <section className="student-page student-board">
              <div className="student-page-header">
                <div>
                  <p className="eyebrow">Start Quiz</p>
                  <h2>{studentStartQuizSubject.subject}</h2>
                  <p className="helper">{studentStartQuizSubject.description}</p>
                </div>
                <div className="button-row">
                  <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/start-quiz')}>
                    Back to library
                  </button>
                  <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/home')}>
                    Home
                  </button>
                  <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/ranking')}>
                    Ranking
                  </button>
                </div>
              </div>

              <section className="table-card quiz-catalog-section">
                <div className="table-heading">
                  <h3>{studentStartQuizSubject.subject} overview</h3>
                  <span>{studentStartQuizSubject.tests.length} tests available</span>
                </div>
                <div className="stats-grid student-stats">
                  <StatCard label="Beginner" value={studentStartQuizSubject.tests.filter((test) => test.difficulty === 'Beginner').length} />
                  <StatCard
                    label="Intermediate"
                    value={studentStartQuizSubject.tests.filter((test) => test.difficulty === 'Intermediate').length}
                  />
                  <StatCard label="Advanced" value={studentStartQuizSubject.tests.filter((test) => test.difficulty === 'Advanced').length} />
                  <StatCard label="Total questions" value={studentStartQuizSubject.tests.length * 20} />
                </div>
              </section>

              <div className="student-start-layout">
                <section className="table-card student-quiz-browser">
                  <div className="table-heading">
                    <h3>{studentStartQuizSubject.subject} test library</h3>
                    <span>Choose any test below</span>
                  </div>
                  <div className="student-quiz-grid">
                    {studentStartQuizSubject.tests.map((test) => (
                      <button
                        key={test.title}
                        type="button"
                        className={selectedCatalogTest?.title === test.title ? 'student-quiz-item active' : 'student-quiz-item'}
                        onClick={() => {
                          setSelectedCatalogTestTitle(test.title)
                          setStudentDifficultyFilter(test.difficulty)
                          setSelectedStudentQuizId(buildCatalogQuiz(studentStartQuizSubject, test).id)
                        }}
                      >
                        <strong>{test.title}</strong>
                        <span>{studentStartQuizSubject.subject}</span>
                        <span>
                          {test.difficulty} level - {test.duration} min - {test.questions} questions
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="table-card">
                  <div className="table-heading">
                    <h3>Selected test</h3>
                    <button
                      className="primary"
                      type="button"
                      disabled={!activeStudentQuiz}
                      onClick={startSelectedQuiz}
                    >
                      Start quiz
                    </button>
                  </div>

                  {selectedCatalogTest ? (
                    <>
                      <div className="detail-grid">
                        <div>
                          <span>Subject</span>
                          <strong>{studentStartQuizSubject.subject}</strong>
                        </div>
                        <div>
                          <span>Level</span>
                          <strong>{selectedCatalogTest.difficulty}</strong>
                        </div>
                        <div>
                          <span>Time</span>
                          <strong>{selectedCatalogTest.duration} minutes</strong>
                        </div>
                        <div>
                          <span>Questions</span>
                          <strong>{selectedCatalogTest.questions}</strong>
                        </div>
                      </div>

                      <div className="quiz-level-strip">
                        <span className={selectedCatalogTest.difficulty === 'Beginner' ? 'status-pill active' : 'status-pill'}>
                          Basic
                        </span>
                        <span
                          className={selectedCatalogTest.difficulty === 'Intermediate' ? 'status-pill active' : 'status-pill'}
                        >
                          Intermediate
                        </span>
                        <span className={selectedCatalogTest.difficulty === 'Advanced' ? 'status-pill active' : 'status-pill'}>
                          Advanced
                        </span>
                      </div>

                      <p className="table-note">
                        {selectedCatalogTest.description ||
                          'Select any test in this subject to preview the quiz setup and start options.'}
                      </p>

                      <div className="button-row">
                        <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/quiz-details')}>
                          Open quiz details
                        </button>
                        <button
                          className="primary"
                          type="button"
                          disabled={!activeStudentQuiz}
                          onClick={startSelectedQuiz}
                        >
                          Start quiz
                        </button>
                      </div>

                      <p className="helper">
                        {activeStudentQuiz
                          ? `Backend quiz linked: ${activeStudentQuiz.title}.`
                          : 'No published backend quiz is linked yet for this subject and level.'}
                      </p>
                    </>
                  ) : (
                    <p className="helper">Select a test to inspect its setup details.</p>
                  )}
                </section>
              </div>
            </section>
          ) : isStudentStartQuizSubjectPage ? (
            <section className="student-page student-board">
              <div className="student-page-header">
                <div>
                  <p className="eyebrow">Start Quiz</p>
                  <h2>Subject not found</h2>
                  <p className="helper">The selected subject page could not be loaded. Return to the start quiz library.</p>
                </div>
                <div className="button-row">
                  <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/start-quiz')}>
                    Back to library
                  </button>
                  <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/home')}>
                    Home
                  </button>
                </div>
              </div>

              <section className="table-card">
                <p className="helper">Try a subject like Python, JAVA, HTML, CSS, JAVAScript, SQL, Swift, PHP, or Computer Science.</p>
              </section>
            </section>
          ) : isStudentStartQuizPage ? (
            <section className="student-page student-board">
              <div className="student-page-header">
                <div>
                  <p className="eyebrow">Start Quiz</p>
                  <h2>Choose a subject, then pick a quiz, level, and duration.</h2>
                  <p className="helper">
                    Browse published quizzes by subject and difficulty before starting an attempt.
                  </p>
                </div>
                <div className="button-row">
                  <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/home')}>
                    Home
                  </button>
                  <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/ranking')}>
                    Ranking
                  </button>
                </div>
              </div>

              <section className="table-card">
                <div className="table-heading">
                  <h3>Subject filters</h3>
                  <span>{studentFilteredQuizzes.length} quizzes shown</span>
                </div>
                  <div className="student-filter-strip">
                  {studentSubjectOptions.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      className={studentSubjectFilter === subject ? 'tab active' : 'tab'}
                      onClick={() => {
                        setStudentSubjectFilter(subject)
                        selectStudentQuizForFilters(subject)
                      }}
                    >
                      {subject}
                    </button>
                  ))}
                </div>

                <div className="student-filter-strip">
                  {studentDifficultyOptions.map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      className={studentDifficultyFilter === difficulty ? 'tab active' : 'tab'}
                      onClick={() => {
                        setStudentDifficultyFilter(difficulty)
                        selectStudentQuizForFilters(studentSubjectFilter, difficulty)
                      }}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>

              </section>

              <div className="student-start-layout">
                <section className="table-card student-quiz-browser">
                  <div className="table-heading">
                    <h3>Published quizzes</h3>
                    <span>{studentFilteredQuizzes.length} available</span>
                  </div>
                  <div className="student-quiz-grid">
                    {studentFilteredQuizzes.map((quiz) => (
                      <button
                        key={quiz.id}
                        type="button"
                        className={String(quiz.id) === selectedStudentQuizId ? 'student-quiz-item active' : 'student-quiz-item'}
                        onClick={() => {
                          setSelectedStudentQuizId(String(quiz.id))
                          setSelectedStudentQuiz(quiz.isCatalogQuiz ? quiz : null)
                        }}
                      >
                        <strong>{quiz.title}</strong>
                        <span>{quiz.category}</span>
                        <span>
                          {quiz.difficulty} level - {quiz.duration} min - {quiz.questions_count} questions
                        </span>
                      </button>
                    ))}
                    {studentFilteredQuizzes.length === 0 ? <p className="helper">No quizzes match this filter.</p> : null}
                  </div>
                </section>

                <section className="table-card">
                  <div className="table-heading">
                    <h3>Quiz setup</h3>
                    <button
                      className="primary"
                      type="button"
                      disabled={!activeStudentQuiz}
                      onClick={startSelectedQuiz}
                    >
                      Start quiz
                    </button>
                  </div>

                  {activeStudentQuiz ? (
                    <>
                      <div className="detail-grid">
                        <div>
                          <span>Subject</span>
                          <strong>{activeStudentQuiz.category}</strong>
                        </div>
                        <div>
                          <span>Level</span>
                          <strong>{activeStudentQuiz.difficulty}</strong>
                        </div>
                        <div>
                          <span>Time</span>
                          <strong>{activeStudentQuiz.duration} minutes</strong>
                        </div>
                        <div>
                          <span>Questions</span>
                          <strong>{activeStudentQuiz.questions_count}</strong>
                        </div>
                        <div>
                          <span>Passing score</span>
                          <strong>{activeStudentQuiz.passing_score}%</strong>
                        </div>
                        <div>
                          <span>Max attempts</span>
                          <strong>{activeStudentQuiz.max_attempts}</strong>
                        </div>
                      </div>
                      <div className="quiz-level-strip">
                        <span className={activeStudentQuiz.difficulty === 'Beginner' ? 'status-pill active' : 'status-pill'}>Basic</span>
                        <span className={activeStudentQuiz.difficulty === 'Intermediate' ? 'status-pill active' : 'status-pill'}>Intermediate</span>
                        <span className={activeStudentQuiz.difficulty === 'Advanced' ? 'status-pill active' : 'status-pill'}>Advanced</span>
                      </div>
                      <p className="table-note">{activeStudentQuiz.description || 'No description available.'}</p>
                      <div className="button-row">
                        <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/quiz-details')}>
                          Open quiz details
                        </button>
                        <button
                          className="primary"
                          type="button"
                          disabled={!activeStudentQuiz}
                          onClick={startSelectedQuiz}
                        >
                          Start quiz
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="helper">Select a quiz to inspect its setup details.</p>
                  )}
                </section>
              </div>
            </section>
          ) : isStudentRankingPage ? (
            <section className="student-page student-board">
              <div className="student-page-header">
                <div>
                  <p className="eyebrow">Ranking</p>
                  <h2>Compare your progress with the whole class and by subject.</h2>
                  <p className="helper">
                    Ranking is separated into overall performance and subject-specific performance.
                  </p>
                </div>
                <div className="button-row">
                  <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/home')}>
                    Home
                  </button>
                  <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/start-quiz')}>
                    Start quiz
                  </button>
                </div>
              </div>

              {studentLeaderboard ? (
                <>
                  <section className="table-card">
                    <div className="table-heading">
                      <h3>Ranking overview</h3>
                      <span>{studentLeaderboard.overall.length} students ranked</span>
                    </div>
                    <div className="stats-grid student-stats">
                      <StatCard label="Overall ranked" value={studentLeaderboard.overall.length} />
                      <StatCard label="Categories" value={studentLeaderboard.categories.length} />
                      <StatCard label="Subject ranking" value={studentLeaderboard.category_leaderboard.length} />
                      <StatCard label="Selected subject" value={leaderboardCategoryLabel || 'Overall'} />
                    </div>
                  </section>

                  <section className="leaderboard-grid">
                    <div className="leaderboard-card table-card">
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

                    <div className="leaderboard-card table-card">
                      <div className="table-heading">
                        <h4>Subject ranking{leaderboardCategoryLabel ? ` - ${leaderboardCategoryLabel}` : ''}</h4>
                        <span>{studentLeaderboard.categories.length} subjects</span>
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
                                <td colSpan="5">No subject ranking available yet.</td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <section className="table-card">
                  <p className="helper">Loading leaderboard...</p>
                </section>
              )}
            </section>
          ) : isStudentQuizDetailsPage ? (
            <section className="student-page student-board">
              <div className="student-page-header">
                <div>
                  <p className="eyebrow">Quiz Details</p>
                  <h2>Review the selected quiz before you begin.</h2>
                  <p className="helper">
                    This page shows subject, level, duration, marks, and the live attempt area when a quiz is started.
                  </p>
                </div>
                <div className="button-row">
                  <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/home')}>
                    Home
                  </button>
                  <button className="secondary" type="button" onClick={() => goToStudentRoute('/student/start-quiz')}>
                    Start quiz
                  </button>
                </div>
              </div>

              <div className="student-start-layout">
                <section className="table-card">
                  <div className="table-heading">
                    <h3>Quiz details</h3>
                    <button
                      className="primary"
                      type="button"
                      disabled={!activeStudentQuiz}
                      onClick={startSelectedQuiz}
                    >
                      Start quiz
                    </button>
                  </div>

                  {activeStudentQuiz ? (
                    <>
                      <div className="detail-grid">
                        <div>
                          <span>Title</span>
                          <strong>{activeStudentQuiz.title}</strong>
                        </div>
                        <div>
                          <span>Subject</span>
                          <strong>{activeStudentQuiz.category}</strong>
                        </div>
                        <div>
                          <span>Difficulty</span>
                          <strong>{activeStudentQuiz.difficulty}</strong>
                        </div>
                        <div>
                          <span>Duration</span>
                          <strong>{activeStudentQuiz.duration} minutes</strong>
                        </div>
                        <div>
                          <span>Passing score</span>
                          <strong>{activeStudentQuiz.passing_score}%</strong>
                        </div>
                        <div>
                          <span>Questions</span>
                          <strong>{activeStudentQuiz.questions_count}</strong>
                        </div>
                      </div>
                      <p className="table-note">{activeStudentQuiz.description || 'No description available.'}</p>
                    </>
                  ) : (
                    <p className="helper">Select a quiz in Start quiz to see its full details here.</p>
                  )}
                </section>

                <section className="table-card">
                  <div className="table-heading">
                    <h3>Level and timing</h3>
                    {studentStartInfo ? (
                      <button
                        className="primary compact-action"
                        type="button"
                        disabled={submittingAttempt || Boolean(studentSubmissionResult)}
                        onPointerDown={(event) => {
                          if (event.pointerType === 'mouse') {
                            handleManualSubmit(event)
                          }
                        }}
                        onClick={handleManualSubmit}
                      >
                        {submittingAttempt ? 'Submitting...' : 'Submit quiz'}
                      </button>
                    ) : (
                      <span>Ready to start</span>
                    )}
                  </div>
                  {studentStartInfo ? <p className="table-note">Attempt #{studentStartInfo.attempt_id}</p> : null}
                  <div className="quiz-level-strip">
                    <span className="status-pill">Basic</span>
                    <span className="status-pill">Intermediate</span>
                    <span className="status-pill">Advanced</span>
                  </div>
                  {activeStudentQuiz ? (
                    <div className="detail-grid">
                      <div>
                        <span>Time limit</span>
                        <strong>{activeStudentQuiz.duration} minutes</strong>
                      </div>
                      <div>
                        <span>Questions</span>
                        <strong>{activeStudentQuiz.questions_count}</strong>
                      </div>
                      <div>
                        <span>Max attempts</span>
                        <strong>{activeStudentQuiz.max_attempts}</strong>
                      </div>
                      <div>
                        <span>Passing score</span>
                        <strong>{activeStudentQuiz.passing_score}%</strong>
                      </div>
                    </div>
                  ) : null}
                  {studentStartInfo ? (
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
                  ) : (
                    <p className="helper">Start the quiz to unlock the live attempt area.</p>
                  )}
                </section>
              </div>

              {studentStartInfo ? (
                <section className="table-card" ref={liveAttemptRef}>
                  <div className="table-heading">
                    <h3>Live attempt</h3>
                    <span>Timer {timerLabel}</span>
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
                            onPointerDown={(event) => {
                              if (event.pointerType === 'mouse') {
                                handleManualSubmit(event)
                              }
                            }}
                            onClick={handleManualSubmit}
                          >
                            {submittingAttempt ? 'Submitting...' : 'Submit quiz'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="helper">Start the quiz to begin the timer and question navigation.</p>
                  )}
                </section>
              ) : null}

              {activeAttemptReview ? (
                <section className="table-card" ref={attemptReviewRef}>
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
                          <h4>Question {index + 1}</h4>
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
                </section>
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
                            {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Not submitted'}
                          </td>
                          <td>
                            <div className="table-actions">
                              {attempt.status === 'SUBMITTED' ? (
                                <button
                                  className="secondary"
                                  type="button"
                                  onClick={() => {
                                    setSelectedAttemptHistoryId(String(attempt.attempt_id))
                                    setNotice('Attempt review loaded.')
                                  }}
                                >
                                  View review
                                </button>
                              ) : (
                                <button className="secondary" type="button" disabled>
                                  Submit first
                                </button>
                              )}
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
          ) : null
        ) : null}
    </main>
  )
}
