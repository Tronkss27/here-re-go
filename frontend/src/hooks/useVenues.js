import { useState, useEffect, useMemo, useCallback } from 'react'
import { venuesService, withLoading, handleApiError } from '../services/index.js'

// Hook per gestire i venues
export const useVenues = () => {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchVenues = useCallback(async () => {
    try {
      const venuesData = await withLoading(
        () => venuesService.getFormattedVenues(),
        setLoading,
        setError
      )
      setVenues(venuesData)
    } catch (err) {
      console.error('Error loading venues:', err)
      setError(handleApiError(err))
    }
  }, [])

  useEffect(() => {
    fetchVenues()
  }, [fetchVenues])

  return { venues, loading, error, refetch: fetchVenues }
}

// Hook per ottenere un singolo venue
export const useVenue = (id) => {
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ✅ FIX PER REACT STRICT MODE: Controllo idempotenza per evitare doppi fetch
  const [hasFetched, setHasFetched] = useState(false)

  const fetchVenue = useCallback(async () => {
    if (!id) return

    // ✅ CONTROLLO IDEMPOTENZA: Se abbiamo già fatto fetch per questo ID, non rifarlo
    if (hasFetched) {
      console.log(`🔄 Skipping duplicate fetch for venue ${id} (React Strict Mode)`)
      return
    }

    try {
      console.log(`🔍 Fetching venue ${id} (first time)`)
      setHasFetched(true)
      
      const venueData = await withLoading(
        () => venuesService.getFormattedVenueById(id),
        setLoading,
        setError
      )
      setVenue(venueData)
    } catch (err) {
      console.error('Error loading venue:', err)
      setError(handleApiError(err))
      setHasFetched(false) // Reset su errore per consentire retry
    }
  }, [id, hasFetched])

  useEffect(() => {
    // Reset quando cambia l'ID
    if (id) {
      setHasFetched(false)
      setVenue(null)
      setLoading(true)
      setError(null)
    }
  }, [id])

  useEffect(() => {
    fetchVenue()
  }, [fetchVenue])

  return { venue, loading, error, refetch: fetchVenue }
}

// Hook per filtrare e cercare venues
export const useVenueFilters = (venues) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState([])

  const filteredVenues = useMemo(() => {
    if (!venues || venues.length === 0) return []

    let filtered = venues

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = venuesService.searchVenues(filtered, { search: searchQuery })
    }

    // Apply feature filters
    if (selectedFilters.length > 0) {
      // Map filter labels to venue feature keys
      const featureMap = {
        'Wi-Fi': 'wifi',
        'Grande schermo': 'largeScreen',
        'Prenotabile': 'bookable',
        'Giardino': 'garden',
        'Schermo esterno': 'outdoorScreen',
        'Servi cibo': 'servesFood',
        'Pet friendly': 'petFriendly',
        'Commentatore': 'commentator'
      }

      const featureKeys = selectedFilters.map(filter => featureMap[filter]).filter(Boolean)
      filtered = venuesService.searchVenues(filtered, { features: featureKeys })
    }

    return filtered
  }, [venues, searchQuery, selectedFilters])

  const toggleFilter = useCallback((filter) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }, [])

  const clearFilters = useCallback(() => {
    setSelectedFilters([])
    setSearchQuery('')
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    selectedFilters,
    toggleFilter,
    clearFilters,
    filteredVenues
  }
}

// Hook per ottenere venue per una partita specifica
export const useVenuesForMatch = (matchId, matchDate) => {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchVenuesForMatch = useCallback(async () => {
    if (!matchId) {
      setVenues([])
      setLoading(false)
      return
    }

    try {
      console.log(`🔍 Fetching venues for match: ${matchId} on date: ${matchDate}`)
      
      const params = new URLSearchParams({ matchId });
      if (matchDate) {
        params.append('date', matchDate);
      }

      // Chiamata API per ottenere venue per questa partita (SENZA autenticazione)
      const response = await fetch(`/api/venues/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Non includere token di autenticazione per questa chiamata pubblica
        }
      })
      
      // Gestione manuale della risposta per evitare redirect automatico
      if (response.status === 401 || response.status === 403) {
        console.warn(`⚠️ Authentication required for venues search, but this should be public`)
        // Non fare redirect, usa dati mock
        setVenues([])
        setLoading(false)
        setError('Venues search requires authentication - using fallback')
        return
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        console.log(`✅ Found ${data.data.length} venues for match ${matchId}`)
        setVenues(data.data)
      } else {
        console.warn(`⚠️ No venues found for match ${matchId}`)
        setVenues([])
      }
      
      setLoading(false)
      setError(null)
    } catch (err) {
      console.error('Error loading venues for match:', err)
      setError(handleApiError(err))
      setVenues([])
      setLoading(false)
    }
  }, [matchId, matchDate])

  useEffect(() => {
    fetchVenuesForMatch()
  }, [fetchVenuesForMatch])

  return { venues, loading, error, refetch: fetchVenuesForMatch }
}

// Hook per gestire il rating minimo
export const useVenueRatingFilter = (venues, initialMinRating = 0) => {
  const [minRating, setMinRating] = useState(initialMinRating)

  const filteredByRating = useMemo(() => {
    if (!venues || minRating === 0) return venues
    return venuesService.searchVenues(venues, { minRating })
  }, [venues, minRating])

  return {
    minRating,
    setMinRating,
    filteredByRating
  }
} 