import React, { useCallback, useMemo } from 'react';
import { MapPin, Star, Wifi, Globe, User, Tv, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface VenueCardProps {
  id: string;
  name: string;
  image: string;
  city: string;
  distance: string;
  rating: number;
  reviewCount: number;
  features: string[];
  isPremium?: boolean;
  isBookable?: boolean;
  isShowingMatch?: boolean;
  matchInfo?: {
    homeTeam: string;
    awayTeam: string;
    time: string;
    league: string;
    isLive: boolean;
  } | null;
}

const VenueCard = React.memo(({
  id,
  name,
  image,
  city,
  distance,
  rating,
  reviewCount,
  features,
  isPremium = false,
  isBookable = false,
  isShowingMatch = false,
  matchInfo = null
}: VenueCardProps) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(() => {
    navigate(`/venue/${id}`);
  }, [navigate, id]);

  const getFeatureIcon = useCallback((feature: string) => {
    switch (feature.toLowerCase()) {
      case 'wi-fi':
        return <Wifi className="h-4 w-4" />;
      case 'grande schermo':
        return <Globe className="h-4 w-4" />;
      case 'prenotabile':
        return <User className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  }, []);

  // Memoize feature display to prevent unnecessary re-renders
  const featuresDisplay = useMemo(() => {
    // ✅ CONTROLLO DI SICUREZZA: assicurati che features sia un array
    const safeFeatures = Array.isArray(features) ? features : [];
    
    return safeFeatures.slice(0, 3).map((feature, index) => (
      <div
        key={index}
        className="flex items-center space-x-1 text-xs text-gray-600"
        role="listitem"
        aria-label={`Caratteristica: ${feature}`}
      >
        <span aria-hidden="true">
          {getFeatureIcon(feature)}
        </span>
        <span className="hidden sm:inline">{feature}</span>
        <span className="sm:hidden sr-only">{feature}</span>
      </div>
    ));
  }, [features, getFeatureIcon]);

  // Memoize rating display
  const ratingDisplay = useMemo(() => (
    <div className="flex items-center space-x-1 mb-4">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-semibold text-gray-900">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-gray-500">
        ({reviewCount} recensioni)
      </span>
    </div>
  ), [rating, reviewCount]);

  // Memoize match info display
  const matchInfoDisplay = useMemo(() => {
    if (!isShowingMatch || !matchInfo) return null;

    return (
      <div 
        className="bg-green-50 border-l-4 border-green-400 p-2 sm:p-3 mb-3 rounded-r"
        role="complementary"
        aria-label={`Partita in corso: ${matchInfo.homeTeam} contro ${matchInfo.awayTeam}`}
      >
        <div className="flex items-center space-x-2 mb-1">
          <Tv className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" aria-hidden="true" />
          <span className="text-xs font-medium text-green-800">
            {matchInfo.isLive ? 'LIVE ORA' : 'OGGI'}
          </span>
          {matchInfo.isLive && (
            <div 
              className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
              role="status"
              aria-label="Partita live"
            />
          )}
        </div>
        <div className="text-xs sm:text-sm">
          <div className="font-semibold text-gray-900 truncate">
            {matchInfo.homeTeam} vs {matchInfo.awayTeam}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
            <span>{matchInfo.league}</span>
            {!matchInfo.isLive && (
              <>
                <span aria-hidden="true">•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <span aria-label={`Orario: ${matchInfo.time}`}>
                    {matchInfo.time}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }, [isShowingMatch, matchInfo]);

  // Accessibility label for the entire card
  const getCardAriaLabel = () => {
    const matchText = isShowingMatch && matchInfo 
      ? `, mostra ${matchInfo.homeTeam} vs ${matchInfo.awayTeam} ${matchInfo.isLive ? 'live' : 'oggi'}`
      : '';
    const premiumText = isPremium ? ', locale premium' : '';
    const bookableText = isBookable ? ', prenotabile' : '';
    
    return `${name}, sport bar a ${city}, distanza ${distance}, valutazione ${rating.toFixed(1)} stelle${matchText}${premiumText}${bookableText}`;
  };

  return (
    <article 
      className="bg-white rounded-lg border border-gray-200 shadow-sm card-hover overflow-hidden group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 cursor-pointer"
      role="article"
      aria-label={getCardAriaLabel()}
      onClick={handleViewDetails}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleViewDetails();
        }
      }}
      tabIndex={0}
    >
      <div className="flex flex-col sm:flex-row h-auto sm:h-48 md:h-52">
        {/* Image Section */}
        <div className="relative w-full sm:w-1/2 h-48 sm:h-auto overflow-hidden">
          <OptimizedImage
            src={image}
            alt={`Immagine del locale ${name}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            quality={80}
            placeholder="skeleton"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 300px"
          />
          
          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col space-y-1">
            {isPremium && (
              <span 
                className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-sm"
                role="badge"
                aria-label="Locale premium"
              >
                PREMIUM
              </span>
            )}
            {isBookable && (
              <span 
                className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm"
                role="badge"
                aria-label="Locale prenotabile"
              >
                PRENOTABILE
              </span>
            )}
            {isShowingMatch && (
              <span 
                className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center space-x-1 shadow-sm"
                role="badge"
                aria-label={`${matchInfo?.isLive ? 'Partita live' : 'Partita oggi'} disponibile`}
              >
                <Tv className="h-3 w-3" aria-hidden="true" />
                <span>{matchInfo?.isLive ? 'LIVE' : 'MATCH'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="w-full sm:w-1/2 p-4 flex flex-col justify-between min-h-0">
          <div className="flex-1">
            {/* Title */}
            <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
              {name}
            </h3>

            {/* Location */}
            <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
              <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span aria-label={`Località: ${city}, distanza ${distance}`}>
                {city} • {distance}
              </span>
            </div>

            {/* Match Info */}
            {matchInfoDisplay}

            {/* Features */}
            <div 
              className="flex flex-wrap gap-2 mb-3"
              role="list"
              aria-label="Caratteristiche del locale"
            >
              {featuresDisplay}
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-1 mb-4">
              <Star 
                className="h-4 w-4 fill-yellow-400 text-yellow-400" 
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-gray-900">
                {rating.toFixed(1)}
              </span>
              <span 
                className="text-xs text-gray-500"
                aria-label={`${reviewCount} recensioni`}
              >
                ({reviewCount} recensioni)
              </span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleViewDetails();
              }
            }}
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200 mt-auto"
            aria-label={`Visualizza dettagli di ${name}`}
          >
            Visualizza
          </Button>
        </div>
      </div>
    </article>
  );
});

VenueCard.displayName = 'VenueCard';

export default VenueCard;
