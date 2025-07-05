import apiClient from './apiClient.js'
import { API_ENDPOINTS } from '../config/api.js'
import { generateMockVenue, venuesToLegacy, venueToLegacy, legacyFiltersToSPOrTS } from '../utils/dataAdapters.js'

// Venues Service - Gestisce i locali/venue
class VenuesService {
  
  // Get all venues (public endpoint)
  async getVenues(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    // Use public endpoint for venue listing - no auth required
    const endpoint = queryString ? `/venues/public?${queryString}` : '/venues/public'
    
    return apiClient.get(endpoint, { includeAuth: false })
  }

  // Get venue details by ID
  async getVenueById(id) {
    return apiClient.get(API_ENDPOINTS.VENUES.DETAILS(id))
  }

  // NUOVA FUNZIONE CENTRALIZZATA PER SALVARE IL PROFILO SUL BACKEND
  async updateVenueProfile(venueId, profileData) {
    try {
      console.log(`📡 Saving profile for venue ${venueId} to backend...`, profileData);
      
      const response = await apiClient.put(
        API_ENDPOINTS.VENUES.DETAILS(venueId),
        profileData
      );
      
      console.log('✅ Venue profile saved to backend successfully:', response.data);
      
      // Manteniamo il salvataggio in localStorage per consistenza durante la transizione
      localStorage.setItem(`venue_profile_${venueId}`, JSON.stringify(profileData));
      console.log(`🗂️ Profile also saved to localStorage key: venue_profile_${venueId}`);

      return response;
    } catch (error) {
      console.error('❌ Error saving venue profile to backend:', error);
      try {
        localStorage.setItem(`venue_profile_${venueId}`, JSON.stringify(profileData));
        console.warn(`⚠️ Backend save failed. Profile saved to localStorage as fallback.`);
      } catch (localError) {
        console.error('❌ CRITICAL: Failed to save profile to both backend and localStorage.', localError);
      }
      throw error;
    }
  }

  // Mock data per sviluppo (da sostituire con dati reali dal backend)
  getMockVenues() {
    return {
      success: true,
      data: [
        {
          id: 1,
          name: "The Queen's Head",
          slug: "queens-head",
          location: "Shoreditch, London",
          address: "25-27 Truman Brewery, Brick Lane, London E1 6QR",
          phone: "+44 20 7247 5555",
          rating: 4.5,
          totalReviews: 234,
          images: [
            "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1558618666-fbd26c4cd2d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Wi-Fi", "Grande schermo", "Prenotabile", "Giardino", "Schermo esterno", "Servi cibo", "Pet friendly", "Commentatore"],
          description: "Un autentico pub inglese nel cuore di Shoreditch, perfetto per guardare le partite con gli amici.",
          capacity: 150,
          openingHours: {
            monday: "16:00-23:00",
            tuesday: "16:00-23:00", 
            wednesday: "16:00-23:00",
            thursday: "16:00-00:00",
            friday: "15:00-01:00",
            saturday: "12:00-01:00",
            sunday: "12:00-22:30"
          },
          priceRange: "££",
          cuisine: ["British", "Pub Food"],
          features: {
            wifi: true,
            largeScreen: true,
            bookable: true,
            garden: true,
            outdoorScreen: true,
            servesFood: true,
            petFriendly: true,
            commentator: true
          }
        },
        {
          id: 2,
          name: "Sportivo Bar Milano",
          slug: "sportivo-bar-milano",
          location: "Navigli, Milano",
          address: "Via Vigevano 8, 20144 Milano MI",
          phone: "+39 02 8942 3456",
          rating: 4.3,
          totalReviews: 187,
          images: [
            "https://images.unsplash.com/photo-1544148103-0773bf10d330?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Wi-Fi", "Grande schermo", "Prenotabile", "Schermo esterno", "Servi cibo"],
          description: "Bar sportivo moderno nei Navigli, ideale per aperitivi sportivi e serate con gli amici.",
          capacity: 80,
          openingHours: {
            monday: "17:00-01:00",
            tuesday: "17:00-01:00",
            wednesday: "17:00-01:00", 
            thursday: "17:00-02:00",
            friday: "17:00-02:00",
            saturday: "15:00-02:00",
            sunday: "15:00-00:00"
          },
          priceRange: "€€",
          cuisine: ["Italian", "Aperitivo"],
          features: {
            wifi: true,
            largeScreen: true,
            bookable: true,
            garden: false,
            outdoorScreen: true,
            servesFood: true,
            petFriendly: false,
            commentator: false
          }
        },
        {
          id: 3,
          name: "Champions Sports Lounge",
          slug: "champions-sports-lounge",
          location: "Manhattan, New York",
          address: "123 W 42nd St, New York, NY 10036",
          phone: "+1 212-555-0123",
          rating: 4.7,
          totalReviews: 312,
          images: [
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1574092893806-d0d2e1c4e5b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          ],
          amenities: ["Wi-Fi", "Grande schermo", "Prenotabile", "Servi cibo", "Commentatore"],
          description: "Premium sports lounge nel cuore di Manhattan con schermi giganti e atmosfera elettrizzante.",
          capacity: 200,
          openingHours: {
            monday: "15:00-00:00",
            tuesday: "15:00-00:00",
            wednesday: "15:00-00:00",
            thursday: "15:00-01:00", 
            friday: "15:00-02:00",
            saturday: "12:00-02:00",
            sunday: "12:00-23:00"
          },
          priceRange: "$$$",
          cuisine: ["American", "Sports Bar"],
          features: {
            wifi: true,
            largeScreen: true,
            bookable: true,
            garden: false,
            outdoorScreen: false,
            servesFood: true,
            petFriendly: false,
            commentator: true
          }
        }
      ]
    }
  }

