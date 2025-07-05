import { useAuth } from '../contexts/AuthContext'

// Re-export dell'hook useAuth dal context
export { useAuth } from '../contexts/AuthContext'

// Hook aggiuntivi per funzionalità specifiche di autenticazione
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading, user } = useAuth()
  return { isAuthenticated, isLoading, user }
}

export const useAuthActions = () => {
  const { login, register, loginDemo, logout, clearError } = useAuth()
  return { login, register, loginDemo, logout, clearError }
}

export const useAuthUser = () => {
  const { user, updateUser } = useAuth()
  return { user, updateUser }
}

export const useAuthError = () => {
  const { error, clearError } = useAuth()
  return { error, clearError }
} 