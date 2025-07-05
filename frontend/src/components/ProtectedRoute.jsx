import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Mostro un loader mentre sto verificando l'autenticazione
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verifica autenticazione...</p>
        </div>
      </div>
    )
  }

  // Se non autenticato, redirect al login salvando la destinazione
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se autenticato, mostra il contenuto protetto
  return children
}

export default ProtectedRoute 