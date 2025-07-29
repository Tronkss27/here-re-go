import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import { AuthContainer } from '../components/ui'
import { LogIn } from 'lucide-react'

const SportsLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { showSuccessModal, showErrorModal } = useModal()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        // Check if user is venue owner
        if (result.user?.isVenueOwner) {
          showSuccessModal('Benvenuto su SPOrTS Admin!')
          
          // Se ha completato l'onboarding, vai al dashboard
          // Altrimenti, vai all'onboarding
          if (result.user?.venue || result.data?.venue) {
            navigate('/admin')
          } else {
            navigate('/admin/onboarding')
          }
        } else {
          showErrorModal('Accesso negato. Devi essere registrato come proprietario di locale.')
        }
      } else {
        showErrorModal(result.error)
      }
    } catch (error) {
      console.error('Login error:', error)
      showErrorModal('Errore durante l\'accesso. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-special text-primary mb-2">
            🏆 SPOrTS
          </h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Accedi</h2>
          <p className="text-muted">Accedi alla tua area riservata</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="form-label">
              Email*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Inserisci la tua email"
              required
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Password*
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Inserisci la password"
              required
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {isLoading ? (
              <div className="loading mr-2"></div>
            ) : (
              <LogIn className="mr-2" size={20} />
            )}
            Accedi
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted">
            Non hai un account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Crea un nuovo account
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-muted">Sei un locale?</p>
          <Link 
            to="/sports-register" 
            className="btn-secondary mt-2 inline-flex items-center"
          >
            🏟️ Accesso SPOrTS per Locali
          </Link>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-primary hover:underline">
            Torna alla Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SportsLogin 