  // Get venue mock data by ID
  getMockVenueById(id) {
    const venues = this.getMockVenues()
    const venue = venues.data.find(v => v.id === parseInt(id))
    
    if (!venue) {
      throw new Error('Venue non trovato')
    }
    
    return {
      success: true,
      data: venue
    }
  }

  // Format venue for display
  formatVenue(venue) {
    return {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      location: venue.location,
      address: venue.address,
      phone: venue.phone,
      rating: venue.rating || 0,
      totalReviews: venue.totalReviews || 0,
      image: venue.images?.[0] || venue.image,
      images: venue.images || [],
      amenities: venue.amenities || [],
      description: venue.description || '',
      capacity: venue.capacity,
      priceRange: venue.priceRange || '€',
      features: venue.features || {},
      openingHours: venue.openingHours || {},
      cuisine: venue.cuisine || []
    }
  }

  // Get formatted venues for display using real backend data + localStorage venues
  async getFormattedVenues(filters = {}) {
    try {
      console.log('🔄 Fetching venues from all sources...');
      let allVenues = [];
      
      // 1. Prova a ottenere dati reali dal backend
      try {
        const response = await this.getVenues(filters);
        if (response.success && response.data && response.data.length > 0) {
          console.log(`✅ Got ${response.data.length} venues from backend`);
          allVenues = [...response.data];
        }
      } catch (backendError) {
        console.warn('⚠️ Backend venues not available:', backendError.message);
      }
      
      // 2. Aggiungi venue dal localStorage (creati tramite admin)
      const localStorageVenues = this.getLocalStorageVenues();
      if (localStorageVenues.length > 0) {
        console.log(`📱 Found ${localStorageVenues.length} venues from localStorage`);
        allVenues = [...allVenues, ...localStorageVenues];
      }
      
      // 3. Se non ci sono venue reali, usa mock data
      if (allVenues.length === 0) {
      console.log('📦 Using mock venues as fallback');
        const mockVenues = this.generateMockVenues();
        const filteredVenues = this.applyFilters(mockVenues, filters);
        return venuesToLegacy(filteredVenues);
      }
      
      // 4. Converti tutti i venue al formato legacy
      return this.convertBackendVenuesToLegacy(allVenues);
      
    } catch (error) {
      console.error('Error fetching formatted venues:', error)
      return []
    }
  }

