import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import { AuthContainer } from '../components/ui'

const SportsRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessPhone: '',
    businessAddress: '',
    businessCity: '',
    businessType: '',
    acceptTerms: false,
    acceptPrivacy: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const { showSuccessModal, showErrorModal } = useModal()
  const navigate = useNavigate()

  const businessTypes = [
    'Bar/Pub',
    'Ristorante',
    'Pizzeria',
    'Sport Bar',
    'Cocktail Bar',
    'Birreria',
    'Altro'
  ]

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

    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      showErrorModal('Devi accettare tutti i termini richiesti')
      setIsLoading(false)
      return
    }

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        isVenueOwner: true, // Venue owner
        businessInfo: {
          businessName: formData.businessName,
          businessPhone: formData.businessPhone,
          businessAddress: formData.businessAddress,
          businessCity: formData.businessCity,
          businessType: formData.businessType
        }
      })
      
      if (result.success) {
        showSuccessModal('Registrazione completata! Benvenuto su SPOrTS!')
        navigate('/admin')
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
      title="Registra il tuo Locale"
      subtitle="Unisciti alla rete SPOrTS e raggiungi nuovi clienti"
    >
      <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
        <div className="flex items-center">
          <div className="text-orange-500 text-2xl mr-3">🚀</div>
          <div>
            <h3 className="font-semibold text-orange-800">Porta il tuo locale su SPOrTS</h3>
            <p className="text-orange-700 text-sm">
              Gestisci prenotazioni, crea offerte e raggiungi i tifosi della tua zona
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Informazioni Personali</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome e Cognome*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Mario Rossi"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
              />
            </div>

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
                placeholder="mario@ilmiobar.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Informazioni Locale</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                Nome del Locale*
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Il Mio Bar"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo di Locale*
              </label>
              <select
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
              >
                <option value="">Seleziona il tipo</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefono*
            </label>
            <input
              type="tel"
              id="businessPhone"
              name="businessPhone"
              value={formData.businessPhone}
              onChange={handleInputChange}
              placeholder="+39 123 456 7890"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="md:col-span-2">
              <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Indirizzo*
              </label>
              <input
                type="text"
                id="businessAddress"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleInputChange}
                placeholder="Via Roma, 123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="businessCity" className="block text-sm font-medium text-gray-700 mb-2">
                Città*
              </label>
              <input
                type="text"
                id="businessCity"
                name="businessCity"
                value={formData.businessCity}
                onChange={handleInputChange}
                placeholder="Milano"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
              />
            </div>
          </div>
        </div>

        {/* Terms and Privacy */}
        <div className="space-y-4">
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
              per gestori di locali
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="acceptPrivacy"
              name="acceptPrivacy"
              checked={formData.acceptPrivacy}
              onChange={handleInputChange}
              className="mt-1 mr-3 h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              required
            />
            <label htmlFor="acceptPrivacy" className="text-sm text-gray-600">
              Accetto la{' '}
              <Link to="/privacy" className="text-orange-500 hover:text-orange-600">
                privacy policy
              </Link>{' '}
              e il trattamento dei dati aziendali
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Registrazione in corso...
            </div>
          ) : (
            '🚀 Registra il Locale su SPOrTS'
          )}
        </button>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Hai già registrato il tuo locale?{' '}
            <Link 
              to="/sports-login" 
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Accedi qui
            </Link>
          </p>
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-gray-600 text-sm mb-2">
            Sei un cliente? 
          </p>
          <Link 
            to="/client-register" 
            className="text-orange-500 hover:text-orange-600 font-medium text-sm"
          >
            🏠 Crea Account Cliente
          </Link>
        </div>
      </form>
    </AuthContainer>
  )
}

export default SportsRegister 