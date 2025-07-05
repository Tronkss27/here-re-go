import apiClient from './apiClient.js'

// Fixtures Service - Gestisce le partite sportive tramite match announcements
class FixturesService {
  
  // Cache per ottimizzare le chiamate API
  constructor() {
    this.todaysMatchesCache = null
    this.cacheExpiry = null
    this.CACHE_DURATION = 5 * 60 * 1000 // 5 minuti
  }

  // Get all fixtures with optional filters - USA MATCH ANNOUNCEMENTS
  async getFixtures(params = {}) {
    // Converti parametri fixtures in parametri match announcements
    const searchParams = new URLSearchParams()
    
    if (params.date) {
      searchParams.append('date', params.date)
    }
    if (params.query) {
      searchParams.append('query', params.query)
    }
    if (params.competition) {
      searchParams.append('competition', params.competition)
    }
    if (params.city) {
      searchParams.append('city', params.city)
    }
    if (params.limit) {
      searchParams.append('limit', params.limit)
    } else {
      searchParams.append('limit', '50') // Default limit
    }

    const endpoint = `/match-announcements/search/public?${searchParams.toString()}`
    
    try {
      console.log(`🔍 Calling match announcements API: ${endpoint}`)
      const response = await apiClient.get(endpoint)
      console.log(`✅ Match announcements response:`, response)
      console.log(`🔍 DEBUG: response.data:`, response.data)
      console.log(`🔍 DEBUG: response.data.data:`, response.data?.data)
      
      // Trasforma i match announcements in formato fixtures
      const announcements = response.data || []
      console.log(`🔍 DEBUG: announcements array:`, announcements)
      console.log(`🔍 DEBUG: announcements length:`, announcements.length)
      
      const fixtures = announcements.map((announcement, index) => {
        console.log(`🔧 DEBUG: Transforming announcement ${index}:`, announcement)
        const fixture = this.transformAnnouncementToFixture(announcement)
        console.log(`✨ DEBUG: Transformed fixture ${index}:`, fixture)
        return fixture
      })
      
      console.log(`🔍 DEBUG: All fixtures:`, fixtures)
      
      return {
        data: fixtures,
        success: true,
        pagination: response.data?.pagination
      }
    } catch (error) {
      console.error('❌ Error fetching match announcements:', error)
      return {
        data: [],
        success: false,
        error: error.message
      }
    }
  }

  // Trasforma un match announcement in formato fixture
  transformAnnouncementToFixture(announcement) {
    return {
      id: announcement.match?.id || announcement._id,
      homeTeam: announcement.match?.homeTeam || 'Squadra Casa',
      awayTeam: announcement.match?.awayTeam || 'Squadra Ospite', 
      league: announcement.match?.competition?.name || 'Campionato',
      leagueLogo: announcement.match?.competition?.logo,
      date: announcement.match?.date || announcement.eventDetails?.startDate,
      time: announcement.match?.time || announcement.eventDetails?.startTime || 'TBD',
      status: 'scheduled',
      isLive: false,
      venue: announcement.venueId?.name,
      venueId: announcement.venueId?._id || announcement.venueId,
      venueName: announcement.venueId?.name,
      venueCount: 1, // Per ora 1, poi potremmo aggregare
      importance: this.calculateMatchImportance(announcement),
      announcement: announcement // Mantieni il riferimento originale
    }
  }

  // Search fixtures with advanced criteria
  async searchFixtures(searchParams = {}) {
    return this.getFixtures(searchParams)
  }

  // Get upcoming fixtures (next 7 days)
  async getUpcomingFixtures() {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return this.getFixtures({ 
      date: today.toISOString().split('T')[0],
      limit: 100 
    })
  }

  // Get live fixtures - per ora mock
  async getLiveFixtures() {
    // Per ora restituisci array vuoto - il backend non ha ancora live fixtures
    return { data: [], success: true }
  }

  // Get popular fixtures
  async getPopularFixtures() {
    return this.getFixtures({ limit: 20 })
  }

  // Get available leagues - mock per ora
  async getAvailableLeagues() {
    return { 
      data: [
        { id: 'serie-a', name: 'Serie A', sport: 'football' },
        { id: 'champions-league', name: 'Champions League', sport: 'football' },
        { id: 'premier-league', name: 'Premier League', sport: 'football' }
      ], 
      success: true 
    }
  }

