import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { apiClient, API_ENDPOINTS } from '../services/index.js'

// Stato iniziale dell'autenticazione
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
}

// Azioni per il reducer
const authActions = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
}

// Reducer per gestire lo stato di autenticazione
const authReducer = (state, action) => {
  switch (action.type) {
    case authActions.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null
      }

    case authActions.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }

    case authActions.LOGIN_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      }

    case authActions.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }

    case authActions.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }

    case authActions.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }

    default:
      return state
  }
}

// Context
const AuthContext = createContext()

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Effetto per controllare il token salvato al caricamento dell'app
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        const user = JSON.parse(localStorage.getItem('user') || 'null')

        if (token && user) {
          // Verifica se il token è ancora valido
          try {
            const response = await apiClient.get(API_ENDPOINTS.AUTH.VERIFY)
            
            dispatch({
              type: authActions.LOGIN_SUCCESS,
              payload: { user, token }
            })
          } catch (error) {
            // Token non valido, rimuovi dal localStorage
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            dispatch({ type: authActions.SET_LOADING, payload: false })
          }
        } else {
          dispatch({ type: authActions.SET_LOADING, payload: false })
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        dispatch({ type: authActions.SET_LOADING, payload: false })
      }
    }

    initializeAuth()
  }, [])

  // Funzione di login
  const login = async (email, password) => {
    try {
      dispatch({ type: authActions.SET_LOADING, payload: true })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        // Salva token e user nel localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        dispatch({
          type: authActions.LOGIN_SUCCESS,
          payload: { user: data.user, token: data.token }
        })

        return { success: true, data }
      } else {
        dispatch({
          type: authActions.LOGIN_ERROR,
          payload: data.message || 'Login failed'
        })
        return { success: false, error: data.message }
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.'
      dispatch({
        type: authActions.LOGIN_ERROR,
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  // Funzione di registrazione
  const register = async (name, email, password, role = 'user') => {
    try {
      dispatch({ type: authActions.SET_LOADING, payload: true })

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role })
      })

      const data = await response.json()

      if (response.ok) {
        // Salva token e user nel localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        dispatch({
          type: authActions.LOGIN_SUCCESS,
          payload: { user: data.user, token: data.token }
        })

        return { success: true, data }
      } else {
        dispatch({
          type: authActions.LOGIN_ERROR,
          payload: data.message || 'Registration failed'
        })
        return { success: false, error: data.message }
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.'
      dispatch({
        type: authActions.LOGIN_ERROR,
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  // Funzione di login demo
  const loginDemo = async () => {
    try {
      dispatch({ type: authActions.SET_LOADING, payload: true })

      const response = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        // Salva token e user nel localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        dispatch({
          type: authActions.LOGIN_SUCCESS,
          payload: { user: data.user, token: data.token }
        })

        return { success: true, data }
      } else {
        dispatch({
          type: authActions.LOGIN_ERROR,
          payload: data.message || 'Demo login failed'
        })
        return { success: false, error: data.message }
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.'
      dispatch({
        type: authActions.LOGIN_ERROR,
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  // Funzione di logout
  const logout = () => {
    // Rimuovi dal localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    dispatch({ type: authActions.LOGOUT })
  }

  // Funzione per aggiornare i dati utente
  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    dispatch({
      type: authActions.UPDATE_USER,
      payload: userData
    })
  }

  // Funzione per cancellare errori
  const clearError = () => {
    dispatch({ type: authActions.CLEAR_ERROR })
  }

  // Valore del context
  const value = {
    ...state,
    login,
    register,
    loginDemo,
    logout,
    updateUser,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook per usare il context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext 