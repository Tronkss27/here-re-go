import apiClient from './apiClient';

// Service per cercare partite (mock per ora, futuro: API reale)
export const searchMatches = async (query, options = {}) => {
  try {
    console.log(`🔍 Searching matches: "${query}"`, options);
    
    // Per ora restituiamo dati mock
    // In futuro sarà: const response = await apiClient.get(`/match-announcements/search/matches?q=${query}`);
    
    return getMockMatches(query, options);
  } catch (error) {
    console.error('❌ Error searching matches:', error);
    return [];
  }
};

// Dati mock per le partite
const getMockMatches = (query = '', options = {}) => {
  const allMatches = [
    {
      id: 'serie_a_inter_milan_001',
      homeTeam: 'Inter',
      awayTeam: 'Milan',
      competition: {
        id: 'serie-a',
        name: 'Serie A',
        logo: '🇮🇹'
      },
      date: '2025-07-25',
      time: '20:45',
      venue: 'San Siro',
      source: 'manual'
    },
    {
      id: 'serie_a_juventus_napoli_002',
      homeTeam: 'Juventus', 
      awayTeam: 'Napoli',
      competition: {
        id: 'serie-a',
        name: 'Serie A',
        logo: '🇮🇹'
      },
      date: '2025-07-26',
      time: '18:00',
      venue: 'Allianz Stadium',
      source: 'manual'
    },
    {
      id: 'serie_a_roma_lazio_003',
      homeTeam: 'Roma',
      awayTeam: 'Lazio',
      competition: {
        id: 'serie-a',
        name: 'Serie A',
        logo: '🇮🇹'
      },
      date: '2025-07-27',
      time: '20:45',
      venue: 'Stadio Olimpico',
      source: 'manual'
    },
    {
      id: 'serie_a_atalanta_fiorentina_004',
      homeTeam: 'Atalanta',
      awayTeam: 'Fiorentina',
      competition: {
        id: 'serie-a',
        name: 'Serie A',
        logo: '🇮🇹'
      },
      date: '2025-07-28',
      time: '15:00',
      venue: 'Gewiss Stadium',
      source: 'manual'
    },
    // Champions League
    {
      id: 'ucl_real_madrid_barcelona_005',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      competition: {
        id: 'champions-league',
        name: 'Champions League',
        logo: '🏆'
      },
      date: '2025-07-29',
      time: '21:00',
      venue: 'Santiago Bernabéu',
      source: 'manual'
    },
    {
      id: 'ucl_manchester_city_psg_006',
      homeTeam: 'Manchester City',
      awayTeam: 'PSG',
      competition: {
        id: 'champions-league',
        name: 'Champions League',
        logo: '🏆'
      },
      date: '2025-07-30',
      time: '21:00',
      venue: 'Etihad Stadium',
      source: 'manual'
    },
    // Premier League
    {
      id: 'pl_manchester_united_liverpool_007',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      competition: {
        id: 'premier-league',
        name: 'Premier League',
        logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿'
      },
      date: '2025-07-31',
      time: '17:30',
      venue: 'Old Trafford',
      source: 'manual'
    },
    // La Liga
    {
      id: 'laliga_atletico_madrid_sevilla_008',
      homeTeam: 'Atletico Madrid',
      awayTeam: 'Sevilla',
      competition: {
        id: 'la-liga',
        name: 'La Liga',
        logo: '🇪🇸'
      },
      date: '2025-08-01',
      time: '19:00',
      venue: 'Wanda Metropolitano',
      source: 'manual'
    },
    // Bundesliga
    {
      id: 'bundesliga_bayern_dortmund_009',
      homeTeam: 'Bayern München',
      awayTeam: 'Borussia Dortmund',
      competition: {
        id: 'bundesliga',
        name: 'Bundesliga',
        logo: '🇩🇪'
      },
      date: '2025-08-02',
      time: '18:30',
      venue: 'Allianz Arena',
      source: 'manual'
    }
  ];

  // Filtra per query di ricerca
  let filtered = allMatches;
  
  if (query && query.length > 0) {
    const searchTerm = query.toLowerCase();
    filtered = allMatches.filter(match => 
      match.homeTeam.toLowerCase().includes(searchTerm) ||
      match.awayTeam.toLowerCase().includes(searchTerm) ||
      match.competition.name.toLowerCase().includes(searchTerm) ||
      match.venue.toLowerCase().includes(searchTerm)
    );
  }

  // Filtra per league se specificata
  if (options.league) {
    filtered = filtered.filter(match => match.competition.id === options.league);
  }

  // Limita i risultati
  const limit = options.limit || 20;
  return filtered.slice(0, limit);
};

export default {
  searchMatches,
  getMockMatches
}; 