  // Get available teams - mock per ora
  async getAvailableTeams() {
    return { 
      data: [
        { id: 'milan', name: 'Milan' },
        { id: 'inter', name: 'Inter' },
        { id: 'juventus', name: 'Juventus' },
        { id: 'roma', name: 'Roma' }
      ], 
      success: true 
    }
  }

  // Get fixture details by ID
  async getFixtureById(id) {
    try {
      const response = await apiClient.get(`/match-announcements/public/${id}`)
      if (response.data?.data) {
        return {
          data: this.transformAnnouncementToFixture(response.data.data),
          success: true
        }
      }
      return { data: null, success: false }
    } catch (error) {
      console.error('Error fetching fixture by ID:', error)
      return { data: null, success: false, error: error.message }
    }
  }

  // Sync fixtures from API (admin only) - non implementato per ora
  async syncFixtures() {
    return { success: false, message: 'Sync not implemented yet' }
  }

  // Update fixture popularity - non implementato per ora
  async updateFixturePopularity(id, popularityData) {
    return { success: false, message: 'Popularity update not implemented yet' }
  }

  // Clear fixtures cache (admin only)
  async clearCache() {
    this.clearTodaysMatchesCache()
    return { success: true, message: 'Cache cleared' }
  }

  // Helper methods for common use cases

  // Get fixtures for today
  async getTodayFixtures() {
    // Usa la data di oggi 
    const today = new Date().toISOString().split('T')[0] // '2025-06-24'
    console.log(`🗓️ Getting fixtures for today: ${today}`)
    
    try {
      const result = await this.getFixtures({ date: today })
      
      // Se non ci sono partite per oggi, usa dati mock temporanei
      if (!result?.data || result.data.length === 0) {
        console.log('📝 No matches for today, using mock data temporaneamente')
        return { data: this.getMockTodayFixtures(), success: true }
      }
      
      return result
    } catch (error) {
      console.error('❌ Error fetching today fixtures:', error)
      console.log('📝 Fallback to mock data')
      return { data: this.getMockTodayFixtures(), success: true }
    }
  }

  // Mock data temporaneo per demo
  getMockTodayFixtures() {
    const today = new Date().toISOString().split('T')[0]
    return [
      {
        id: 'roma_lazio_derby',
        homeTeam: 'Roma',
        awayTeam: 'Lazio',
        homeTeamLogo: '/api/placeholder/40/40',
        awayTeamLogo: '/api/placeholder/40/40',
        league: 'Serie A',
        leagueLogo: '/api/placeholder/24/24',
        time: '18:00',
        date: today,
        status: 'scheduled',
        isLive: false,
        venueCount: 2  // Sarà aggiornato dinamicamente dal backend
      },
      {
        id: 'juventus_napoli_big',
        homeTeam: 'Juventus', 
        awayTeam: 'Napoli',
        homeTeamLogo: '/api/placeholder/40/40',
        awayTeamLogo: '/api/placeholder/40/40',
        league: 'Serie A',
        leagueLogo: '/api/placeholder/24/24',
        time: '20:45',
        date: today,
        status: 'scheduled',
        isLive: false,
        venueCount: 2  // Sarà aggiornato dinamicamente dal backend
      },
      {
        id: 'atalanta_fiorentina',
        homeTeam: 'Atalanta',
        awayTeam: 'Fiorentina', 
        homeTeamLogo: '/api/placeholder/40/40',
        awayTeamLogo: '/api/placeholder/40/40',
        league: 'Serie A',
        leagueLogo: '/api/placeholder/24/24',
        time: '15:00',
        date: today,
        status: 'scheduled',
        isLive: false,
        venueCount: 2  // Sarà aggiornato dinamicamente dal backend
      }
    ]
  }

  // NEW: Get today's matches with caching
  async getTodaysMatches() {
    // Check cache first
    if (this.todaysMatchesCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      console.log('📦 Using cached today\'s matches')
      return this.todaysMatchesCache
    }

    try {
      console.log('🔄 Fetching fresh today\'s matches from API')
      const response = await this.getTodayFixtures()
      const fixtures = response.data || []
      
      console.log(`✅ Fetched ${fixtures.length} fixtures for today`)
      console.log('🔍 DEBUG: Raw fixtures:', fixtures)
      
      // Format fixtures for display
      const formattedMatches = fixtures.map((fixture, index) => {
        console.log(`🔧 DEBUG: Formatting fixture ${index}:`, fixture)
        const formatted = this.formatFixture(fixture)
        console.log(`✨ DEBUG: Formatted result ${index}:`, formatted)
        return formatted
      })
      
      console.log(`🔍 DEBUG: Final formatted matches:`, formattedMatches)
      
      // Cache the results
      this.todaysMatchesCache = formattedMatches
      this.cacheExpiry = Date.now() + this.CACHE_DURATION
      
      console.log(`📦 Cached ${formattedMatches.length} formatted matches`)
      return formattedMatches
    } catch (error) {
      console.error('❌ Error fetching today\'s matches:', error)
      return []
    }
  }

