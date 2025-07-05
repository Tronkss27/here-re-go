import React, { useState } from 'react';
import { Clock, MapPin, Users, Play, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import BookingForm from './BookingForm';

interface MatchCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  league: string;
  leagueLogo?: string;
  time: string;
  date?: string;
  status: string;
  isLive: boolean;
  score?: string;
  venue?: string;
  venueId?: string;
  venueName?: string;
  importance?: number;
  venueCount?: number;
}

const MatchCard = React.memo(({
  id,
  homeTeam,
  awayTeam,
  homeTeamLogo,
  awayTeamLogo,
  league,
  leagueLogo,
  time,
  date,
  status,
  isLive,
  score,
  venue,
  venueId,
  venueName,
  venueCount = 0
}: MatchCardProps) => {
  
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = useState(false);

  const getStatusColor = () => {
    if (isLive) return 'text-red-600 bg-red-50 border-red-200'
    if (status?.toLowerCase().includes('finished')) return 'text-gray-600 bg-gray-50 border-gray-200'
    return 'text-blue-600 bg-blue-50 border-blue-200'
  }

  const getStatusText = () => {
    if (isLive) return 'LIVE'
    if (status?.toLowerCase().includes('finished')) return 'FINITA'
    if (status?.toLowerCase().includes('scheduled')) return time
    return status
  }

  // Accessibility text for screen readers
  const getAriaLabel = () => {
    const safeHomeTeam = homeTeam || 'Squadra Casa';
    const safeAwayTeam = awayTeam || 'Squadra Ospite';
    const statusText = isLive ? 'partita in corso' : 
                     status?.toLowerCase().includes('finished') ? 'partita finita' : 
                     'partita programmata';
    const scoreText = score ? `risultato ${score}` : `orario ${time || 'TBD'}`;
    const venueText = venueCount > 0 ? `, disponibile in ${venueCount} ${venueCount === 1 ? 'locale' : 'locali'}` : '';
    
    return `${safeHomeTeam} contro ${safeAwayTeam}, ${league || 'Campionato'}, ${statusText}, ${scoreText}${venueText}`;
  }

  // Safe string helper to prevent charAt errors
  const getSafeTeamInitial = (teamName) => {
    if (!teamName || typeof teamName !== 'string') return '?';
    return teamName.charAt(0).toUpperCase();
  }

  // Safe team name helper
  const getSafeTeamName = (teamName) => {
    if (!teamName || typeof teamName !== 'string') return 'Squadra';
    return teamName;
  }

  // Handle find venues button click
  const handleFindVenues = () => {
    // Navigate to locali page with specific matchId
    navigate(`/locali/${id}`, { state: { matchDate: date } });
  };

  // Handle direct booking button click
  const handleDirectBooking = () => {
    if (!venueId || !venueName) {
      // If no specific venue, redirect to venue list
      handleFindVenues();
      return;
    }
    setShowBookingModal(true);
  };

  // Create match date for booking
  const getMatchDate = () => {
    if (date) {
      return new Date(date);
    }
    // Fallback to today if no date provided
    return new Date();
  };

  // Create time slot from match time
  const getMatchTimeSlot = () => {
    if (!time || time === 'TBD') return null;
    
    // Assume match lasts 2 hours
    const startTime = time;
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 2;
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return {
      start: startTime,
      end: endTime
    };
  };

  return (
    <article 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-opacity-50"
      role="article"
      aria-label={getAriaLabel()}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleFindVenues();
        }
      }}
    >
      {/* Header with League */}
      <header className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 sm:px-4 py-2 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {leagueLogo && (
              <img 
                src={leagueLogo} 
                alt={`Logo ${league || 'Campionato'}`}
                className="w-4 h-4 sm:w-5 sm:h-5 object-contain rounded"
                role="img"
              />
            )}
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 truncate">
              {league || 'Campionato'}
            </h3>
          </div>
          {isLive && (
            <div 
              className="flex items-center space-x-1 text-red-600"
              role="status"
              aria-live="polite"
              aria-label="Partita in diretta"
            >
              <Play className="w-3 h-3 fill-current" aria-hidden="true" />
              <span className="text-xs font-bold">LIVE</span>
            </div>
          )}
        </div>
        {isLive && (
          <div className="mt-1 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse" aria-hidden="true" />
        )}
      </header>

      {/* Match Info */}
      <section className="p-3 sm:p-4" aria-label="Informazioni partita">
        <div className="flex items-center justify-between space-x-3">
          {/* Home Team */}
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {homeTeamLogo ? (
              <img 
                src={homeTeamLogo} 
                alt={`Logo ${getSafeTeamName(homeTeam)}`}
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded"
                role="img"
              />
            ) : (
              <div 
                className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600"
                role="img"
                aria-label={`Iniziali ${getSafeTeamName(homeTeam)}`}
              >
                {getSafeTeamInitial(homeTeam)}
              </div>
            )}
                          <span className="text-sm sm:text-base font-medium text-gray-900 truncate">
                {getSafeTeamName(homeTeam)}
              </span>
          </div>

          {/* Score/Time */}
          <div className="flex flex-col items-center space-y-1 flex-shrink-0">
            {score ? (
              <span className="text-lg sm:text-xl font-bold text-gray-900" aria-label={`Risultato ${score}`}>
                {score}
              </span>
            ) : (
              <div className="flex items-center space-x-1 text-gray-600">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                <span className="text-xs sm:text-sm font-medium">
                  {time || 'TBD'}
                </span>
              </div>
            )}
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center space-x-2 flex-1 min-w-0 justify-end">
            <span className="text-sm sm:text-base font-medium text-gray-900 truncate">
              {getSafeTeamName(awayTeam)}
            </span>
            {awayTeamLogo ? (
              <img 
                src={awayTeamLogo} 
                alt={`Logo ${getSafeTeamName(awayTeam)}`}
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded"
                role="img"
              />
            ) : (
              <div 
                className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600"
                role="img"
                aria-label={`Iniziali ${getSafeTeamName(awayTeam)}`}
              >
                {getSafeTeamInitial(awayTeam)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer with Actions */}
      <footer className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="flex items-center justify-between">
          {/* Venue Count */}
          {venueCount > 0 && (
            <div className="flex items-center space-x-1 text-gray-600">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="text-xs sm:text-sm">
                {venueCount} {venueCount === 1 ? 'locale' : 'locali'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-auto">
            {/* Find Venues Button */}
            <button
              onClick={handleFindVenues}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
              aria-label={`Trova locali che trasmettono ${getSafeTeamName(homeTeam)} contro ${getSafeTeamName(awayTeam)}`}
            >
              Trova locali
            </button>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {showBookingModal && venueId && venueName && (
        <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prenota per {getSafeTeamName(homeTeam)} vs {getSafeTeamName(awayTeam)}
              </DialogTitle>
              <div className="text-sm text-gray-600">
                {league} • {time} • {venueName}
              </div>
            </DialogHeader>
            <BookingForm
              venueId={venueId}
              venueName={venueName}
              fixtureId={id}
              preselectedDate={getMatchDate()}
              preselectedTimeSlot={getMatchTimeSlot()}
              mode="simple" // Use simple mode for match-based bookings
              matchInfo={{
                homeTeam: getSafeTeamName(homeTeam),
                awayTeam: getSafeTeamName(awayTeam),
                league: league,
                time: time
              }}
              onSuccess={() => {
                setShowBookingModal(false);
                // Could add toast notification here
              }}
              onCancel={() => setShowBookingModal(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </article>
  );
});

MatchCard.displayName = 'MatchCard';

export default MatchCard;
