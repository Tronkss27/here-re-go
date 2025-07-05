import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import { AuthContainer } from '../components/ui'

const ClientRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const { showSuccessModal, showErrorModal } = useModal()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      showErrorModal('Le password non coincidono')
      setIsLoading(false)
      return
    }

    if (!formData.acceptTerms) {
      showErrorModal('Devi accettare i termini di servizio')
      setIsLoading(false)
      return
    }

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        isVenueOwner: false // Regular client
      })
      
      if (result.success) {
        showSuccessModal('Registrazione completata! Benvenuto su SPOrTS!')
        navigate('/')
      } else {
        showErrorModal(result.error)
      }
    } catch (error) {
      console.error('Registration error:', error)
      showErrorModal('Errore durante la registrazione. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContainer 
      title="Crea Account"
      subtitle="Entra nella community SPOrTS"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nome Completo*
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Il tuo nome e cognome"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            required
          />
        </div>

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
            placeholder="nome@esempio.com"
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
            placeholder="Crea una password sicura"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Conferma Password*
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Ripeti la password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            required
          />
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            className="mt-1 mr-3 h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            required
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-600">
            Accetto i{' '}
            <Link to="/terms" className="text-orange-500 hover:text-orange-600">
              termini di servizio
            </Link>{' '}
            e la{' '}
            <Link to="/privacy" className="text-orange-500 hover:text-orange-600">
              privacy policy
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Registrazione in corso...
            </div>
          ) : (
            '🏠 Crea Account'
          )}
        </button>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Hai già un account?{' '}
            <Link 
              to="/client-login" 
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Accedi qui
            </Link>
          </p>
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-gray-600 text-sm mb-2">
            Sei un locale? 
          </p>
          <Link 
            to="/sports-register" 
            className="text-orange-500 hover:text-orange-600 font-medium text-sm"
          >
            🚀 Registra il tuo locale su SPOrTS
          </Link>
        </div>
      </form>
    </AuthContainer>
  )
}

export default ClientRegister 