  // Get formatted venue by ID using real backend data
  async getFormattedVenueById(id) {
    let backendVenue = null;
    let localProfile = null;

    try {
      console.log(`🔄 Fetching venue ${id} from all sources...`);
      
      // Step 1: Prova a ottenere dati reali dal backend
      try {
        const response = await apiClient.get(`/venues/${id}`, { includeAuth: false });
        if (response.success && response.data) {
          console.log(`✅ Got real venue ${id} from backend`);
          backendVenue = response.data;
        }
      } catch (backendError) {
        console.warn(`⚠️ Backend data for venue ${id} not available.`);
      }

      // Step 2: Controlla sempre il localStorage per dati "orfani"
      try {
        const localData = localStorage.getItem(`venue_profile_${id}`);
        if (localData) {
          localProfile = JSON.parse(localData);
          console.log(`📱 Found profile for ${id} in localStorage.`);
        }
      } catch(e) { console.error("Error reading local profile", e); }

      // --- 🚀 LOGICA DI MIGRAZIONE AUTOMATICA E TRASPARENTE ---
      const localPhotos = localProfile?.photos || [];
      const backendPhotos = backendVenue?.images || [];

      if (localProfile && (!backendVenue || localPhotos.length > backendPhotos.length)) {
        console.log('✨ MIGRATION: Local data is richer than backend data. Triggering automatic sync...');
        
        const profileToSync = {
          ...backendVenue,
          ...localProfile,
          images: localPhotos.map(p => ({ url: p.preview || p.url, caption: p.name || '' }))
        };

        this.updateVenueProfile(id, profileToSync)
          .then(() => console.log(`✅ MIGRATION SUCCESS: Profile ${id} synced to backend.`))
          .catch(err => console.error(`❌ MIGRATION FAILED for ${id}:`, err));
        
        backendVenue = this.convertProfileToBackendVenue(localProfile, id);
      }
      // --- FINE LOGICA DI MIGRAZIONE ---

      if (backendVenue) {
        return this.convertBackendVenueToLegacy(backendVenue);
      }
      
      throw new Error(`Venue ${id} not found in any source.`);

    } catch (error) {
      console.error(`Error fetching venue ${id}:`, error);
      throw error;
    }
  }

