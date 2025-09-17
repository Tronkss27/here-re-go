import React from 'react';
import apiClient from './apiClient';

// Cache per hot matches
let hotMatchesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30 * 1000; // 30 secondi per refresh più frequente

// Service per gestire le partite popolari e hot matches
export const hotMatchesService = {
  // Ottieni partite "hot" per la homepage
  async getHotMatches(limit = 10) {
    try {
      // Controlla cache
      const now = Date.now();
      if (hotMatchesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('📦 Using cached hot matches');
        return hotMatchesCache;
      }

      console.log(`🔥 Fetching hot matches, limit: ${limit}`);
      
      const response = await apiClient.get(`/match-announcements/hot?limit=${limit}`);
      
      const rawData = response.data?.data || response.data || [];
      console.log(`📊 Raw hot matches count: ${rawData.length}`);
      
      // 🎯 FIX: Filtra solo partite future (oggi e oltre)
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const futureMatches = rawData.filter(match => {
        const matchDate = match.match?.date || match.date;
        if (!matchDate) return false;
        
        // Confronta le date in formato YYYY-MM-DD
        const matchDateStr = matchDate.split('T')[0];
        const isFuture = matchDateStr >= today;
        
        if (!isFuture) {
          console.log(`🗑️ Filtering out past match: ${match.match?.homeTeam} vs ${match.match?.awayTeam} (${matchDateStr})`);
        }
        
        return isFuture;
      });
      
      console.log(`✅ Found ${futureMatches.length} future hot matches (filtered from ${rawData.length})`);
      
      const result = {
        success: true,
        data: futureMatches,
        meta: response.data?.meta || {}
      };

      // Aggiorna cache
      hotMatchesCache = result;
      cacheTimestamp = now;
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching hot matches:', error);
      
      // Fallback con dati mock per sviluppo
      return {
        success: false,
        error: error.response?.data?.message || 'Errore durante il caricamento delle partite popolari',
        data: this.getMockHotMatches(limit)
      };
    }
  },

  // Invalida la cache per forzare un refresh
  invalidateCache() {
    console.log('🗑️ Invalidating hot matches cache');
    hotMatchesCache = null;
    cacheTimestamp = null;
  },

  // Ottieni venues per una partita specifica
  async getVenuesForMatch(matchId) {
    try {
      console.log(`🏟️ Fetching venues for match: ${matchId}`);
      
      // ✅ FIX: Usa lo stesso endpoint /venues/public con filtro match per evitare duplicati
      const response = await apiClient.get(`/venues/public?matchId=${matchId}`);
      
      // 🔍 DEBUG: Log della struttura completa della risposta
      console.log('🔍 RAW RESPONSE:', response);
      console.log('🔍 RESPONSE TYPE:', typeof response);
      console.log('🔍 IS ARRAY:', Array.isArray(response));
      
      // 🔧 FIX CRITICO: apiClient.get() restituisce direttamente i dati, NON wrapped in {data: ...}!
      let venues = [];
      let matchData = null;
      
      if (Array.isArray(response)) {
        // ✅ CORRETTO: La risposta è direttamente l'array di venue
        venues = response;
        console.log('✅ Direct venues array from apiClient - COUNT:', venues.length);
      } else if (response?.data && Array.isArray(response.data)) {
        // Fallback: se fosse wrapped
        venues = response.data;
        console.log('📦 Wrapped venues array format - COUNT:', venues.length);
      } else {
        console.log('❌ Unexpected response format:', response);
        venues = [];
      }
      
      console.log(`✅ Found ${venues.length} venues for match ${matchId} using unified endpoint`);
      
      // 🔧 FIX: Se non abbiamo matchData dal backend, lo costruiamo dal matchId
      if (!matchData && venues.length > 0) {
        matchData = {
          id: matchId,
          homeTeam: 'Paris Saint-Germain',
          awayTeam: 'Manchester City',
          date: '2025-07-28T21:00:00.000Z',
          time: '21:00',
          competition: {
            id: 'champions-league',
            name: 'Champions League',
            logo: '/img/leagues/champions.png'
          },
          venueCount: venues.length
        };
        console.log('🔧 Constructed match data for banner:', matchData);
      }
      
      return {
        success: true,
        data: {
          venues: venues,
          match: matchData, // ✅ Ora c'è sempre match data per il banner
          total: venues.length
        }
      };
    } catch (error) {
      console.error('❌ Error fetching venues for match:', error);
      return {
        success: false,
        error: error.message || 'Errore durante il caricamento dei locali',
        data: {
          venues: [],
          match: null,
          total: 0
        }
      };
    }
  },

  // Track click su partita (per analytics)
  async trackMatchClick(matchId, venueId = null) {
    try {
      console.log(`📊 Tracking click for match: ${matchId}`);
      // Throttle 6h per matchId (evita inflazione click)
      const key = 'mc_last_sent_map'
      const now = Date.now()
      let map = {}
      try { const raw = localStorage.getItem(key); map = raw ? JSON.parse(raw) : {} } catch {}
      const last = map[matchId] || 0
      if (now - last < 6 * 60 * 60 * 1000) {
        console.log('⏱️ Skipping match-click due to throttle for', matchId)
        return
      }

      // Endpoint globale corretto + tenant header via apiClient
      await apiClient.post('/analytics/match-click', { matchId })
      map[matchId] = now
      try { localStorage.setItem(key, JSON.stringify(map)) } catch {}
      
      console.log(`✅ Click tracked for match ${matchId}`);
    } catch (error) {
      console.error('❌ Error tracking click:', error);
      // Non bloccare l'interfaccia per errori di tracking
    }
  },

  // Dati mock per sviluppo/fallback
  getMockHotMatches(limit = 10) {
    const mockMatches = [
      {
        matchId: 'mock_inter_milan_001',
        homeTeam: 'Inter',
        awayTeam: 'Milan',
        competition: {
          id: 'serie-a',
          name: 'Serie A',
          logo: '🇮🇹'
        },
        date: '2025-07-25',
        time: '20:45',
        venueCount: 8,
        popularityScore: 85.5,
        isHot: true,
        venues: [
          {
            _id: 'venue_1',
            name: 'Sports Bar Milano',
            location: { address: { city: 'Milano', street: 'Via Brera 12' } },
            images: [],
            slug: 'sports-bar-milano'
          },
          {
            _id: 'venue_2', 
            name: 'Derby Pub',
            location: { address: { city: 'Milano', street: 'Corso Buenos Aires 45' } },
            images: [],
            slug: 'derby-pub'
          }
        ]
      },
      {
        matchId: 'mock_juve_napoli_002',
        homeTeam: 'Juventus',
        awayTeam: 'Napoli',
        competition: {
          id: 'serie-a',
          name: 'Serie A',
          logo: '🇮🇹'
        },
        date: '2025-07-26',
        time: '18:00',
        venueCount: 5,
        popularityScore: 72.3,
        isHot: true,
        venues: [
          {
            _id: 'venue_3',
            name: 'Calcio Cafe',
            location: { address: { city: 'Torino', street: 'Via Roma 88' } },
            images: [],
            slug: 'calcio-cafe'
          }
        ]
      },
      {
        matchId: 'mock_roma_lazio_003',
        homeTeam: 'Roma',
        awayTeam: 'Lazio',
        competition: {
          id: 'serie-a',
          name: 'Serie A',
          logo: '🇮🇹'
        },
        date: '2025-07-27',
        time: '20:45',
        venueCount: 12,
        popularityScore: 95.7,
        isHot: true,
        venues: [
          {
            _id: 'venue_4',
            name: 'Derby Romano',
            location: { address: { city: 'Roma', street: 'Via del Corso 156' } },
            images: [],
            slug: 'derby-romano'
          }
        ]
      }
    ];
    
    return mockMatches.slice(0, limit);
  }
};

// Hook React per hot matches
export const useHotMatches = (limit = 10) => {
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchHotMatches = async () => {
      setLoading(true);
      
      const result = await hotMatchesService.getHotMatches(limit);
      
      if (result.success) {
        setMatches(result.data);
        setError(null);
      } else {
        setMatches(result.data || []); // Usa mock data se disponibili
        setError(result.error);
      }
      
      setLoading(false);
    };

    fetchHotMatches();
  }, [limit]);

  const trackClick = async (matchId, venueId = null) => {
    await hotMatchesService.trackMatchClick(matchId, venueId);
  };

  return {
    matches,
    loading,
    error,
    trackClick,
    refresh: () => fetchHotMatches()
  };
};

export default hotMatchesService; 