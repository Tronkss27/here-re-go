import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const OnboardingProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user, hasCompletedOnboarding } = useAuth()
  const location = useLocation()

  // Mostro un loader mentre AuthContext sta caricando
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verifica accesso onboarding...</p>
        </div>
      </div>
    )
  }

  // Se non autenticato, redirect al sports login
  if (!isAuthenticated) {
    return <Navigate to="/sports-login" state={{ from: location }} replace />
  }

  // Se non è un venue owner, non può accedere all'onboarding
  const isVenueOwner = user?.isVenueOwner || user?.userType === 'venue_owner';
  if (!isVenueOwner) {
    console.log('🚫 Accesso onboarding negato: utente non è venue owner');
    return <Navigate to="/profile" replace />
  }

  // ⭐ CRITICO: Se ha già completato l'onboarding, NON può rientrarci
  if (hasCompletedOnboarding) {
    console.log('✅ Onboarding già completato, redirect al dashboard admin');
    return <Navigate to="/admin" replace />
  }

  // ✅ SOLO se è venue owner E NON ha completato onboarding, può accedere
  console.log('🎯 Accesso consentito all\'onboarding');
  return children
}

export default OnboardingProtectedRoute 