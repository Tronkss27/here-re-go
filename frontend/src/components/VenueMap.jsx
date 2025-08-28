import React, { useRef, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useGoogleMap } from '../hooks/useGoogleMaps';

/**
 * Componente mappa interattiva per venue
 */
const VenueMap = ({ 
  venue, 
  className = '',
  height = '300px',
  showDirections = true,
  zoom = 15
}) => {
  const mapContainerRef = useRef(null);
  
  // Usa SOLO coordinate reali del venue
  const effectiveCoordinates = venue.coordinates;
  
  // Se non ci sono coordinate, mostra messaggio
  if (!effectiveCoordinates || (!effectiveCoordinates.latitude && !effectiveCoordinates.longitude)) {
    return (
      <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200 ${className}`} style={{ height }}>
        <div className="text-center text-gray-500 p-6">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Posizione non disponibile</h3>
          <p className="text-xs text-gray-500">Le coordinate GPS di questo locale non sono configurate</p>
        </div>
      </div>
    );
  }
  
  const { map, addMarker, clearMarkers, centerMap, isReady } = useGoogleMap(
    mapContainerRef, 
    {
      zoom: zoom,
      center: {
        lat: effectiveCoordinates.latitude,
        lng: effectiveCoordinates.longitude
      },
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    }
  );

  // Aggiungi marker quando mappa è pronta
  useEffect(() => {
    if (!isReady) return;

    clearMarkers();
    
    const marker = addMarker(
      {
        lat: effectiveCoordinates.latitude,
        lng: effectiveCoordinates.longitude
      },
      {
        title: venue.name,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#F97316" stroke="white" stroke-width="2"/>
              <circle cx="20" cy="20" r="6" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        }
      }
    );

    // Info window con dettagli venue
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${venue.name}</h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">${venue.address || 'Indirizzo non disponibile'}</p>
          ${venue.phone ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">📞 ${venue.phone}</p>` : ''}
          ${showDirections ? `
            <button 
              onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${effectiveCoordinates.latitude},${effectiveCoordinates.longitude}', '_blank')"
              style="background: #F97316; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; margin-top: 8px;"
            >
              🧭 Indicazioni stradali
            </button>
          ` : ''}
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    // Apri info window automaticamente
    setTimeout(() => {
      infoWindow.open(map, marker);
    }, 500);

  }, [isReady, venue, effectiveCoordinates, addMarker, clearMarkers, map, showDirections]);

  // Gestisce click su "Ottieni indicazioni"
  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${effectiveCoordinates.latitude},${effectiveCoordinates.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {/* Container mappa */}
      <div 
        ref={mapContainerRef}
        style={{ height }}
        className="w-full"
      />
      
      {/* Overlay loading */}
      {!isReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Caricamento mappa...</p>
          </div>
        </div>
      )}

      {/* Pulsanti overlay */}
      {isReady && showDirections && (
        <div className="absolute top-3 right-3">
          <button
            onClick={handleGetDirections}
            className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50 transition-colors"
            title="Ottieni indicazioni"
          >
            <Navigation className="h-5 w-5 text-orange-600" />
          </button>
        </div>
      )}

      {/* Info venue overlay */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">{venue.name}</h4>
              <p className="text-xs text-gray-600 mt-1 truncate">
                {venue.address || 'Indirizzo non disponibile'}
              </p>
            </div>
            {showDirections && (
              <button
                onClick={handleGetDirections}
                className="ml-2 bg-orange-600 text-white text-xs px-3 py-1 rounded-full hover:bg-orange-700 transition-colors flex-shrink-0"
              >
                Indicazioni
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueMap;
