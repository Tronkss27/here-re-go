import { useState } from 'react';
import MatchCard from './MatchCard';
import { useTodaysMatches } from '@/hooks/useTodaysMatches';

const UpcomingMatches = () => {
  const [activeTab, setActiveTab] = useState('big-fixtures');

  // Use real matches from backend instead of mock data
  const { 
    matches, 
    loading: matchesLoading, 
    error: matchesError,
    hasMatches,
    liveMatchesCount 
  } = useTodaysMatches();

  const tabs = [
    { id: 'big-fixtures', label: 'BIG FIXTURES' },
    { id: 'today', label: 'TODAY' },
    { id: 'tomorrow', label: 'TOMORROW' },
    { id: 'thu-5', label: 'THU 5' },
    { id: 'fri-6', label: 'FRI 6' },
    { id: 'sat-7', label: 'SAT 7' },
    { id: 'sun-8', label: 'SUN 8' }
  ];

  // Filter matches based on active tab
  const getFilteredMatches = () => {
    if (activeTab === 'today' || activeTab === 'big-fixtures') {
      // Aggrega i match per matchId per evitare duplicati
      const matchMap = new Map();
      
      (matches || []).forEach(match => {
        const matchId = match.id;
        if (matchMap.has(matchId)) {
          // Incrementa il conteggio venue per questo match
          const existingMatch = matchMap.get(matchId);
          existingMatch.venueCount = (existingMatch.venueCount || 1) + 1;
        } else {
          // Primo match per questo matchId
          matchMap.set(matchId, {
            ...match,
            venueCount: 1
          });
        }
      });
      
      return Array.from(matchMap.values());
    }
    // For other tabs, return empty for now (could be extended)
    return [];
  };

  const filteredMatches = getFilteredMatches();

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Filter Tabs - Fanzo Style */}
        <div className="flex overflow-x-auto scrollbar-hide mb-8 pb-2">
          <div className="flex space-x-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-kanit font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-fanzo-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                {tab.id === 'today' && liveMatchesCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {liveMatchesCount} LIVE
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {matchesLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fanzo-dark"></div>
            <span className="ml-3 text-gray-600 font-kanit">Caricamento partite...</span>
          </div>
        )}

        {/* Error State */}
        {matchesError && (
          <div className="text-center py-12">
            <p className="text-red-600 font-kanit">{matchesError}</p>
            <p className="text-gray-500 mt-2">Riprova tra qualche minuto</p>
          </div>
        )}

        {/* No Matches State */}
        {!matchesLoading && !matchesError && filteredMatches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 font-kanit text-lg">
              {activeTab === 'today' || activeTab === 'big-fixtures' 
                ? 'Nessuna partita in programma per oggi' 
                : 'Nessuna partita disponibile per questa data'
              }
            </p>
          </div>
        )}

        {/* Matches Grid */}
        {!matchesLoading && !matchesError && filteredMatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMatches.map((match, index) => (
              <div key={match.id || index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <MatchCard 
                  id={match.id || `match-${index}`}
                  homeTeam={match.homeTeam || 'Squadra Casa'}
                  awayTeam={match.awayTeam || 'Squadra Ospite'}
                  homeTeamLogo={match.homeTeamLogo}
                  awayTeamLogo={match.awayTeamLogo}
                  league={match.league || 'Campionato'}
                  leagueLogo={match.leagueLogo}
                time={match.time || 'TBD'}
                  date={match.date}
                status={match.status || 'scheduled'}
                isLive={match.isLive || false}
                score={match.score}
                venue={match.venue}
                  venueId={match.venueId}
                  venueName={match.venueName}
                  venueCount={match.venueCount || 1}
                  importance={match.importance || 5}
              />
            </div>
          ))}
        </div>
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
            <h4 className="font-bold mb-2">Debug Info:</h4>
            <p>Active Tab: {activeTab}</p>
            <p>Loading: {matchesLoading ? 'Yes' : 'No'}</p>
            <p>Error: {matchesError || 'None'}</p>
            <p>Total Matches: {matches?.length || 0}</p>
            <p>Filtered Matches: {filteredMatches.length}</p>
            <p>Has Matches: {hasMatches ? 'Yes' : 'No'}</p>
            <p>Live Count: {liveMatchesCount}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingMatches;
