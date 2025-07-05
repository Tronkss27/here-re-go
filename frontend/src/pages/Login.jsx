import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
  const { login, loginDemo, isLoading, error, clearError } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  
  const location = useLocation()
  const navigate = useNavigate()
  
  // SPOrTS Theme Inline Styles
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    padding: '3rem 1rem',
    fontFamily: 'Kanit, sans-serif'
  }

  const cardStyle = {
    maxWidth: '450px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '1.5rem',
    padding: '3rem',
    boxShadow: '0 20px 60px rgba(249, 115, 22, 0.15)',
    border: '2px solid #f97316'
  }

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '2rem'
  }

  const titleStyle = {
    fontFamily: 'Racing Sans One, cursive',
    fontSize: '3rem',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  }

  const subtitleStyle = {
    fontSize: '1.5rem',
    color: '#1f2937',
    fontWeight: '600',
    marginBottom: '0.5rem'
  }

  const linkStyle = {
    color: '#f97316',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '0.9rem'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #fed7aa',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontFamily: 'Kanit, sans-serif',
    transition: 'all 0.2s ease-in-out',
    outline: 'none'
  }

  const inputFocusStyle = {
    borderColor: '#f97316',
    boxShadow: '0 0 0 3px rgba(249, 115, 22, 0.1)'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem'
  }

  const buttonStyle = {
    width: '100%',
    padding: '1rem 1.5rem',
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    fontFamily: 'Kanit, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  }

  const demoButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#f97316',
    border: '2px solid #f97316'
  }

  const errorStyle = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1rem',
    color: '#dc2626'
  }

  const credentialsStyle = {
    backgroundColor: '#fff7ed',
    padding: '1rem',
    borderRadius: '0.75rem',
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#92400e',
    border: '1px solid #fed7aa'
  }
  
  // Clear error when component unmounts or when user starts typing
  useEffect(() => {
    return () => clearError()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      // Redirect to BarMatch Admin Dashboard
      const from = location.state?.from?.pathname || '/admin'
      navigate(from, { replace: true })
    }
  }

  const handleDemoLogin = async () => {
    const result = await loginDemo()
    
    if (result.success) {
      // Redirect to BarMatch Admin Dashboard
      const from = location.state?.from?.pathname || '/admin'
      navigate(from, { replace: true })
    }
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            🏆 SPOrTS
          </h1>
          <h2 style={subtitleStyle}>
            Accedi al tuo account
          </h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            O{' '}
            <Link to="/register" style={linkStyle}>
              crea un nuovo account
            </Link>
          </p>
        </div>

        {error && (
          <div style={errorStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0 }}>{error}</p>
              <button
                onClick={clearError}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '1.25rem'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label htmlFor="email" style={labelStyle}>
              Email*
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, { borderColor: '#fed7aa', boxShadow: 'none' })}
              style={inputStyle}
              placeholder="Inserisci la tua email"
            />
          </div>

          <div>
            <label htmlFor="password" style={labelStyle}>
              Password*
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, { borderColor: '#fed7aa', boxShadow: 'none' })}
                style={{ ...inputStyle, paddingRight: '3rem' }}
                placeholder="Inserisci la password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '1.25rem'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Link to="/forgot-password" style={{ ...linkStyle, fontSize: '0.875rem' }}>
              Password dimenticata?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...buttonStyle,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#ea580c'
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#f97316'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Accesso in corso...
              </>
            ) : (
              '🔐 Accedi'
            )}
          </button>

          <div style={{ position: 'relative', textAlign: 'center', margin: '1rem 0' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: '#e5e7eb'
            }} />
            <span style={{
              backgroundColor: 'white',
              padding: '0 1rem',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              oppure
            </span>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            style={{
              ...demoButtonStyle,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#fff7ed'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = 'transparent'
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid transparent',
                  borderTop: '2px solid #f97316',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Accesso Demo...
              </>
            ) : (
              '🚀 Accesso Demo'
            )}
          </button>
        </form>

        <div style={credentialsStyle}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
            <strong>📝 Credenziali Demo:</strong>
          </p>
          <p style={{ margin: '0 0 0.25rem 0' }}>
            <strong>Email:</strong> demo@sports.it | <strong>Password:</strong> demo123
          </p>
          <p style={{ margin: 0 }}>
            <strong>Oppure:</strong> admin@sports.it | <strong>Password:</strong> admin123
          </p>
        </div>
      </div>


    </div>
  )
}

export default Login 