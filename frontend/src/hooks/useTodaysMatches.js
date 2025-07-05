import { useState, useEffect, useCallback } from 'react'
import fixturesService from '../services/fixturesService.js'

/**
 * Custom hook for managing today's matches
 * Provides loading states, error handling, and automatic refetching
 */
export const useTodaysMatches = () => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch today's matches
  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const todaysMatches = await fixturesService.getTodaysMatches()
      setMatches(todaysMatches)
      setLastUpdated(new Date())
      
    } catch (err) {
      console.error('Error fetching today\'s matches:', err)
      setError('Errore nel caricamento delle partite di oggi')
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh matches (clear cache and refetch)
  const refreshMatches = useCallback(async () => {
    fixturesService.clearTodaysMatchesCache()
    await fetchMatches()
  }, [fetchMatches])

  // Get matches with venue associations
  const getMatchesWithVenues = useCallback(async () => {
    try {
      return await fixturesService.getTodaysMatchesWithVenues()
    } catch (err) {
      console.error('Error fetching matches with venues:', err)
      return {
        matches: [],
        totalMatches: 0,
        lastUpdated: new Date().toISOString()
      }
    }
  }, [])

  // Check if a venue is showing matches today
  const isVenueShowingMatch = useCallback((venue) => {
    return fixturesService.isVenueShowingMatchToday(venue, matches)
  }, [matches])

  // Get match info for a specific venue
  const getVenueMatchInfo = useCallback((venue) => {
    return fixturesService.getVenueMatchInfo(venue, matches)
  }, [matches])

  // Get featured match (most important match of the day)
  const getFeaturedMatch = useCallback(() => {
    if (!matches || matches.length === 0) return null
    
    // Return match with highest importance score
    return matches.reduce((featured, current) => {
      if (!featured) return current
      return (current.importance || 0) > (featured.importance || 0) ? current : featured
    }, null)
  }, [matches])

  // Get matches by league
  const getMatchesByLeague = useCallback((leagueName) => {
    return matches.filter(match => 
      match.league?.toLowerCase().includes(leagueName.toLowerCase())
    )
  }, [matches])

  // Get live matches
  const getLiveMatches = useCallback(() => {
    return matches.filter(match => match.isLive)
  }, [matches])

  // Get upcoming matches (not started yet)
  const getUpcomingMatches = useCallback(() => {
    return matches.filter(match => 
      !match.isLive && 
      match.status?.toLowerCase().includes('scheduled')
    )
  }, [matches])

  // Initial fetch on mount
  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatches()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchMatches])

  return {
    // Data
    matches,
    loading,
    error,
    lastUpdated,
    
    // Actions
    fetchMatches,
    refreshMatches,
    getMatchesWithVenues,
    
    // Venue-related helpers
    isVenueShowingMatch,
    getVenueMatchInfo,
    
    // Match helpers
    getFeaturedMatch,
    getMatchesByLeague,
    getLiveMatches,
    getUpcomingMatches,
    
    // Stats
    totalMatches: matches.length,
    liveMatchesCount: matches.filter(m => m.isLive).length,
    hasMatches: matches.length > 0
  }
}

export default useTodaysMatches 