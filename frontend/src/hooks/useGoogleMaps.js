import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook per caricare Google Maps API in modo lazy
 */
export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verifica se già caricato
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Verifica se già in loading
    if (window.googleMapsLoading) {
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key non configurata');
      return;
    }

    setIsLoading(true);
    window.googleMapsLoading = true;

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&language=it&region=IT`;
    
    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
      window.googleMapsLoading = false;
    };

    script.onerror = () => {
      setError('Errore caricamento Google Maps API');
      setIsLoading(false);
      window.googleMapsLoading = false;
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script se componente unmounted
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return { isLoaded, isLoading, error };
};

/**
 * Hook per autocompletamento indirizzi con Places API
 */
export const useAddressAutocomplete = (inputRef) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const autocompleteRef = useRef(null);
  const { isLoaded } = useGoogleMaps();

  // Inizializza autocomplete quando Google Maps è caricato
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'IT' },
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
      });

      autocompleteRef.current = autocomplete;

      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          const parsedPlace = parseGooglePlace(place);
          setSelectedPlace(parsedPlace);
        }
      });

      return () => {
        if (listener) {
          window.google.maps.event.removeListener(listener);
        }
      };
    } catch (error) {
      console.error('Errore inizializzazione autocomplete:', error);
    }
  }, [isLoaded, inputRef]);

  // Funzione per ricerca manuale (fallback)
  const searchAddresses = useCallback(async (query) => {
    if (!isLoaded || !query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const service = new window.google.maps.places.AutocompleteService();
      
      service.getPlacePredictions({
        input: query,
        types: ['address'],
        componentRestrictions: { country: 'IT' }
      }, (predictions, status) => {
        setIsLoading(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setSuggestions(predictions.map(prediction => ({
            placeId: prediction.place_id,
            description: prediction.description,
            mainText: prediction.structured_formatting.main_text,
            secondaryText: prediction.structured_formatting.secondary_text
          })));
        } else {
          setSuggestions([]);
        }
      });
    } catch (error) {
      console.error('Errore ricerca indirizzi:', error);
      setIsLoading(false);
      setSuggestions([]);
    }
  }, [isLoaded]);

  // Ottieni dettagli di un place
  const getPlaceDetails = useCallback((placeId) => {
    if (!isLoaded) return Promise.reject('Google Maps non caricato');

    return new Promise((resolve, reject) => {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      service.getDetails({
        placeId: placeId,
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
      }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          resolve(parseGooglePlace(place));
        } else {
          reject(new Error(`Errore dettagli place: ${status}`));
        }
      });
    });
  }, [isLoaded]);

  return {
    suggestions,
    isLoading,
    selectedPlace,
    searchAddresses,
    getPlaceDetails,
    clearSuggestions: () => setSuggestions([]),
    clearSelection: () => setSelectedPlace(null)
  };
};

/**
 * Utility per parsing place di Google in formato standardizzato
 */
export const parseGooglePlace = (place) => {
  const components = place.address_components || [];
  
  const parsed = {
    placeId: place.place_id,
    formattedAddress: place.formatted_address,
    coordinates: {
      latitude: place.geometry?.location?.lat(),
      longitude: place.geometry?.location?.lng()
    },
    street: '',
    streetNumber: '',
    city: '',
    province: '',
    region: '',
    postalCode: '',
    country: 'Italy'
  };

  components.forEach(component => {
    const types = component.types;
    
    if (types.includes('street_number')) {
      parsed.streetNumber = component.long_name;
    }
    if (types.includes('route')) {
      parsed.street = component.long_name;
    }
    if (types.includes('locality') || types.includes('administrative_area_level_3')) {
      parsed.city = component.long_name;
    }
    if (types.includes('administrative_area_level_2')) {
      parsed.province = component.short_name;
    }
    if (types.includes('administrative_area_level_1')) {
      parsed.region = component.long_name;
    }
    if (types.includes('postal_code')) {
      parsed.postalCode = component.long_name;
    }
    if (types.includes('country')) {
      parsed.country = component.long_name;
    }
  });

  // Combina street number e route
  if (parsed.streetNumber && parsed.street) {
    parsed.fullAddress = `${parsed.street}, ${parsed.streetNumber}`;
  } else {
    parsed.fullAddress = parsed.street;
  }

  return parsed;
};

/**
 * Hook per Google Maps (mappa interattiva)
 */
export const useGoogleMap = (containerRef, options = {}) => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    const defaultOptions = {
      zoom: 15,
      center: { lat: 41.9028, lng: 12.4964 }, // Roma default
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      ...options
    };

    const mapInstance = new window.google.maps.Map(containerRef.current, defaultOptions);
    setMap(mapInstance);

    return () => {
      setMap(null);
      setMarkers([]);
    };
  }, [isLoaded, containerRef]);

  const addMarker = useCallback((position, options = {}) => {
    if (!map) return null;

    const marker = new window.google.maps.Marker({
      position,
      map,
      ...options
    });

    setMarkers(prev => [...prev, marker]);
    return marker;
  }, [map]);

  const clearMarkers = useCallback(() => {
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
  }, []);

  const centerMap = useCallback((position, zoom) => {
    if (!map) return;
    
    map.setCenter(position);
    if (zoom !== undefined) {
      map.setZoom(zoom);
    }
  }, [map]);

  return {
    map,
    markers,
    addMarker,
    clearMarkers,
    centerMap,
    isReady: !!map
  };
};

/**
 * Hook per geocoding automatico
 */
export const useGeocoding = () => {
  const { isLoaded } = useGoogleMaps();
  const [isProcessing, setIsProcessing] = useState(false);

  const geocodeAddress = useCallback(async (address) => {
    if (!isLoaded || !address) return null;

    setIsProcessing(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({
          address: address,
          region: 'IT',
          language: 'it'
        }, (results, status) => {
          setIsProcessing(false);
          
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const location = result.geometry.location;
            
            resolve({
              formattedAddress: result.formatted_address,
              coordinates: {
                latitude: location.lat(),
                longitude: location.lng()
              },
              placeId: result.place_id
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  }, [isLoaded]);

  const reverseGeocode = useCallback(async (latitude, longitude) => {
    if (!isLoaded || !latitude || !longitude) return null;

    setIsProcessing(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const latLng = new window.google.maps.LatLng(latitude, longitude);
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({
          location: latLng,
          language: 'it'
        }, (results, status) => {
          setIsProcessing(false);
          
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            
            resolve({
              formattedAddress: result.formatted_address,
              coordinates: { latitude, longitude },
              placeId: result.place_id
            });
          } else {
            reject(new Error(`Reverse geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  }, [isLoaded]);

  return {
    geocodeAddress,
    reverseGeocode,
    isProcessing,
    isReady: isLoaded
  };
};