  // Generate mock SPOrTS venues for development
  generateMockVenues() {
    return [
      // Venue esistente che viene cercato dal frontend
      generateMockVenue({
        _id: "venue_685057e88d7c5eecb3818f9d",
        name: "Nick's Sports Bar",
        description: "Il miglior sports bar per guardare le partite con gli amici! Atmosfera fantastica e schermi giganti.",
        location: {
          address: {
            street: "Via dello Sport 123",
            city: "Milano",
            postalCode: "20100",
            country: "Italy"
          }
        },
        contact: {
          email: "info@nickssportsbar.com",
          phone: "+39 02 1234 5678",
          website: "www.nickssportsbar.com"
        },
        analytics: {
          totalBookings: 120,
          totalReviews: 89,
          averageRating: 4.3,
          viewCount: 1890
        },
        features: ['wifi', 'multiple_screens', 'food_service', 'outdoor_seating', 'parking'],
        capacity: { total: 120, tables: 25, bar: 15, outdoor: 10 },
        pricing: {
          basePrice: 0,
          pricePerPerson: 0,
          minimumSpend: 35,
          currency: "EUR"
        }
      }),
      generateMockVenue({
        _id: "venue_1",
        name: "The Queen's Head",
        description: "Un autentico pub inglese nel cuore di Milano, perfetto per guardare le partite più importanti.",
        location: {
          address: {
            street: "25-27 Truman Brewery, Brick Lane",
            city: "Shoreditch, London",
            postalCode: "E1 6QR",
            country: "UK"
          }
        },
        contact: {
          email: "info@queensheadlondon.com",
          phone: "+44 20 7247 5665",
          website: "www.queensheadlondon.com"
        },
        analytics: {
          totalBookings: 150,
          totalReviews: 234,
          averageRating: 4.5,
          viewCount: 1250
        },
        features: ['wifi', 'multiple_screens', 'food_service'],
        capacity: { total: 80, tables: 20, bar: 15, outdoor: 0 }
      }),
      generateMockVenue({
        _id: "venue_2", 
        name: "Sports Corner",
        description: "Il punto di riferimento per gli amanti dello sport nel centro di Milano.",
        location: {
          address: {
            street: "Via Dante 15",
            city: "Milano",
            postalCode: "20100",
            country: "Italy"
          }
        },
        contact: {
          email: "info@sportscornermilano.it",
          phone: "+39 02 8645123",
          website: "www.sportscornermilano.it"
        },
        analytics: {
          totalBookings: 200,
          totalReviews: 189,
          averageRating: 4.2,
          viewCount: 1560
        },
        features: ['wifi', 'multiple_screens', 'outdoor_seating', 'parking', 'food_service'],
        capacity: { total: 120, tables: 30, bar: 20, outdoor: 15 },
        pricing: {
          basePrice: 0,
          pricePerPerson: 0,
          minimumSpend: 40,
          currency: "EUR"
        }
      }),
      generateMockVenue({
        _id: "venue_3",
        name: "Victory Bar", 
        description: "Atmosfera unica sui Navigli per vivere le emozioni dello sport.",
        location: {
          address: {
            street: "Naviglio Grande 42",
            city: "Milano",
            postalCode: "20144",
            country: "Italy"
          }
        },
        contact: {
          email: "info@victorybar.it",
          phone: "+39 02 5531789",
          website: "www.victorybar.it"
        },
        analytics: {
          totalBookings: 80,
          totalReviews: 156,
          averageRating: 4.0,
          viewCount: 890
        },
        features: ['multiple_screens', 'outdoor_seating', 'live_music', 'full_bar'],
        capacity: { total: 60, tables: 15, bar: 12, outdoor: 8 },
        bookingSettings: {
          enabled: false,
          requiresApproval: true,
          advanceBookingDays: 15,
          minimumPartySize: 2,
          maximumPartySize: 8,
          timeSlotDuration: 90
        }
      })
    ]
  }

  // Apply filters to venues list
  applyFilters(venues, filters = {}) {
    return venues.filter(venue => {
      // Filter by search term
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          venue.name.toLowerCase().includes(searchLower) ||
          venue.description?.toLowerCase().includes(searchLower) ||
          venue.location.address.city.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Filter by features
      if (filters.features && filters.features.length > 0) {
        const hasAllFeatures = filters.features.every(feature =>
          venue.features.includes(feature)
        )
        if (!hasAllFeatures) return false
      }

      // Filter by city
      if (filters.city) {
        const cityLower = filters.city.toLowerCase()
        if (!venue.location.address.city.toLowerCase().includes(cityLower)) return false
      }

      // Filter by minimum rating
      if (filters.minRating && venue.analytics.averageRating < filters.minRating) {
        return false
      }

      // Filter by bookable venues only
      if (filters.bookableOnly && !venue.bookingSettings.enabled) {
        return false
      }

      return true
    })
  }

  // Search venues by criteria
  searchVenues(venues, criteria = {}) {
    let filtered = [...venues]
    
    // Filter by name or location
    if (criteria.search) {
      const searchLower = criteria.search.toLowerCase()
      filtered = filtered.filter(venue => 
        venue.name.toLowerCase().includes(searchLower) ||
        venue.location.toLowerCase().includes(searchLower)
      )
    }
    
    // Filter by features
    if (criteria.features && criteria.features.length > 0) {
      filtered = filtered.filter(venue => 
        criteria.features.every(feature => venue.features[feature])
      )
    }
    
    // Filter by rating
    if (criteria.minRating) {
      filtered = filtered.filter(venue => venue.rating >= criteria.minRating)
    }
    
    return filtered
  }

