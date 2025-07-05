import { useState, useEffect } from 'react'
import { bookingsService } from '../services/venueService'
import { useAuth } from '../contexts/AuthContext'

export const useBookingStats = (venueId = null, refreshTrigger = 0) => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (!user?.id) {
          setError('Utente non autenticato')
          return
        }
        
        // Usa il servizio tenant-based del venueService
        const bookings = await bookingsService.getBookings(user.id)
        
        // Calcola le statistiche dai dati localStorage
        const stats = {
          total: bookings.length,
          pending: bookings.filter(b => b.status === 'pending').length,
          confirmed: bookings.filter(b => b.status === 'confirmed').length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length,
          completed: bookings.filter(b => b.status === 'completed').length
        }
        
        setStats(stats)
      } catch (err) {
        console.error('Error loading booking stats:', err)
        setError('Errore di rete durante il caricamento')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user?.id, venueId, refreshTrigger])

  const refreshStats = () => {
    setLoading(true)
    setError(null)
    
    const loadStats = async () => {
      try {
        if (!user?.id) {
          setError('Utente non autenticato')
          return
        }
        
        // Usa il servizio tenant-based del venueService
        const bookings = await bookingsService.getBookings(user.id)
        
        // Calcola le statistiche dai dati localStorage
        const stats = {
          total: bookings.length,
          pending: bookings.filter(b => b.status === 'pending').length,
          confirmed: bookings.filter(b => b.status === 'confirmed').length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length,
          completed: bookings.filter(b => b.status === 'completed').length
        }
        
        setStats(stats)
      } catch (err) {
        console.error('Error refreshing booking stats:', err)
        setError('Errore di rete durante il refresh')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }

  return {
    stats,
    loading,
    error,
    refreshStats
  }
}

export default useBookingStats 