  // NEW: Get venues showing specific match
  async getVenuesForMatch(matchId) {
    try {
      // This would need backend support to link venues with matches
      // For now, return mock data structure
      const response = await apiClient.get(`/venues/by-match/${matchId}`)
      return response.data || []
    } catch (error) {
      console.error('Error fetching venues for match:', error)
      return []
    }
  }

  // NEW: Check if venue is showing any match today
  isVenueShowingMatchToday(venue, todaysMatches) {
    // Mock logic - in real implementation, this would check venue's broadcast schedule
    if (!venue || !todaysMatches || todaysMatches.length === 0) return false
    
    // For now, assume venues with "Grande schermo" show popular matches
    const hasLargeScreen = venue.amenities?.includes('Grande schermo') || 
                          venue.features?.largeScreen
    
    // Check if venue shows football/soccer matches
    const showsSports = venue.amenities?.includes('Sport') || 
                       venue.features?.showsSports !== false
    
    return hasLargeScreen && showsSports && todaysMatches.length > 0
  }

  // NEW: Get match info for venue (if showing match today)
  getVenueMatchInfo(venue, todaysMatches) {
    if (!this.isVenueShowingMatchToday(venue, todaysMatches)) {
      return null
    }
    
    // Return the most popular/important match of the day
    // In real implementation, this would be based on venue's specific broadcast schedule
    const importantMatch = todaysMatches.find(match => 
      match.league?.includes('Serie A') || 
      match.league?.includes('Champions League') || 
      match.league?.includes('Premier League')
    ) || todaysMatches[0]
    
    return importantMatch || null
  }

