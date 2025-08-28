import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, MapPin, Calendar, ChevronDown, ChevronUp, Star, Users, Clock, TrendingUp, X } from 'lucide-react';
import Header from '@/components/Header';
import VenueCard from '@/components/VenueCard';
import MatchCard from '@/components/MatchCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVenues, useVenueFilters } from '@/hooks/useVenues';
import { useTodaysMatches } from '@/hooks/useTodaysMatches';
import { useDebounce } from '@/hooks/useDebounce';
import { useParams, useLocation } from 'react-router-dom';
import { fixturesService } from '@/services/fixturesService';
import { hotMatchesService } from '@/services/hotMatchesService';
import { getLeagueLogo, getLeagueDisplayName, getTeamAbbreviation } from '@/utils/leagueUtils';

// Memoized components for performance
const MemoizedVenueCard = React.memo(VenueCard);
const MemoizedMatchCard = React.memo(MatchCard);

const Locali = React.memo(() => {
  const { matchId, date, teamsSlug, fixtureId } = useParams();
  const location = useLocation();
  const matchDate = location.state?.matchDate;
  
  // Determina il matchId dalla route strutturata o semplice
  const actualMatchId = useMemo(() => {
    if (fixtureId) {
      // Route strutturata: /locali/[date]/[teams-slug]/[fixtureId]
      return fixtureId;
    }
    // Route semplice: /locali/:matchId
    return matchId;
  }, [matchId, fixtureId]);
  
  const [showMap, setShowMap] = useState(false);
  const [showMatches, setShowMatches] = useState(true); // Matches section expanded by default
  const [filtersOpen, setFiltersOpen] = useState(false); // Stato per filtri a comparsa

  // Use custom hooks for venues data and filtering
  const { venues: allVenues, loading: allVenuesLoading, error: allVenuesError } = useVenues();
  
  // Per venue con annunci attivi - nuova logica
  const [venuesWithAnnouncements, setVenuesWithAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  
  // Se abbiamo un matchId, usa il nuovo sistema PopularMatch
  const [popularMatchData, setPopularMatchData] = useState(null);
  const [popularMatchLoading, setPopularMatchLoading] = useState(false);
  
  React.useEffect(() => {
    if (actualMatchId) {
      setPopularMatchLoading(true);
      // Usa hotMatchesService per ottenere i dati completi con immagini processate
      hotMatchesService.getVenuesForMatch(actualMatchId)
        .then(response => {
          if (response.success) {
            setPopularMatchData(response.data);
            console.log('🔥 PopularMatch data loaded with processed images:', response.data);
          } else {
            console.error('❌ Error in getVenuesForMatch response:', response.error);
          }
        })
        .catch(err => console.error('❌ Error loading PopularMatch data:', err))
        .finally(() => setPopularMatchLoading(false));
    } else {
      // Se NON abbiamo matchId, usa tutti i venue (non solo quelli con annunci)
      console.log('🏟️ Loading all venues for general /locali page');
      // Non serve caricare venuesWithAnnouncements, usiamo allVenues
    }
  }, [actualMatchId, allVenues]);
  
  // Determina quali dati usare in base alla presenza di actualMatchId
  const venues = actualMatchId ? (popularMatchData?.venues || []) : (allVenues || []);
  const loading = actualMatchId ? popularMatchLoading : allVenuesLoading;
  const error = actualMatchId ? null : allVenuesError;
  
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
    // ✅ FIX: Controllo di sicurezza per evitare errori
    let filtered = filteredVenues || [];
    
    // Se non abbiamo venues, ritorniamo array vuoto
    if (!Array.isArray(filtered)) {
      console.warn('filteredVenues is not an array:', filtered);
      return [];
    }

    // Apply real venue filters based on facilities
    selectedFilters.forEach(filter => {
      switch(filter) {
        case 'Partita oggi':
          if (hasMatches) {
            filtered = filtered.filter(venue => isVenueShowingMatch(venue));
          }
          break;
        case 'Wi-Fi':
          filtered = filtered.filter(venue => 
            venue.facilities?.includes('Wi-Fi') || 
            venue.features?.wifi === true ||
            venue.amenities?.includes('WiFi')
          );
          break;
        case 'Grande schermo':
          filtered = filtered.filter(venue => 
            venue.facilities?.includes('Grande schermo') || 
            venue.features?.bigScreen === true ||
            venue.amenities?.includes('Grande schermo')
          );
          break;
        case 'Prenotabile':
          filtered = filtered.filter(venue => 
            venue.bookingEnabled === true || 
            venue.features?.bookable === true ||
            venue.isBookable === true
          );
          break;
        case 'Giardino':
          filtered = filtered.filter(venue => 
            venue.facilities?.includes('Giardino') || 
            venue.features?.garden === true ||
            venue.amenities?.includes('Giardino')
          );
          break;
        case 'Schermo esterno':
          filtered = filtered.filter(venue => 
            venue.facilities?.includes('Schermo esterno') || 
            venue.features?.outdoorScreen === true ||
            venue.amenities?.includes('Schermo esterno')
          );
          break;
        case 'Servi cibo':
          filtered = filtered.filter(venue => 
            venue.facilities?.includes('Servi cibo') || 
            venue.features?.food === true ||
            venue.amenities?.includes('Cibo') ||
            venue.cuisine?.length > 0
          );
          break;
        case 'Pet friendly':
          filtered = filtered.filter(venue => 
            venue.facilities?.includes('Pet friendly') || 
            venue.features?.petFriendly === true ||
            venue.amenities?.includes('Pet friendly')
          );
          break;
        case 'Commentatore':
          filtered = filtered.filter(venue => 
            venue.facilities?.includes('Commentatore') || 
            venue.features?.commentary === true ||
            venue.amenities?.includes('Commentatore')
          );
          break;
        default:
          // Per filtri non riconosciuti, non filtrare
          break;
      }
    });

    // Add match information to venues
    return filtered.map(venue => ({
      ...venue,
      isShowingMatch: isVenueShowingMatch(venue),
      matchInfo: getVenueMatchInfo(venue)
    }));
  }, [filteredVenues, selectedFilters, hasMatches, isVenueShowingMatch, getVenueMatchInfo]);

  // ✅ FIX: Aggiunto controllo per evitare che enhancedFilteredVenues sia undefined
  const safeEnhancedVenues = enhancedFilteredVenues || [];

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
            {actualMatchId ? 'Locali per la Partita' : 'Sport Bar e Pub'}
          </h1>
          
          {/* Match Details Header - MIGLIORATO */}
          {actualMatchId && popularMatchData?.match && (
            <div className={`match-banner ${
              (popularMatchData.match.homeTeam?.toLowerCase().includes('paris') || 
               popularMatchData.match.awayTeam?.toLowerCase().includes('paris') ||
               popularMatchData.match.homeTeam?.toLowerCase().includes('psg') || 
               popularMatchData.match.awayTeam?.toLowerCase().includes('psg')) ? 'with-stadium' : ''
            }`}>
              {/* Competition Header */}
              <div className="competition-header">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="bg-orange-100 p-3 rounded-full">
                    {getLeagueLogo(popularMatchData.match.competition?.name) ? (
                      <img 
                        src={getLeagueLogo(popularMatchData.match.competition?.name)} 
                        alt={getLeagueDisplayName(popularMatchData.match.competition?.name)}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <span className="text-2xl">⚽</span>
                    )}
                  </div>
                  <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-bold">
                    {getLeagueDisplayName(popularMatchData.match.competition?.name) || 'Calcio'}
                  </div>
                </div>
              </div>

              {/* Teams Section - Centrato con Loghi */}
              <div className="match-teams-container">
                {/* Squadra Casa */}
                <div className="team-section">
                  <div className="team-logo-large bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300">
                    <span className="font-bold text-gray-600">
                      {popularMatchData.match.homeTeam.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {getTeamAbbreviation(popularMatchData.match.homeTeam)}
                  </h3>
                </div>

                {/* VS Section */}
                <div className="vs-section">
                  <div className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                    VS
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">
                      {new Date(popularMatchData.match.date).toLocaleDateString('it-IT', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                    <div className="text-lg font-bold text-orange-600">
                      {new Date(popularMatchData.match.date).toLocaleTimeString('it-IT', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>

                {/* Squadra Ospite */}
                <div className="team-section">
                  <div className="team-logo-large bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300">
                    <span className="font-bold text-gray-600">
                      {popularMatchData.match.awayTeam.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {getTeamAbbreviation(popularMatchData.match.awayTeam)}
                  </h3>
                </div>
              </div>

              {/* Stats e Descrizione */}
              <div className="text-center">
                <div className="match-stats">
                  <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                    <MapPin className="text-orange-500" size={16} />
                    <span className="font-semibold text-gray-900">
                      {popularMatchData.match.venueCount} {popularMatchData.match.venueCount === 1 ? 'locale' : 'locali'}
                    </span>
                  </div>
                  {popularMatchData.match.popularityScore && (
                    <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                      <TrendingUp className="text-orange-500" size={16} />
                      <span className="font-semibold text-gray-900">
                        Score: {Math.round(popularMatchData.match.popularityScore)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-gray-700 font-medium">
                  📍 Trova il locale perfetto per guardare questa partita. Confronta offerte, atmosfera e prenotazioni disponibili.
                </p>
              </div>
            </div>
          )}
          
          {actualMatchId && !popularMatchData && !popularMatchLoading && (
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
                  {!actualMatchId && (hasMatches || matchesLoading) && (
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

          {/* Filter Section - Mobile First Dropdown */}
          <div className="filters-section">
            <div className="filters-header">
              <h3 className="filters-title">Filtra per caratteristiche</h3>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="filters-toggle"
                aria-expanded={filtersOpen}
                aria-controls="filters-dropdown"
              >
                <span>Filtri</span>
                {selectedFilters.length > 0 && (
                  <span className="count-badge">{selectedFilters.length}</span>
                )}
                <ChevronDown 
                  size={14} 
                  className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} 
                />
              </button>
            </div>
            
            <div 
              id="filters-dropdown"
              className={`filters-dropdown ${filtersOpen ? 'open' : 'closed'}`}
              role="group" 
              aria-labelledby="filter-heading"
            >
              <div className="filters-grid">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => toggleFilter(filter)}
                    onKeyDown={(e) => handleFilterKeyDown(e, filter)}
                    className={`filter-tag ${
                      selectedFilters.includes(filter) ? 'active' : ''
                    } ${filter === 'Partita oggi' && !hasMatches ? 'disabled' : ''}`}
                    aria-pressed={selectedFilters.includes(filter)}
                    role="button"
                    tabIndex={0}
                    disabled={filter === 'Partita oggi' && !hasMatches}
                  >
                    {filter}
                    {filter === 'Partita oggi' && hasMatches && (
                      <span className="count-badge">
                        {safeEnhancedVenues.filter(v => v.isShowingMatch).length}
                      </span>
                    )}
                    {filter !== 'Partita oggi' && (
                      <span className="count-badge">
                        {safeEnhancedVenues.filter(venue => {
                          if (filter === 'Wi-Fi') return venue.features?.wifi;
                          if (filter === 'Grande schermo') return venue.features?.largeScreen;
                          if (filter === 'Prenotabile') return venue.features?.bookable;
                          if (filter === 'Giardino') return venue.features?.garden;
                          if (filter === 'Schermo esterno') return venue.features?.outdoorScreen;
                          if (filter === 'Servi cibo') return venue.features?.servesFood;
                          if (filter === 'Pet friendly') return venue.features?.petFriendly;
                          if (filter === 'Commentatore') return venue.features?.commentator;
                          return false;
                        }).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Filter Actions */}
              {selectedFilters.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600">
                    {selectedFilters.length} filtri attivi
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    aria-label="Cancella tutti i filtri attivi"
                  >
                    Cancella tutti
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600" role="status" aria-live="polite">
            {safeEnhancedVenues.length} {safeEnhancedVenues.length === 1 ? 'locale trovato' : 'locali trovati'}
            {(searchQuery || selectedFilters.length > 0) && (
              <span className="text-primary font-medium ml-1">
                con i filtri applicati
              </span>
            )}
            {selectedFilters.includes('Partita oggi') && (
              <span className="text-green-600 font-medium ml-1">
                • {safeEnhancedVenues.filter(v => v.isShowingMatch).length} con partita oggi
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
            {/* MapIcon className="h-4 w-4" aria-hidden="true" /> */}
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
            {safeEnhancedVenues.length === 0 ? (
              emptyStateContent
            ) : (
              <>
                {safeEnhancedVenues.map((venue, index) => (
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
                {safeEnhancedVenues.length >= 6 && (
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
            <div className="sticky top-24">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Map Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Mappa Locali
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>{safeEnhancedVenues.length} locali</span>
                    </div>
                  </div>
                </div>
                
                {/* Map Container */}
                <div className="relative">
                  {safeEnhancedVenues.length > 0 ? (
                    <React.Suspense fallback={
                      <div className="h-96 bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Caricamento mappa...</p>
                        </div>
                      </div>
                    }>
                      {(() => {
                        const VenuesMap = React.lazy(() => import('../components/VenuesMap'));
                        return <VenuesMap 
                          venues={safeEnhancedVenues} 
                          height="calc(100vh - 280px)"
                          className="rounded-none"
                          showControls={true}
                        />
                      })()}
                    </React.Suspense>
                  ) : (
                    <div className="h-96 bg-gray-50 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="font-medium text-gray-600 mb-1">Nessun locale trovato</p>
                        <p className="text-sm text-gray-500">Prova a modificare i filtri</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Map Section - Mobile Fullscreen */}
          {showMap && (
            <section className="lg:hidden fixed inset-0 z-50 bg-white" aria-label="Mappa locali">
              <div className="h-full flex flex-col">
                {/* Mobile Map Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">Mappa Locali</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>{safeEnhancedVenues.length} locali</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMap(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                
                {/* Mobile Map Container */}
                <div className="flex-1 relative">
                  {safeEnhancedVenues.length > 0 && (
                    <React.Suspense fallback={
                      <div className="h-full bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Caricamento mappa...</p>
                        </div>
                      </div>
                    }>
                      {(() => {
                        const VenuesMap = React.lazy(() => import('../components/VenuesMap'));
                        return <VenuesMap 
                          venues={safeEnhancedVenues} 
                          height="100%" 
                          className="rounded-none"
                          showControls={true}
                        />
                      })()}
                    </React.Suspense>
                  )}
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