  // Converti dati backend al formato legacy
  convertBackendVenuesToLegacy(backendVenues) {
    return backendVenues.map(venue => this.convertBackendVenueToLegacy(venue));
  }

  convertBackendVenueToLegacy(backendVenue) {
    // BROWSER DETECTION per passare il parametro corretto a getUnifiedImages
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const browserType = isChrome ? 'Chrome' : 'Safari';
    
    console.log(`🌐 Converting backend venue to legacy format - Browser: ${browserType}`);
    
    const images = this.getUnifiedImages(backendVenue, browserType);
    
    // CONVERSIONE AMENITIES → FEATURES (CAMPO MANCANTE CHE CAUSA IL CRASH)
    const features = this.mapAmenitiesToFeatures(backendVenue.amenities || []);
    console.log(`🔧 Mapped amenities to features:`, { amenities: backendVenue.amenities, features });
    
    return {
      id: backendVenue._id,
      name: this.decodeHtmlEntities(backendVenue.name || ''),
      slug: backendVenue.slug || backendVenue.name.toLowerCase().replace(/\s+/g, '-'),
      location: backendVenue.location?.address ? 
        `${backendVenue.location.address.city}, ${backendVenue.location.address.country}` : 
        'Posizione non disponibile',
      price: '€€',
      rating: backendVenue.rating || 4.5,
      images: images,
      type: backendVenue.category || 'Restaurant',
      description: this.decodeHtmlEntities(backendVenue.description || ''),
      ambience: backendVenue.ambience || [],
      cuisine: backendVenue.cuisine || [],
      // ✅ CAMPO FEATURES AGGIUNTO - Era questo che mancava e causava il crash!
      features: features,
      // Aggiungiamo le informazioni per le prenotazioni
      bookingInfo: {
        availableTimes: backendVenue.availableTimes || [],
        minPartySize: backendVenue.minPartySize || 1,
        maxPartySize: backendVenue.maxPartySize || 10,
        advanceBookingDays: backendVenue.advanceBookingDays || 30
      },
      // Informazioni di contatto per le prenotazioni
      contact: {
        phone: backendVenue.contact?.phone || '',
        email: backendVenue.contact?.email || '',
        website: backendVenue.contact?.website || ''
      },
      // Dati originali del backend per riferimento
      _originalBackendData: backendVenue
    };
  }

