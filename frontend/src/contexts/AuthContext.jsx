import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { apiClient, API_ENDPOINTS } from '../services/index.js'

// Stato iniziale dell'autenticazione
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  hasCompletedOnboarding: false
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

// Helper to normalize user object from backend (_id) to frontend (id)
const normalizeUserObject = (user) => {
  if (!user) return null;
  
  const newUser = { ...user };

  // Normalize top-level ID
  if (newUser._id && !newUser.id) {
    newUser.id = newUser._id;
  }
  
  // Normalize venue ID
  if (newUser.venue && newUser.venue._id && !newUser.venue.id) {
    newUser.venue.id = newUser.venue._id;
  }
  
  // Clean up backend-specific fields if desired
  // delete newUser._id;
  // if (newUser.venue) delete newUser.venue._id;

  return newUser;
};

// Helper to check onboarding status from localStorage
const checkOnboardingStatus = (user) => {
  if (!user || !user.id) {
    return false;
  }

  const isVenueOwner = user.isVenueOwner || user.userType === 'venue_owner';
  if (!isVenueOwner) {
    return true; // Non-venue owners don't need onboarding
  }

  // BYPASS TEMPORANEO: Utente demo sempre considerato completato
  if (user.id === '68503276e5e03de0dac6a092' || user.email === 'demo@sports.it') {
    console.log('🎯 BYPASS: Utente demo rilevato, onboarding automaticamente completato');
    return true;
  }

  const onboardingCompleted = localStorage.getItem(`onboarding_completed_${user.id}`);
  const venueProfileData = localStorage.getItem(`venue_profile_${user.id}`);
  let hasValidProfile = false;
  
  if (venueProfileData) {
    try {
      const profile = JSON.parse(venueProfileData);
      hasValidProfile = !!(profile.name && profile.address && profile.city);
    } catch {
      hasValidProfile = false;
    }
  }
  
  return !!onboardingCompleted || hasValidProfile;
};

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
        error: null,
        hasCompletedOnboarding: checkOnboardingStatus(action.payload.user)
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
        user: action.payload,
        hasCompletedOnboarding: checkOnboardingStatus(action.payload)
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
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
        
        // Normalize user object on initialization
        const user = normalizeUserObject(storedUser);

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

      const data = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password }, { includeAuth: false })

      // Se è un venue owner e abbiamo dati del venue, aggiungiamoli al user
      let userWithVenue = data.user
      if (data.user.isVenueOwner && data.venue) {
        userWithVenue = {
          ...data.user,
          venue: {
            id: data.venue._id,
            name: data.venue.name,
            address: data.venue.location?.address?.street || '',
            city: data.venue.location?.address?.city || '',
            phone: data.venue.contact?.phone || '',
            type: data.venue.type || 'sport_bar'
          }
        }
      }

      // Normalize user before saving and dispatching
      const normalizedUser = normalizeUserObject(userWithVenue);

      // Salva token e user nel localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(normalizedUser))

      dispatch({
        type: authActions.LOGIN_SUCCESS,
        payload: { user: normalizedUser, token: data.token }
      })

      return { success: true, data: { ...data, user: normalizedUser } }
    } catch (error) {
      const errorMessage = error.message || 'Network error. Please try again.'
      dispatch({
        type: authActions.LOGIN_ERROR,
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  // Funzione di registrazione
  const register = async (userData) => {
    try {
      dispatch({ type: authActions.SET_LOADING, payload: true })

      // Estrai i dati dall'oggetto userData
      const { name, email, password, isVenueOwner = false, businessInfo = null } = userData

      // Prepara i dati da inviare al backend
      const requestData = {
        name,
        email,
        password,
        isVenueOwner,
        businessInfo
      }

      const data = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, requestData, { includeAuth: false })

      // Se è un venue owner e abbiamo dati del venue, aggiungiamoli al user
      let userWithVenue = data.user
      if (isVenueOwner && data.venue && businessInfo) {
        userWithVenue = {
          ...data.user,
          venue: {
            id: data.venue._id,
            name: businessInfo.businessName,
            address: businessInfo.businessAddress,
            city: businessInfo.businessCity,
            phone: businessInfo.businessPhone,
            type: businessInfo.businessType
          }
        }
      }

      // Normalize user before saving and dispatching
      const normalizedUser = normalizeUserObject(userWithVenue);

      // Salva token e user nel localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(normalizedUser))

      dispatch({
        type: authActions.LOGIN_SUCCESS,
        payload: { user: normalizedUser, token: data.token }
      })

      return { success: true, data: { ...data, user: normalizedUser } }
    } catch (error) {
      const errorMessage = error.message || 'Network error. Please try again.'
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

      const data = await apiClient.post(API_ENDPOINTS.AUTH.DEMO, {}, { includeAuth: false })
      
      const normalizedUser = normalizeUserObject(data.user);

      // Salva token e user nel localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(normalizedUser))

      dispatch({
        type: authActions.LOGIN_SUCCESS,
        payload: { user: normalizedUser, token: data.token }
      })

      return { success: true, data: { ...data, user: normalizedUser } }
    } catch (error) {
      const errorMessage = error.message || 'Network error. Please try again.'
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
    const normalizedUser = normalizeUserObject(updatedUser);
    
    localStorage.setItem('user', JSON.stringify(normalizedUser))
    dispatch({
      type: authActions.UPDATE_USER,
      payload: normalizedUser
    })
  }

  // Funzione per cancellare errori
  const clearError = () => {
    dispatch({ type: authActions.CLEAR_ERROR })
  }

  // Funzione per marcare l'onboarding come completato
  const markOnboardingAsCompleted = () => {
    if (state.user && state.user.id) {
      localStorage.setItem(`onboarding_completed_${state.user.id}`, 'true');
      dispatch({ 
        type: authActions.UPDATE_USER, 
        payload: { ...state.user, hasJustCompletedOnboarding: true } // trigger re-render with new status
      });
    }
  };
  
  const resetOnboardingStatus = () => {
    if (state.user && state.user.id) {
      localStorage.removeItem(`onboarding_completed_${state.user.id}`);
      dispatch({ 
        type: authActions.UPDATE_USER, 
        payload: { ...state.user } 
      });
    }
  };

  // Valore del context
  const value = {
    ...state,
    login,
    register,
    loginDemo,
    logout,
    updateUser,
    clearError,
    markOnboardingAsCompleted,
    resetOnboardingStatus
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