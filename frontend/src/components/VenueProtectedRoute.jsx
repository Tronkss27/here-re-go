import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const VenueProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user, hasCompletedOnboarding } = useAuth()
  const location = useLocation()

  // Mostro un loader solo mentre AuthContext sta caricando
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verifica autenticazione...</p>
        </div>
      </div>
    )
  }

  // Se non autenticato, redirect al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se non è un venue owner, non può accedere all'admin
  const isVenueOwner = user?.isVenueOwner || user?.userType === 'venue_owner';
  if (!isVenueOwner) {
    return <Navigate to="/" replace />
  }

  // Se è un venue owner ma non ha completato l'onboarding, redirect automatico
  if (!hasCompletedOnboarding) {
    return <Navigate to="/admin/onboarding" replace />
  }

  // Se tutto ok, mostra il contenuto protetto
  return children
}

export default VenueProtectedRoute 