  // Decodifica HTML entities (come &#x27; per apostrofo)
  decodeHtmlEntities(text) {
    if (typeof window === 'undefined' || !text) return text || '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  // Recupera venue dal localStorage (creati tramite admin)
  getLocalStorageVenues() {
    try {
      const venues = [];
      
      // Scansiona tutte le chiavi del localStorage per trovare profili venue
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('venue_profile_')) {
          const profileData = localStorage.getItem(key);
          if (profileData) {
            try {
              const profile = JSON.parse(profileData);
              const tenantId = key.replace('venue_profile_', '');
              
              // Converti profilo admin in formato backend venue
              const venue = this.convertProfileToBackendVenue(profile, tenantId);
              if (venue) {
                venues.push(venue);
              }
            } catch (parseError) {
              console.warn(`Error parsing profile ${key}:`, parseError);
            }
          }
        }
      }
      
      return venues;
    } catch (error) {
      console.warn('Error retrieving localStorage venues:', error);
      return [];
    }
  }

  // Converte profilo admin localStorage in formato backend venue
  convertProfileToBackendVenue(profile, tenantId) {
    if (!profile.name) return null;
    
    return {
      _id: tenantId,
      name: profile.name,
      description: profile.description || 'Descrizione non disponibile',
      tenantId: tenantId,
      location: {
        address: {
          street: profile.address || '',
          city: profile.city || '',
          postalCode: profile.postalCode || '',
          country: 'Italy'
        }
      },
      contact: {
        phone: profile.phone || '',
        website: profile.website || ''
      },
      images: profile.photos ? profile.photos.map(photo => ({ url: photo.preview || photo.url, caption: photo.name || '' })) : [],
      amenities: this.convertServicesToAmenities(profile.facilities?.services || []),
      capacity: { total: profile.capacity || 50 },
      openingHours: profile.openingHours || this.generateDefaultOpeningHours(),
      isLocalStorageVenue: true
    };
  }

  // Converte servizi del profilo admin in amenities backend
  convertServicesToAmenities(services) {
    const amenityMap = {
      'wifi': 'wifi',
      'grandi-schermi': 'tv_screens',
      'cibo': 'food',
      'prenotabile': 'reservations',
      'giardino': 'outdoor_seating'
    };
    
    return services.map(service => amenityMap[service.id] || service.id).filter(Boolean);
  }

  // Recupera immagini del venue cercando prima nel profilo admin (BROWSER-SAFE)
  getVenueImages(backendVenue) {
    try {
      console.log('🖼️ DEBUG: Getting images for venue:', backendVenue._id, 'tenantId:', backendVenue.tenantId);
      
      // BROWSER DETECTION per logging
      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
      
      console.log('🌐 DEBUG: Browser detected - Chrome:', isChrome, 'Safari:', isSafari);
      
      // STRATEGIA UNIFICATA: Stessa logica per tutti i browser
      return this.getUnifiedImages(backendVenue, isChrome ? 'Chrome' : 'Safari');
      
    } catch (error) {
      console.warn('🚨 Error retrieving venue images:', error);
      // ULTIMATE FALLBACK: Solo se tutto fallisce
      return ['/placeholder.svg'];
    }
  }

  // NUOVA STRATEGIA UNIFICATA: Priorità al backend, fallback su localStorage
  getUnifiedImages(backendVenue, browserType = 'Chrome') {
    console.log(`🔧 ${browserType}: Using new unified image retrieval strategy`);

    // PRIORITÀ 1: Immagini direttamente dal backend (la fonte di verità)
    if (backendVenue.images && Array.isArray(backendVenue.images) && backendVenue.images.length > 0) {
      const validBackendImages = backendVenue.images
        .map(img => (typeof img === 'string' ? img : img.url) || (img.preview || img.src))
        .filter(url => url && this.isValidImageUrl(url) && !url.includes('unsplash.com'));

      if (validBackendImages.length > 0) {
        console.log(`✅ ${browserType}: Found ${validBackendImages.length} valid images from backend. This is the source of truth.`);
        return validBackendImages;
      }
    }

    // PRIORITÀ 2 (FALLBACK): Cerca nel localStorage per compatibilità con dati vecchi non migrati
    console.log(`⚠️ ${browserType}: No images found on backend object. Falling back to localStorage scan.`);
    
    // ✅ DEBUG: Mostra tutte le chiavi localStorage disponibili
    const allKeys = Object.keys(localStorage).filter(key => key.includes('venue'));
    console.log(`🗂️ ${browserType}: Available venue keys in localStorage:`, allKeys);
    
    // ✅ FIX: ORDINE PRIORITÀ UNIFORME per tutti i browser
    // Prima cerca tenantId (dove sono salvate le foto admin), poi _id
    const profileKeys = [
      `venue_profile_${backendVenue.tenantId}`,     // PRIORITÀ 1: dove sono le foto admin
      `venue_profile_${backendVenue._id}`,          // PRIORITÀ 2: ID venue specifico
      // ✅ AGGIUNTA: Cerca anche possibili varianti per compatibilità
      `venue_profile_${backendVenue.tenantId || backendVenue._id}`,
      `venue_profile_${backendVenue._id.replace(/[^a-f0-9]/gi, '')}` // Pulita da caratteri speciali
    ];
    
    console.log(`🔍 ${browserType}: Will search keys in order:`, profileKeys);
    
    for (const key of profileKeys) {
      try {
        console.log(`🔍 ${browserType}: Trying localStorage key:`, key);
        const data = localStorage.getItem(key);
        
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`📁 ${browserType}: Found profile data for key:`, key);
          
          // Cerca le foto del profilo admin
          if (parsed.photos && Array.isArray(parsed.photos) && parsed.photos.length > 0) {
            console.log(`📸 ${browserType}: Found ${parsed.photos.length} photos in profile`);
            
            const validPhotos = parsed.photos
              .map(photo => photo.preview || photo.url || photo.src)
              .filter(url => url && this.isValidImageUrl(url) && !url.includes('unsplash.com')); // Escludi demo
            
            if (validPhotos.length > 0) {
              console.log(`✅ ${browserType}: Found valid admin photos:`, validPhotos);
              return validPhotos;
            }
          }
          
          // Cerca anche in altre proprietà immagini
          const imageArrays = [parsed.images, parsed.gallery, parsed.pictures].filter(Boolean);
          for (const imageArray of imageArrays) {
            if (Array.isArray(imageArray) && imageArray.length > 0) {
              const validImages = imageArray
                .map(img => typeof img === 'string' ? img : img.preview || img.url || img.src)
                .filter(url => url && this.isValidImageUrl(url) && !url.includes('unsplash.com'));
              
              if (validImages.length > 0) {
                console.log(`✅ ${browserType}: Found valid images in other properties:`, validImages);
                return validImages;
              }
            }
          }
        } else {
          console.log(`❌ ${browserType}: No data found for key:`, key);
        }
      } catch (error) {
        console.warn(`🚨 ${browserType}: Error parsing localStorage key ${key}:`, error);
      }
    }
    
    // PRIORITÀ 3: Se nessuna immagine trovata, usa placeholder
    console.log(`📷 ${browserType}: No real images found anywhere, using placeholder`);
    return ['/placeholder.svg'];
  }

  // Valida se un URL immagine è valido
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Accetta HTTP, HTTPS, data URLs e blob URLs
    return url.startsWith('http') || 
           url.startsWith('data:image/') || 
           url.startsWith('blob:') ||
           url.startsWith('/') || // Relative URLs
           url.includes('unsplash.com') || // Demo images
           url.includes('placeholder');
  }

  // Mappa amenities del backend alle features legacy
  mapAmenitiesToFeatures(amenities) {
    const featureMap = {
      'tv_screens': 'Grandi schermi',
      'wifi': 'Wi-Fi', 
      'food': 'Cibo',
      'drinks': 'Bevande',
      'parking': 'Parcheggio',
      'outdoor_seating': 'Giardino',
      'live_commentary': 'Commentatore',
      'reservations': 'Prenotabile'
    };

    // ✅ RITORNA ARRAY DI STRINGHE invece di oggetto - questo era il problema!
    const featuresArray = amenities
      .map(amenity => featureMap[amenity] || amenity)
      .filter(Boolean);

    // Se non ci sono amenities, aggiungi features di default
    if (featuresArray.length === 0) {
      featuresArray.push('Wi-Fi', 'Prenotabile');
    }

    console.log(`🔧 Mapped amenities to features array:`, featuresArray);
    return featuresArray;
  }

  // Genera orari di apertura di default
  generateDefaultOpeningHours() {
    return { monday: { open: "17:00", close:"00:00"}, tuesday: { open: "17:00", close:"00:00"}, wednesday: { open: "17:00", close:"00:00"}, thursday: { open: "17:00", close:"01:00"}, friday: { open: "17:00", close:"02:00"}, saturday: { open: "15:00", close:"02:00"}, sunday: { open: "15:00", close:"00:00"}};
  }
}

// Create and export singleton instance
const venuesService = new VenuesService()
export default venuesService 