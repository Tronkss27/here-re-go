import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import { AuthContainer } from '../components/ui'

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
          navigate('/admin')
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
    <AuthContainer 
      title="Accesso SPOrTS"
      subtitle="Area riservata ai gestori di locali"
    >
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center">
          <div className="text-orange-500 text-2xl mr-3">🏆</div>
          <div>
            <h3 className="font-semibold text-orange-800">Area Gestori</h3>
            <p className="text-orange-700 text-sm">
              Accedi per gestire il tuo locale, prenotazioni e offerte
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Aziendale*
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="nome@iltuolocale.com"
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
            placeholder="Password sicura"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            La password deve essere sicura per proteggere i dati del tuo locale
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Accesso in corso...
            </div>
          ) : (
            '🚀 Accesso SPOrTS'
          )}
        </button>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Non hai ancora registrato il tuo locale?{' '}
            <Link 
              to="/sports-register" 
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Registra il tuo locale
            </Link>
          </p>
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-gray-600 text-sm mb-2">
            Sei un cliente? 
          </p>
          <Link 
            to="/client-login" 
            className="text-orange-500 hover:text-orange-600 font-medium text-sm"
          >
            🏠 Accesso Cliente
          </Link>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Cosa puoi fare con SPOrTS:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Gestire prenotazioni e tavoli</li>
            <li>• Creare offerte e promozioni</li>
            <li>• Aggiornare profilo e orari</li>
            <li>• Visualizzare statistiche e analytics</li>
          </ul>
        </div>
      </form>
    </AuthContainer>
  )
}

export default SportsLogin 