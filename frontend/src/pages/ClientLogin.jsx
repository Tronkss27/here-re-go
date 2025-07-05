import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import { AuthContainer } from '../components/ui'

const ClientLogin = () => {
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
        showSuccessModal('Benvenuto su SPOrTS!')
        navigate('/')
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
    <AuthContainer 
      title="Accedi"
      subtitle="Entra nella community SPOrTS"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email*
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Inserisci la tua email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password*
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Inserisci la password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Accesso in corso...
            </div>
          ) : (
            '🏠 Accedi'
          )}
        </button>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Non hai un account?{' '}
            <Link 
              to="/client-register" 
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Crea un nuovo account
            </Link>
          </p>
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-gray-600 text-sm mb-2">
            Sei un locale? 
          </p>
          <Link 
            to="/sports-login" 
            className="text-orange-500 hover:text-orange-600 font-medium text-sm"
          >
            🚀 Accesso SPOrTS per Locali
          </Link>
        </div>
      </form>
    </AuthContainer>
  )
}

export default ClientLogin 