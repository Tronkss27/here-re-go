import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Search, Map as MapIcon, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import VenueCard from '@/components/VenueCard';
import MatchCard from '@/components/MatchCard';
import Header from '@/components/Header';
import { useVenues, useVenueFilters, useVenuesForMatch } from '@/hooks/useVenues';
import { useDebounce } from '@/hooks/useDebounce';
import { useTodaysMatches } from '@/hooks/useTodaysMatches';

// Memoized components for performance
const MemoizedVenueCard = React.memo(VenueCard);
const MemoizedMatchCard = React.memo(MatchCard);

const Locali = React.memo(() => {
  const { matchId } = useParams();
  const location = useLocation();
  const matchDate = location.state?.matchDate;
  
  const [showMap, setShowMap] = useState(false);
  const [showMatches, setShowMatches] = useState(true); // Matches section expanded by default

  // Use custom hooks for venues data and filtering
  const { venues: allVenues, loading: allVenuesLoading, error: allVenuesError } = useVenues();
  const { venues: matchVenues, loading: matchVenuesLoading, error: matchVenuesError } = useVenuesForMatch(matchId, matchDate);
  
  // Determina quali dati usare in base alla presenza di matchId
  const venues = matchId ? matchVenues : allVenues;
  const loading = matchId ? matchVenuesLoading : allVenuesLoading;
  const error = matchId ? matchVenuesError : allVenuesError;
  
  // Use today's matches hook
  const { 
    matches, 
    loading: matchesLoading, 
    error: matchesError,
    hasMatches,
    liveMatchesCount,
    isVenueShowingMatch,
    getVenueMatchInfo
  } = useTodaysMatches();
  
  // Debounced search query for performance
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchQuery = useDebounce(searchInput, 300);
  
  const {
    searchQuery,
    setSearchQuery,
    selectedFilters,
    toggleFilter,
    clearFilters,
    filteredVenues
  } = useVenueFilters(venues);

  // Update search query when debounced value changes
  React.useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, setSearchQuery]);

  // Memoized filter list with new "Partita oggi" filter
  const filters = useMemo(() => [
    'Partita oggi',
    'Wi-Fi',
    'Grande schermo',
    'Prenotabile',
    'Giardino',
    'Schermo esterno',
    'Servi cibo',
    'Pet friendly',
    'Commentatore'
  ], []);

  // Enhanced venue filtering with match information
  const enhancedFilteredVenues = useMemo(() => {
    let filtered = filteredVenues;

    // Apply "Partita oggi" filter
    if (selectedFilters.includes('Partita oggi') && hasMatches) {
      filtered = filtered.filter(venue => isVenueShowingMatch(venue));
    }

    // Add match information to venues
    return filtered.map(venue => ({
      ...venue,
      isShowingMatch: isVenueShowingMatch(venue),
      matchInfo: getVenueMatchInfo(venue)
    }));
  }, [filteredVenues, selectedFilters, hasMatches, isVenueShowingMatch, getVenueMatchInfo]);

  // Memoized handlers for performance
  const handleSearchChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  const handleMapToggle = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);

  const handleMatchesToggle = useCallback(() => {
    setShowMatches(prev => !prev);
  }, []);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  // Handle keyboard navigation for filters
  const handleFilterKeyDown = useCallback((event, filter) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFilter(filter);
    }
  }, [toggleFilter]);

  // Memoized empty state to prevent re-renders
  const emptyStateContent = useMemo(() => (
    <div className="text-center py-12" role="status" aria-live="polite">
      <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
        <Search className="h-10 w-10 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nessun locale trovato
      </h3>
      <p className="text-gray-600 mb-4">
        {searchQuery || selectedFilters.length > 0
          ? 'Prova a modificare i filtri di ricerca'
          : 'Al momento non ci sono locali disponibili'
        }
      </p>
      {(searchQuery || selectedFilters.length > 0) && (
        <Button variant="outline" onClick={clearFilters}>
          Cancella filtri
        </Button>
      )}
    </div>
  ), [searchQuery, selectedFilters.length, clearFilters]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12" role="status" aria-live="polite">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
              aria-hidden="true"
            ></div>
            <p className="text-gray-600">Caricamento locali...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12" role="alert">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 font-medium mb-2">Errore nel caricamento</p>
              <p className="text-red-500 text-sm">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleReload}
              >
                Riprova
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-6" aria-label="Breadcrumb">
          <ol className="flex">
            <li><span>BarMatch</span></li>
            <li className="mx-2" aria-hidden="true">{'>'}</li>
            <li><span>Locali</span></li>
            <li className="mx-2" aria-hidden="true">{'>'}</li>
            <li><span className="text-gray-900" aria-current="page">Sport Bar e Pub</span></li>
          </ol>
        </nav>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            Sport Bar e Pub
          </h1>
          {matchId && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <p className="text-orange-800 font-medium">
                  Mostrando locali per la partita selezionata
                </p>
              </div>
              <p className="text-orange-600 text-sm mt-1">
                {venues.length === 0 ? 'Nessun locale trovato per questa partita' : 
                 `${venues.length} ${venues.length === 1 ? 'locale' : 'locali'} ${venues.length === 1 ? 'disponibile' : 'disponibili'}`}
              </p>
            </div>
          )}
        </div>

        {/* Today's Matches Section - SOLO se NON siamo in una pagina specifica di match */}
        {!matchId && (hasMatches || matchesLoading) && (
          <section className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8" aria-labelledby="todays-matches-heading">
            <div className="p-4 border-b border-gray-100">
              <button
                onClick={handleMatchesToggle}
                className="w-full flex items-center justify-between text-left hover:bg-gray-50 -m-2 p-2 rounded"
                aria-expanded={showMatches}
                aria-controls="matches-content"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 id="todays-matches-heading" className="text-lg font-bold text-gray-900">
                    Partite oggi
                  </h2>
                  {liveMatchesCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {liveMatchesCount} LIVE
                    </span>
                  )}
                  {!matchesLoading && (
                    <span className="text-sm text-gray-600">
                      ({matches.length} {matches.length === 1 ? 'partita' : 'partite'})
                    </span>
                  )}
                </div>
                {showMatches ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            <div
              id="matches-content"
              className={`overflow-hidden transition-all duration-300 ${
                showMatches ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              {matchesLoading ? (
                <div className="p-6">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-gray-600">Caricamento partite...</span>
                  </div>
                </div>
              ) : matchesError ? (
                <div className="p-6 text-center">
                  <p className="text-red-600 text-sm">{matchesError}</p>
                </div>
              ) : matches.length > 0 ? (
                <div className="p-4">
                  <div 
                    className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    role="list"
                    aria-label="Partite di oggi"
                  >
                    {matches.slice(0, 6).map((match) => (
                      <div key={match.id} role="listitem">
                        <MemoizedMatchCard
                          id={match.id}
                          homeTeam={match.homeTeam}
                          awayTeam={match.awayTeam}
                          homeTeamLogo={match.homeTeamLogo}
                          awayTeamLogo={match.awayTeamLogo}
                          league={match.league}
                          leagueLogo={match.leagueLogo}
                          time={match.time}
                          status={match.status}
                          isLive={match.isLive}
                          score={match.score}
                          venue={match.venue}
                          importance={match.importance}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {matches.length > 6 && (
                    <div className="text-center mt-4">
                      <Button variant="outline" size="sm">
                        Mostra tutte le partite ({matches.length})
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nessuna partita programmata per oggi</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Search and Filters */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 mb-8" aria-labelledby="search-filters-heading">
          <h2 id="search-filters-heading" className="sr-only">Ricerca e filtri locali</h2>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <label htmlFor="venue-search" className="sr-only">Cerca locali per nome o località</label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
            <Input
              id="venue-search"
              type="text"
              placeholder="Cerca locali per nome o località"
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-10 h-12 text-lg"
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              Inserisci il nome del locale o la località per trovare sport bar nella tua zona
            </div>
          </div>

          {/* Filter Tags */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filtra per caratteristiche</h3>
            <div className="flex flex-wrap gap-3" role="group" aria-labelledby="filter-heading">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  onKeyDown={(e) => handleFilterKeyDown(e, filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedFilters.includes(filter)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  } ${filter === 'Partita oggi' && !hasMatches ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-pressed={selectedFilters.includes(filter)}
                  role="button"
                  tabIndex={0}
                  disabled={filter === 'Partita oggi' && !hasMatches}
                >
                  {filter}
                  {filter === 'Partita oggi' && hasMatches && (
                    <span className="ml-2 bg-primary-foreground text-primary text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {enhancedFilteredVenues.filter(v => v.isShowingMatch).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Actions */}
          {selectedFilters.length > 0 && (
            <div className="flex items-center justify-between" role="status" aria-live="polite">
              <span className="text-sm text-gray-600">
                {selectedFilters.length} filtri attivi
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:text-primary/80 font-medium"
                aria-label="Cancella tutti i filtri attivi"
              >
                Cancella tutti
              </button>
            </div>
          )}
        </section>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600" role="status" aria-live="polite">
            {enhancedFilteredVenues.length} {enhancedFilteredVenues.length === 1 ? 'locale trovato' : 'locali trovati'}
            {(searchQuery || selectedFilters.length > 0) && (
              <span className="text-primary font-medium ml-1">
                con i filtri applicati
              </span>
            )}
            {selectedFilters.includes('Partita oggi') && (
              <span className="text-green-600 font-medium ml-1">
                • {enhancedFilteredVenues.filter(v => v.isShowingMatch).length} con partita oggi
              </span>
            )}
          </p>
          
          {/* Map Toggle - Mobile */}
          <button
            onClick={handleMapToggle}
            className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            aria-label={showMap ? 'Mostra lista locali' : 'Mostra mappa locali'}
            aria-pressed={showMap}
          >
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            {showMap ? 'Lista' : 'Mappa'}
          </button>
        </div>

        {/* Main Content */}
        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
          {/* Venues List */}
          <section 
            className={`lg:col-span-3 space-y-4 sm:space-y-6 ${showMap ? 'hidden lg:block' : ''}`}
            aria-label="Lista locali"
            role="list"
          >
            {enhancedFilteredVenues.length === 0 ? (
              emptyStateContent
            ) : (
              <>
                {enhancedFilteredVenues.map((venue, index) => (
                  <div 
                    key={`venue_${venue.id}_${index}`} 
                    className="animate-fade-in" 
                    style={{ animationDelay: `${index * 100}ms` }}
                    role="listitem"
                  >
                    <MemoizedVenueCard
                      id={venue._id || venue.id}
                      name={venue.name}
                      image={venue.images?.[0]?.url || venue.image || '/placeholder.svg'}
                      city={venue.location?.address?.city || venue.location?.city || venue.city || 'N/A'}
                      distance="N/A" // This will be calculated when we add geolocation
                      rating={venue.rating}
                      reviewCount={venue.totalReviews}
                      features={venue.amenities}
                      isPremium={false} // This can be added to venue data later
                      isBookable={venue.features?.bookable || false}
                      isShowingMatch={venue.isShowingMatch}
                      matchInfo={venue.matchInfo}
                    />
                  </div>
                ))}

                {/* Load More - For future pagination */}
                {enhancedFilteredVenues.length >= 6 && (
                  <div className="text-center py-6 sm:py-8">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto"
                      aria-label="Carica altri locali nella lista"
                    >
                      Carica Altri Locali
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Map Section - Desktop */}
          <aside className="hidden lg:block lg:col-span-2" aria-label="Mappa locali">
            <div className="sticky top-24 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="h-96 bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <MapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                  <p className="text-gray-600 font-medium">Mappa in arrivo</p>
                  <p className="text-gray-500 text-sm">
                    Visualizzazione geografica dei locali
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Map Section - Mobile */}
          {showMap && (
            <section className="lg:hidden mt-6" aria-label="Mappa locali">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="h-96 bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <MapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                    <p className="text-gray-600 font-medium">Mappa in arrivo</p>
                    <p className="text-gray-500 text-sm">
                      Visualizzazione geografica dei locali
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
});

Locali.displayName = 'Locali';

export default Locali;
