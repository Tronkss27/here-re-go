import { buildUrl, getHeaders, HTTP_STATUS } from '../config/api.js'

// API Client class for handling HTTP requests
class ApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  }

  // Handle API response
  async handleResponse(response, includeAuth = true) {
    const data = await response.json()
    
    if (!response.ok) {
      // Handle different error statuses
      switch (response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // Solo reindirizza al login se la richiesta includeva autenticazione
          if (includeAuth) {
            // Token expired or invalid - logout user
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
          } else {
            // Per richieste senza auth, lancia solo un errore senza reindirizzare
            throw new Error(data.message || 'Autenticazione richiesta')
          }
          break
        case HTTP_STATUS.FORBIDDEN:
          throw new Error(data.message || 'Accesso negato')
        case HTTP_STATUS.NOT_FOUND:
          throw new Error(data.message || 'Risorsa non trovata')
        case HTTP_STATUS.BAD_REQUEST:
          throw new Error(data.message || 'Richiesta non valida')
        default:
          throw new Error(data.message || 'Errore del server')
      }
    }
    
    return data
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = buildUrl(endpoint)
    const includeAuth = options.includeAuth !== false
    const config = {
      headers: getHeaders(includeAuth),
      ...options
    }
    
    try {
      const response = await fetch(url, config)
      return await this.handleResponse(response, includeAuth)
    } catch (error) {
      console.error(`API Error [${config.method || 'GET'}] ${url}:`, error)
      throw error
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options
    })
  }

  // POST request
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    })
  }

  // PUT request
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    })
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    })
  }

  // PATCH request
  async patch(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    })
  }
}

// Create singleton instance
const apiClient = new ApiClient()

// Helper function for handling async operations with loading states
export const withLoading = async (apiCall, setLoading, setError = null) => {
  try {
    if (setLoading) setLoading(true)
    if (setError) setError(null)
    
    const result = await apiCall()
    return result
  } catch (error) {
    if (setError) setError(error.message)
    throw error
  } finally {
    if (setLoading) setLoading(false)
  }
}

// Helper function for error handling
export const handleApiError = (error, fallbackMessage = 'Si è verificato un errore') => {
  console.error('API Error:', error)
  return error.message || fallbackMessage
}

export default apiClient