  // NEW: Enhanced method to get today's matches with venue associations
  async getTodaysMatchesWithVenues() {
    try {
      const todaysMatches = await this.getTodaysMatches()
      
      // Aggrega i match per matchId per calcolare il numero di venue
      const matchesMap = new Map()
      
      todaysMatches.forEach(match => {
        const matchId = match.id
        if (matchesMap.has(matchId)) {
          // Incrementa il conteggio venue per questo match
          const existingMatch = matchesMap.get(matchId)
          existingMatch.venueCount += 1
          existingMatch.venues.push({
            id: match.venueId,
            name: match.venueName || match.venue,
            announcement: match.announcement
          })
        } else {
          // Primo venue per questo match
          matchesMap.set(matchId, {
            ...match,
            venues: match.venueId ? [{
              id: match.venueId,
              name: match.venueName || match.venue,
              announcement: match.announcement
            }] : [],
            venueCount: match.venueId ? 1 : 0
          })
        }
      })
      
      // Converti la mappa in array e ricalcola l'importanza
      const aggregatedMatches = Array.from(matchesMap.values()).map(match => ({
        ...match,
        importance: this.calculateMatchImportance(match) // Ricalcola con il nuovo venueCount
      }))
      
      return {
        matches: aggregatedMatches,
        totalMatches: aggregatedMatches.length,
        uniqueMatches: aggregatedMatches.length,
        totalAnnouncements: todaysMatches.length,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching today\'s matches with venues:', error)
      return {
        matches: [],
        totalMatches: 0,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  // NEW: Clear today's matches cache
  clearTodaysMatchesCache() {
    this.todaysMatchesCache = null
    this.cacheExpiry = null
  }

  // Get fixtures by league
  async getFixturesByLeague(leagueId) {
    return this.getFixtures({ league: leagueId })
  }

  // Get fixtures by team
  async getFixturesByTeam(teamId) {
    return this.getFixtures({ team: teamId })
  }

  // Get fixtures for venue display (popular + upcoming)
  async getVenueFixtures() {
    try {
      const [popular, upcoming] = await Promise.all([
        this.getPopularFixtures(),
        this.getUpcomingFixtures()
      ])
      
      return {
        popular: popular.data || [],
        upcoming: upcoming.data || []
      }
    } catch (error) {
      console.error('Error fetching venue fixtures:', error)
      throw error
    }
  }

  // Format fixture for display (ora gestisce già i match announcements trasformati)
  formatFixture(fixture) {
    // Se è già trasformato, restituiscilo così com'è
    if (fixture.announcement) {
      return fixture
    }
    
    // Altrimenti usa la logica precedente per retrocompatibilità
    return {
      id: fixture.id,
      homeTeam: fixture.teams?.home?.name || fixture.homeTeam || 'TBD',
      awayTeam: fixture.teams?.away?.name || fixture.awayTeam || 'TBD',
      homeTeamLogo: fixture.teams?.home?.logo || fixture.homeTeamLogo,
      awayTeamLogo: fixture.teams?.away?.logo || fixture.awayTeamLogo,
      league: fixture.league?.name || fixture.league || 'Unknown League',
      leagueLogo: fixture.league?.logo || fixture.leagueLogo,
      date: fixture.fixture?.date ? new Date(fixture.fixture.date) : (fixture.date ? new Date(fixture.date) : null),
      time: fixture.time || (fixture.fixture?.date ? new Date(fixture.fixture.date).toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : null),
      status: fixture.status || fixture.fixture?.status?.long || 'Scheduled',
      score: fixture.score || (fixture.goals ? `${fixture.goals.home} - ${fixture.goals.away}` : null),
      isLive: fixture.isLive || fixture.fixture?.status?.short === 'LIVE',
      venue: fixture.venue || fixture.fixture?.venue?.name,
      venueId: fixture.venueId,
      venueName: fixture.venueName,
      venueCount: fixture.venueCount || 1,
      round: fixture.league?.round,
      importance: fixture.importance || this.calculateMatchImportance(fixture)
    }
  }

  // NEW: Calculate match importance for sorting
  calculateMatchImportance(fixture) {
    let score = 0
    
    // Se è un match announcement, usa la sua struttura
    const announcement = fixture.announcement || fixture
    
    // League importance
    const league = (announcement.match?.competition?.name || announcement.league?.name || announcement.league || '').toLowerCase()
    if (league.includes('serie a')) score += 100
    if (league.includes('champions league')) score += 90
    if (league.includes('europa league')) score += 80
    if (league.includes('premier league')) score += 85
    if (league.includes('la liga')) score += 85
    if (league.includes('bundesliga')) score += 80
    
    // Team importance (derby, big teams)
    const homeTeam = (announcement.match?.homeTeam || announcement.homeTeam || '').toLowerCase()
    const awayTeam = (announcement.match?.awayTeam || announcement.awayTeam || '').toLowerCase()
    
    const bigTeams = ['milan', 'inter', 'juventus', 'roma', 'napoli', 'lazio', 'atalanta']
    if (bigTeams.some(team => homeTeam.includes(team) || awayTeam.includes(team))) {
      score += 30
    }
    
    // Derby bonus
    if ((homeTeam.includes('milan') && awayTeam.includes('inter')) || 
        (homeTeam.includes('inter') && awayTeam.includes('milan')) ||
        (homeTeam.includes('roma') && awayTeam.includes('lazio')) ||
        (homeTeam.includes('lazio') && awayTeam.includes('roma'))) {
      score += 50
    }
    
    // Time importance (prime time gets higher score)
    const timeStr = announcement.match?.time || announcement.eventDetails?.startTime || announcement.time
    if (timeStr) {
      const [hours] = timeStr.split(':').map(Number)
      if (hours >= 18 && hours <= 22) score += 20 // Prime time
      if (hours >= 15 && hours <= 17) score += 15 // Afternoon
    }
    
    // Venue count bonus (more venues = more popular)
    if (announcement.venueCount && announcement.venueCount > 1) {
      score += announcement.venueCount * 5
    }
    
    return score
  }

  // Get formatted fixtures for display
  async getFormattedFixtures(type = 'popular') {
    try {
      let response
      switch (type) {
        case 'live':
          response = await this.getLiveFixtures()
          break
        case 'upcoming':
          response = await this.getUpcomingFixtures()
          break
        case 'today':
          return await this.getTodaysMatches()
        case 'popular':
        default:
          response = await this.getPopularFixtures()
          break
      }
      
      const fixtures = response.data || []
      return fixtures.map(fixture => this.formatFixture(fixture))
        .sort((a, b) => (b.importance || 0) - (a.importance || 0)) // Sort by importance
    } catch (error) {
      console.error(`Error fetching ${type} fixtures:`, error)
      return []
    }
  }
}

// Create and export singleton instance
const fixturesService = new FixturesService()
export default fixturesService 