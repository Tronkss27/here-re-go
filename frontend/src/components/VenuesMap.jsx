import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Star, Users, X } from 'lucide-react';
import { useGoogleMap } from '../hooks/useGoogleMaps';

/**
 * Mappa con più venue, clustering e info interattive
 */
const VenuesMap = ({ venues = [], height = '400px', className = '', showControls = true }) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [markersData, setMarkersData] = useState([]);

  // Filtra SOLO venue con coordinate reali (NO fake coords per test)
  const validVenues = useMemo(() => {
    console.log('🗺️ VenuesMap DEBUG - Input venues:', venues.length);
    
    // Debug prima del filtro
    console.log('🗺️ Sample venue structure:', venues[0]);
    
    const filtered = venues.filter(v => {
      const c = v?.location?.coordinates || v?.coordinates;
      const hasCoords = c && (c.latitude || c.lat) && (c.longitude || c.lng);
      
      if (!hasCoords) {
        console.log('🗺️ REJECTED venue:', v?.name, '- coordinates:', c, '- location:', v?.location);
      } else {
        console.log('🗺️ ACCEPTED venue:', v?.name, '- coordinates:', c);
      }
      
      return hasCoords;
    });
    
    console.log('🗺️ Valid venues after filtering:', filtered.length);
    return filtered;
  }, [venues]);

  // Centro mappa su Milano (città target) con zoom adattivo
  const center = useMemo(() => {
    // Default su Milano centro (città target)
    if (validVenues.length === 0) return { lat: 45.4642, lng: 9.1900 };
    
    // Se c'è un solo locale, centra su quello con zoom alto
    if (validVenues.length === 1) {
      const c = validVenues[0]?.location?.coordinates || validVenues[0]?.coordinates;
      return { 
        lat: c.latitude ?? c.lat, 
        lng: c.longitude ?? c.lng 
      };
    }
    
    // Per più locali, calcola centro geografico
    const coords = validVenues.map(v => {
      const c = v?.location?.coordinates || v?.coordinates;
      return {
        lat: c.latitude ?? c.lat,
        lng: c.longitude ?? c.lng
      };
    });
    
    const avgLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
    const avgLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
    return { lat: avgLat, lng: avgLng };
  }, [validVenues]);

  const { map, addMarker, clearMarkers, isReady } = useGoogleMap(containerRef, {
    zoom: validVenues.length <= 1 ? 15 : validVenues.length <= 5 ? 13 : 11,
    center,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'administrative',
        elementType: 'labels',
        stylers: [{ visibility: 'simplified' }]
      }
    ],
    mapTypeControl: showControls,
    streetViewControl: showControls,
    fullscreenControl: showControls
  });

  // Crea markers quando mappa pronta
  useEffect(() => {
    if (!isReady || !map) return;
    
    // 🎯 Rendi navigate disponibile globalmente per info-window HTML
    window.venueNavigate = (venueSlug) => {
      console.log('🗺️ Navigating to venue:', venueSlug);
      navigate(`/locale/${venueSlug}`);
    };
    
    clearMarkers();
    const newMarkersData = [];

    validVenues.forEach((venue, index) => {
      const c = venue?.location?.coordinates || venue?.coordinates;
      const latitude = c.latitude ?? c.lat;
      const longitude = c.longitude ?? c.lng;

      // Advanced marker icon with guaranteed ≥40x40 hit-area
      const createPinIcon = (state = 'default', number = index + 1) => {
        const colors = {
          default: { bg: '#F97316', border: '#EA580C', text: '#FFFFFF' },
          hover: { bg: '#EA580C', border: '#C2410C', text: '#FFFFFF' },
          selected: { bg: '#111827', border: '#374151', text: '#FFFFFF' },
          cluster: { bg: '#6B7280', border: '#4B5563', text: '#FFFFFF' }
        };
        
        const color = colors[state] || colors.default;
        const visualSize = state === 'selected' ? 40 : 36; // Visual pin size
        const hitAreaSize = Math.max(40, visualSize); // Minimum 40x40 hit area
        const fontSize = state === 'selected' ? '12' : '10';
        
        return {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="${hitAreaSize}" height="${hitAreaSize}" viewBox="0 0 ${hitAreaSize} ${hitAreaSize}" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="shadow-${state}" x="-50%" y="-50%" width="200%" height="200%">
                  <dropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.25)"/>
                </filter>
              </defs>
              <!-- Invisible hit area -->
              <rect x="0" y="0" width="${hitAreaSize}" height="${hitAreaSize}" fill="transparent"/>
              <!-- Visual pin centered -->
              <circle cx="${hitAreaSize/2}" cy="${hitAreaSize/2}" r="${visualSize/2 - 2}" 
                      fill="${color.bg}" stroke="${color.border}" stroke-width="2" 
                      filter="url(#shadow-${state})"/>
              <circle cx="${hitAreaSize/2}" cy="${hitAreaSize/2}" r="${visualSize/3}" fill="rgba(255,255,255,0.95)"/>
              <text x="${hitAreaSize/2}" y="${hitAreaSize/2 + 4}" text-anchor="middle" 
                    font-family="'Kanit', Arial Black, Arial" font-size="${fontSize}" font-weight="900" 
                    fill="${color.text}">${number}</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(hitAreaSize, hitAreaSize),
          anchor: new window.google.maps.Point(hitAreaSize/2, hitAreaSize/2) // Centro preciso
        };
      };

      const marker = addMarker(
        { lat: latitude, lng: longitude },
        {
          title: venue.name,
          icon: createPinIcon('default', index + 1)
        }
      );

      // Prepara address
      const address = venue?.location?.address
        ? [venue.location.address.street, venue.location.address.city].filter(Boolean).join(', ')
        : (venue.address || 'Indirizzo non disponibile');

      // Compact info window 
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 240px; font-family: 'Kanit', sans-serif;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #F97316, #EA580C); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="color: white; font-weight: bold; font-size: 14px;">${index + 1}</span>
              </div>
              <div style="flex: 1; min-width: 0;">
                <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${venue.name}</h4>
                ${venue.rating ? `
                  <div style="display: flex; align-items: center; gap: 2px; margin-top: 2px;">
                    <span style="color: #fbbf24; font-size: 11px;">★</span>
                    <span style="font-size: 11px; color: #6b7280;">${venue.rating}</span>
                  </div>
                ` : ''}
              </div>
            </div>
            <p style="margin: 0 0 10px 0; font-size: 11px; color: #6b7280; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${address}</p>
            <div style="display: flex; gap: 6px;">
              <button onclick="window.venueNavigate('${venue.slug || venue._id || venue.id}')" 
                      style="flex: 1; background: #F97316; color: white; padding: 6px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; border: none; cursor: pointer; text-align: center;">
                Apri
              </button>
              <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}', '_blank')"
                      style="background: #6b7280; color: white; padding: 6px 8px; border-radius: 4px; border: none; cursor: pointer; font-size: 11px;" title="Indicazioni">
                🧭
              </button>
            </div>
          </div>
        `,
        disableAutoPan: false,
        maxWidth: 250
      });

      // Event listeners con stati dei pin
      marker.addListener('mouseover', () => {
        if (selectedVenue !== venue) {
          marker.setIcon(createPinIcon('hover', index + 1));
        }
      });

      marker.addListener('mouseout', () => {
        if (selectedVenue !== venue) {
          marker.setIcon(createPinIcon('default', index + 1));
        }
      });

      marker.addListener('click', () => {
        // Reset previous selected marker
        newMarkersData.forEach(m => {
          if (m.venue !== venue) {
            m.marker.setIcon(createPinIcon('default', newMarkersData.indexOf(m) + 1));
            m.infoWindow.close();
          }
        });
        
        // Set current marker as selected
        marker.setIcon(createPinIcon('selected', index + 1));
        infoWindow.open(map, marker);
        setSelectedVenue(venue);
        
        // Smooth pan to marker
        map.panTo({ lat: latitude, lng: longitude });
        
        // Zoom in if too far
        if (map.getZoom() < 14) {
          map.setZoom(14);
        }
      });

      newMarkersData.push({
        venue,
        marker,
        infoWindow,
        coordinates: { lat: latitude, lng: longitude }
      });
    });

    setMarkersData(newMarkersData);

    // Auto-fit bounds se ci sono più venue
    if (validVenues.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkersData.forEach(m => {
        bounds.extend(m.coordinates);
      });
      map.fitBounds(bounds);
      
      // Padding per evitare che i marker siano sui bordi
      setTimeout(() => {
        map.panBy(0, -50);
      }, 100);
    }

  }, [isReady, map, validVenues, addMarker, clearMarkers]);

  // Cleanup globale function quando componente viene dismontato
  useEffect(() => {
    return () => {
      if (window.venueNavigate) {
        delete window.venueNavigate;
      }
    };
  }, []);

  // Fallback se nessun venue con coordinate
  if (validVenues.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200 ${className}`} style={{ height }}>
        <div className="text-center text-gray-500 p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Nessun locale geolocalizzato</h3>
          <p className="text-xs text-gray-500 max-w-xs">
            I locali verranno mostrati sulla mappa quando avranno coordinate GPS valide
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {/* Container mappa con safe area per watermark Google */}
      <div 
        ref={containerRef}
        style={{ height }}
        className="w-full"
        data-safe-area="true"
      />
      
      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Caricamento mappa...</p>
          </div>
        </div>
      )}

      {/* Map Controls (no counter duplication) */}
      {isReady && validVenues.length > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200">
            <div className="flex divide-x divide-gray-200">
              <button
                onClick={() => {
                  if (validVenues.length > 1) {
                    const bounds = new window.google.maps.LatLngBounds();
                    markersData.forEach(m => bounds.extend(m.coordinates));
                    map.fitBounds(bounds);
                  }
                }}
                className="px-3 py-2 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                title="Mostra tutti i locali"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </button>
              
              <button
                onClick={() => setSelectedVenue(null)}
                className="px-3 py-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Deseleziona"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Venue quick info overlay */}
      {selectedVenue && (
        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{selectedVenue.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {selectedVenue.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600">{selectedVenue.rating}</span>
                    </div>
                  )}
                  {selectedVenue.capacity && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{selectedVenue.capacity.total}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedVenue(null)}
                className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenuesMap;
