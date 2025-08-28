// Servizio centralizzato per gestire tutti i dati del venue
// Utilizzando localStorage per la persistenza con supporto multi-tenant
import apiClient from './apiClient.js';

const STORAGE_KEYS = {
  VENUE_PROFILE: 'venue_profile',
  VENUE_FIXTURES: 'venue_fixtures',
  VENUE_BOOKINGS: 'venue_bookings',
  VENUE_OFFERS: 'venue_offers',
  VENUE_STATISTICS: 'venue_statistics',
  VENUE_ACCOUNT: 'venue_account'
};

// Utility per gestire le chiavi con userId per multi-tenancy
const getStorageKey = (key, userId) => `${key}_${userId}`;

// API Client per sincronizzazione backend
class VenueApiClient {
  constructor() {
    this.baseUrl = '/api/venues';
  }

  // Ottiene il tenantId corretto dall'utente
  getTenantId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // ✅ FIX: Usa il tenantId dell'utente, non il suo ID
    if (user.tenantId) {
      console.log('✅ Using user.tenantId:', user.tenantId);
      return user.tenantId;
    }
    
    // Fallback per compatibilità con utenti vecchi
    if (user.id) {
      console.warn('⚠️ Using user.id as fallback tenantId:', user.id);
      return user.id;
    }
    
    console.error('❌ No tenantId found in user object');
    return '';
  }

  async createVenue(venueData) {
    try {
      const token = localStorage.getItem('token');
      const tenantId = this.getTenantId();
      
      console.log('🏢 Creating venue with tenantId:', tenantId);
      console.log('🔐 Token exists:', !!token);
      console.log('🔐 Token length:', token ? token.length : 0);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId // ✅ Usa il tenantId corretto
        },
        body: JSON.stringify(venueData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Error creating venue in backend:', error);
      throw error;
    }
  }

  async updateVenue(venueId, venueData) {
    try {
      const token = localStorage.getItem('token');
      const tenantId = this.getTenantId();
      
      const response = await fetch(`${this.baseUrl}/${venueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId // ✅ Usa il tenantId corretto
        },
        body: JSON.stringify(venueData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Error updating venue in backend:', error);
      throw error;
    }
  }

  async getVenue(venueId) {
    try {
      const token = localStorage.getItem('token');
      const tenantId = this.getTenantId();
      
      const response = await fetch(`${this.baseUrl}/${venueId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId // ✅ Usa il tenantId corretto
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Error getting venue from backend:', error);
      throw error;
    }
  }

  // ✅ Spostata qui per centralizzare la logica API
  async updateBookingSettings(venueId, settings) {
    try {
      console.log('🔄 Calling API to update booking settings for venue:', venueId, settings);
      
      const token = localStorage.getItem('token');
      const tenantId = this.getTenantId();
      
      const response = await fetch(`${this.baseUrl}/${venueId}/booking-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update booking settings');
      }

      const result = await response.json();
      console.log('✅ Booking settings updated successfully via API');
      return result.data;
      
    } catch (error) {
      console.error('❌ Error in API call for updateBookingSettings:', error);
      throw error;
    }
  }
}

// ✅ Rinomina e esporta l'istanza
export const venueApi = new VenueApiClient();

// VENUE PROFILE MANAGEMENT
export const venueProfileService = {
  // Salva il profilo completo del venue (senza foto per evitare quota exceeded)
  saveProfile: (userId, profileData) => {
    try {
      const key = getStorageKey(STORAGE_KEYS.VENUE_PROFILE, userId);
      
      // Crea una copia dei dati escludendo le foto per ridurre dimensioni
      const optimizedData = {
        ...profileData,
        photos: profileData.photos ? profileData.photos.map(photo => ({
          id: photo.id,
          name: photo.name,
          // Mantieni solo l'URL, non la preview base64
          preview: photo.preview?.startsWith('http') ? photo.preview : null
        })) : []
      };
      
      const dataString = JSON.stringify(optimizedData);
      
      // Controlla dimensioni prima di salvare (limite ~5MB per la maggior parte dei browser)
      if (dataString.length > 4 * 1024 * 1024) { // 4MB di sicurezza
        console.warn('⚠️ Profile data too large, saving essential data only');
        
        // Salva solo dati essenziali se troppo grande
        const essentialData = {
          name: profileData.name,
          address: profileData.address,
          city: profileData.city,
          postalCode: profileData.postalCode,
          description: profileData.description,
          email: profileData.email,
          phone: profileData.phone,
          website: profileData.website,
          hours: profileData.hours,
          features: profileData.features,
          lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem(key, JSON.stringify(essentialData));
        return essentialData;
      }
      
      localStorage.setItem(key, dataString);
      return optimizedData;
      
    } catch (error) {
      console.error('Error saving profile to localStorage:', error);
      
      // Fallback: salva solo dati essenziali
      try {
        const key = getStorageKey(STORAGE_KEYS.VENUE_PROFILE, userId);
        const essentialData = {
          name: profileData.name || '',
          address: profileData.address || '',
          city: profileData.city || '',
          postalCode: profileData.postalCode || '',
          description: profileData.description || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          website: profileData.website || '',
          lastSaved: new Date().toISOString(),
          error: 'Saved in fallback mode due to storage quota'
        };
        
        localStorage.setItem(key, JSON.stringify(essentialData));
        return essentialData;
      } catch (fallbackError) {
        console.error('Even fallback save failed:', fallbackError);
        throw new Error('Impossibile salvare il profilo: spazio di archiviazione insufficiente');
      }
    }
  },

  // Recupera il profilo del venue
  getProfile: (userId) => {
    const key = getStorageKey(STORAGE_KEYS.VENUE_PROFILE, userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  // Aggiorna campi specifici del profilo
  updateProfile: (userId, updates) => {
    const existing = venueProfileService.getProfile(userId) || {};
    const updated = { ...existing, ...updates };
    return venueProfileService.saveProfile(userId, updated);
  },

  // Verifica se il profilo è completo
  isProfileComplete: (userId) => {
    const profile = venueProfileService.getProfile(userId);
    if (!profile) return false;
    
    const requiredFields = ['name', 'address', 'description', 'phone'];
    return requiredFields.every(field => profile[field] && profile[field].trim() !== '');
  },

  // ✨ NUOVA FUNZIONE: Sincronizza venue locale con database backend
  async syncToBackend(userId, profileData, user) {
    try {
      console.log('🔄 Syncing venue profile to backend...', { userId, profileData });

      // Converte dati onboarding in formato backend
      const backendVenueData = venueProfileService.convertToBackendFormat(profileData, user);
      
      // Crea venue nel database backend
      const savedVenue = await venueApi.createVenue(backendVenueData);
      
      console.log('✅ Venue successfully created in backend:', savedVenue);

      // Aggiorna localStorage con l'ID del venue backend
      const updatedProfile = {
        ...profileData,
        backendId: savedVenue._id,
        syncedAt: new Date().toISOString(),
        status: 'synced'
      };
      
      venueProfileService.saveProfile(userId, updatedProfile);
      
      return {
        success: true,
        venue: savedVenue,
        localProfile: updatedProfile
      };
      
    } catch (error) {
      console.error('❌ Failed to sync venue to backend:', error);
      
      // Marca come non sincronizzato
      const updatedProfile = {
        ...profileData,
        status: 'sync_failed',
        syncError: error.message,
        lastSyncAttempt: new Date().toISOString()
      };
      
      venueProfileService.saveProfile(userId, updatedProfile);
      
      return {
        success: false,
        error: error.message,
        localProfile: updatedProfile
      };
    }
  },

  // ✨ NUOVA FUNZIONE: Converte dati onboarding in formato backend
  convertToBackendFormat(profileData, user) {
    console.log('🔍 DEBUG convertToBackendFormat input:', { profileData, userEmail: user.email });
    
    const baseVenue = {
      name: profileData.name,
      description: profileData.description || profileData.about,
      contact: {
        email: user.email,
        phone: '3123456789', // Formato italiano senza +39
        website: profileData.website || undefined
      },
      location: {
        address: {
          street: profileData.address,
          city: profileData.city,
          postalCode: profileData.postalCode,
          country: 'Italy'
        },
        // Allinea ai nomi dello schema backend: latitude/longitude
        coordinates: {
          latitude: profileData.coordinates?.latitude ?? 45.4642,
          longitude: profileData.coordinates?.longitude ?? 9.1900
        }
      },
      capacity: {
        total: profileData.capacity?.total || 50,
        maxReservations: profileData.capacity?.maxReservations || 15,
        standing: profileData.capacity?.standing,
        indoor: Math.floor((profileData.capacity?.total || 50) * 0.8),
        outdoor: Math.floor((profileData.capacity?.total || 50) * 0.2)
      },
      bookingSettings: {
        enabled: true,
        requiresApproval: false,
        advanceBookingDays: 30,
        minimumPartySize: 1,
        maximumPartySize: 12,
        timeSlotDuration: 120
      },
      pricing: {
        basePrice: 0,
        pricePerPerson: 0,
        minimumSpend: 0,
        currency: 'EUR'
      }
    };

    // ✅ FIX: Aggiungi immagini se presenti
    if (profileData.photos && Array.isArray(profileData.photos) && profileData.photos.length > 0) {
      baseVenue.images = profileData.photos
        .filter(photo => photo && photo.preview) // Solo foto con preview valida
        .map((photo, index) => ({
          url: photo.preview.startsWith('http://localhost:3001') 
            ? photo.preview.replace('http://localhost:3001', '') // Rimuovi base URL se presente
            : photo.preview,
          caption: photo.name || `Foto ${index + 1}`,
          isMain: index === 0, // Prima foto come principale
          uploadedAt: new Date().toISOString()
        }));
      
      console.log(`✅ Including ${baseVenue.images.length} images in venue creation`);
    } else {
      console.log('⚠️ No photos found in profileData for venue creation');
      baseVenue.images = [];
    }

    // 🎯 FIX CRITICO: Features dai servizi onboarding con mapping corretto
    let serviceIds = [];
    
    if (profileData.facilities && profileData.facilities.facilities && Array.isArray(profileData.facilities.facilities)) {
      // ✅ CASO ONBOARDING: facilities.facilities è array di oggetti {id, name, enabled}
      serviceIds = profileData.facilities.facilities
        .filter(f => f && f.enabled && f.id) // Solo facilities abilitate
        .map(f => f.id);
    } else if (profileData.facilities && profileData.facilities.services && Array.isArray(profileData.facilities.services)) {
      // ✅ CASO ADMIN: facilities.services è array di oggetti {id, name, enabled}
      serviceIds = profileData.facilities.services
        .filter(s => s && s.enabled && s.id) // Solo services abilitati
        .map(s => s.id);
    }
    
    // ❌ Non inviare più features legacy: causa errori enum lato backend
    const serviceToFeatureMap = {};
    baseVenue.features = [];
    
    // ✅ NUOVO: Aggiungi anche facilities.services per backend
    baseVenue.facilities = {
      screens: profileData.facilities?.screens || 1,
      services: serviceIds.map(id => ({
        id: id,
        name: serviceToFeatureMap[id] || id,
        enabled: true
      }))
    };

    // ✅ FIX: Sports offerings con formato corretto
    if (profileData.favouriteSports && Array.isArray(profileData.favouriteSports) && profileData.favouriteSports.length > 0) {
      baseVenue.sportsOfferings = profileData.favouriteSports.map(sport => ({
        sport: sport.sport ? sport.sport.toLowerCase() : 'football',
        leagues: [sport.name || 'Serie A'],
        isPrimary: true
      }));
    } else {
      // Default sport offering
      baseVenue.sportsOfferings = [{
        sport: 'football',
        leagues: ['Serie A'],
        isPrimary: true
      }];
    }

    // Aggiungi orari di apertura se presenti (mappa al formato schema backend)
    if (profileData.openingHours) {
      const dayMap = {
        mon: 'monday',
        tue: 'tuesday',
        wed: 'wednesday',
        thu: 'thursday',
        fri: 'friday',
        sat: 'saturday',
        sun: 'sunday'
      };
      baseVenue.hours = profileData.openingHours.reduce((acc, hour) => {
        const rawKey = (hour.day || '').toLowerCase();
        const key = dayMap[rawKey] || rawKey; // supporta sia MON/TUE che già full
        if (!key) return acc;
        if (hour.status === 'open') {
          acc[key] = {
            open: hour.openTime,
            close: hour.closeTime,
            closed: false
          };
        } else {
          acc[key] = {
            closed: true
          };
        }
        return acc;
      }, {});
    }

    console.log('🔍 DEBUG convertToBackendFormat output:', baseVenue);
    return baseVenue;
  },

  // ✅ FIX: Usa il metodo centralizzato di apiClient
  updateBookingSettings: async (venueId, settings) => {
    return await venueApi.updateBookingSettings(venueId, settings);
  },

  // Funzioni per la gestione delle foto
  uploadPhotos: async (venueId, photos) => {
    // Implementazione per l'upload delle foto
    // Questo è un esempio di come potresti gestire l'upload delle foto
    // In un'applicazione reale, potresti inviare le foto al backend
    // e aggiornare il profilo con l'URL delle immagini.
    // Per ora, simuliamo l'upload e aggiungiamo un ID temporaneo.
    const newPhotos = [...photos];
    newPhotos.forEach(photo => {
      photo.id = Date.now().toString(); // ID temporaneo
      photo.uploadedAt = new Date().toISOString();
    });
    const updatedProfile = {
      ...this.getProfile(venueId), // Recupera il profilo corrente
      photos: newPhotos
    };
    this.saveProfile(venueId, updatedProfile);
    return newPhotos;
  }
};

// FIXTURES (CALENDARIO PARTITE) MANAGEMENT
export const fixturesService = {
  // Recupera tutte le partite del venue
  getFixtures: (userId) => {
    const key = getStorageKey(STORAGE_KEYS.VENUE_FIXTURES, userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  // Aggiunge una nuova partita
  addFixture: (userId, fixture) => {
    const fixtures = fixturesService.getFixtures(userId);
    const newFixture = {
      ...fixture,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    const updated = [...fixtures, newFixture];
    const key = getStorageKey(STORAGE_KEYS.VENUE_FIXTURES, userId);
    localStorage.setItem(key, JSON.stringify(updated));
    return newFixture;
  },

  // Aggiorna una partita esistente
  updateFixture: (userId, fixtureId, updates) => {
    const fixtures = fixturesService.getFixtures(userId);
    const updated = fixtures.map(f => 
      f.id === fixtureId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
    );
    const key = getStorageKey(STORAGE_KEYS.VENUE_FIXTURES, userId);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated.find(f => f.id === fixtureId);
  },

  // Elimina una partita
  deleteFixture: (userId, fixtureId) => {
    const fixtures = fixturesService.getFixtures(userId);
    const updated = fixtures.filter(f => f.id !== fixtureId);
    const key = getStorageKey(STORAGE_KEYS.VENUE_FIXTURES, userId);
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  }
};

// BOOKINGS (PRENOTAZIONI) MANAGEMENT
export const bookingsService = {
  // Recupera tutte le prenotazioni del venue dal backend
  getBookings: async (userId) => {
    try {
      console.log('🚀 DEBUG: Starting getBookings request for venueId:', userId);
      
      // ✅ FIX: Usa apiClient per includere header tenant e autenticazione  
      const response = await apiClient.get(`/bookings/venue/${userId}`);
      
      console.log('🚀 DEBUG: getBookings response received:', response);
      
      if (response.success) {
        console.log('✅ Prenotazioni caricate dal backend:', response.data.length);
        return response.data || [];
      } else {
        console.log('❌ DEBUG: Response not successful:', response);
        throw new Error(response.message || 'Errore nel recupero prenotazioni');
      }
    } catch (error) {
      console.error('❌ Errore caricamento prenotazioni dal backend:', error);
      console.error('❌ DEBUG: Full error object:', error);
      
      // Fallback al localStorage
      const key = getStorageKey(STORAGE_KEYS.VENUE_BOOKINGS, userId);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    }
  },

  // Aggiunge una nuova prenotazione (mantiene localStorage per compatibilità)
  addBooking: async (userId, booking) => {
    const bookings = await bookingsService.getBookings(userId);
    const newBooking = {
      ...booking,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: booking.status || 'pending'
    };
    const updated = [...bookings, newBooking];
    const key = getStorageKey(STORAGE_KEYS.VENUE_BOOKINGS, userId);
    localStorage.setItem(key, JSON.stringify(updated));
    return newBooking;
  },

  // Aggiorna lo status di una prenotazione (mantiene localStorage per compatibilità)
  updateBookingStatus: async (userId, bookingId, status) => {
    const bookings = await bookingsService.getBookings(userId);
    const updated = bookings.map(b => 
      b.id === bookingId ? { ...b, status, updatedAt: new Date().toISOString() } : b
    );
    const key = getStorageKey(STORAGE_KEYS.VENUE_BOOKINGS, userId);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated.find(b => b.id === bookingId);
  },

  // Elimina una prenotazione (mantiene localStorage per compatibilità)
  deleteBooking: async (userId, bookingId) => {
    const bookings = await bookingsService.getBookings(userId);
    const updated = bookings.filter(b => b.id !== bookingId);
    const key = getStorageKey(STORAGE_KEYS.VENUE_BOOKINGS, userId);
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  }
};

// OFFERS (OFFERTE) MANAGEMENT
export const offersService = {
  // Recupera tutte le offerte del venue
  getOffers: (userId) => {
    const key = getStorageKey(STORAGE_KEYS.VENUE_OFFERS, userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  // Aggiunge una nuova offerta
  addOffer: (userId, offer) => {
    const offers = offersService.getOffers(userId);
    const newOffer = {
      ...offer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: offer.status || 'active'
    };
    const updated = [...offers, newOffer];
    const key = getStorageKey(STORAGE_KEYS.VENUE_OFFERS, userId);
    localStorage.setItem(key, JSON.stringify(updated));
    return newOffer;
  },

  // Aggiorna un'offerta esistente
  updateOffer: (userId, offerId, updates) => {
    const offers = offersService.getOffers(userId);
    const updated = offers.map(o => 
      o.id === offerId ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
    );
    const key = getStorageKey(STORAGE_KEYS.VENUE_OFFERS, userId);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated.find(o => o.id === offerId);
  },

  // Elimina un'offerta
  deleteOffer: (userId, offerId) => {
    const offers = offersService.getOffers(userId);
    const updated = offers.filter(o => o.id !== offerId);
    const key = getStorageKey(STORAGE_KEYS.VENUE_OFFERS, userId);
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  }
};

// STATISTICS CALCULATION
export const statisticsService = {
  // Calcola statistiche basate sui dati reali
  calculateStatistics: async (userId) => {
    const bookings = await bookingsService.getBookings(userId);
    const offers = offersService.getOffers(userId);
    const fixtures = fixturesService.getFixtures(userId);
    const profile = venueProfileService.getProfile(userId);

    // Calcoli per statistiche
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    
    const totalOffers = offers.length;
    const activeOffers = offers.filter(o => o.status === 'active').length;
    const expiredOffers = offers.filter(o => o.status === 'expired').length;

    const totalFixtures = fixtures.length;
    const upcomingFixtures = fixtures.filter(f => new Date(f.date) > new Date()).length;

    const screenCount = profile?.facilities?.screens || 0;
    const favouriteSports = profile?.favouriteSports?.length || 0;

    return {
      views: 0, // Da implementare con tracking reale
      clicks: 0, // Da implementare con tracking reale
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings
      },
      offers: {
        total: totalOffers,
        active: activeOffers,
        expired: expiredOffers
      },
      fixtures: {
        total: totalFixtures,
        upcoming: upcomingFixtures
      },
      venue: {
        screens: screenCount,
        sports: favouriteSports
      }
    };
  }
};

// ACCOUNT MANAGEMENT
export const accountService = {
  // Recupera dati account
  getAccountData: (userId) => {
    const key = getStorageKey(STORAGE_KEYS.VENUE_ACCOUNT, userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  // Salva dati account
  saveAccountData: (userId, accountData) => {
    const key = getStorageKey(STORAGE_KEYS.VENUE_ACCOUNT, userId);
    localStorage.setItem(key, JSON.stringify(accountData));
    return accountData;
  },

  // Aggiorna dati account
  updateAccountData: (userId, updates) => {
    const existing = accountService.getAccountData(userId) || {};
    const updated = { ...existing, ...updates };
    return accountService.saveAccountData(userId, updated);
  }
};

// UTILITY FUNCTIONS
export const venueUtils = {
  // Verifica se il venue ha dati
  hasAnyData: async (userId) => {
    const profile = venueProfileService.getProfile(userId);
    const bookings = await bookingsService.getBookings(userId);
    const offers = offersService.getOffers(userId);
    const fixtures = fixturesService.getFixtures(userId);
    
    return !!(profile || bookings.length > 0 || offers.length > 0 || fixtures.length > 0);
  },

  // Pulisce tutti i dati del venue (per testing o reset)
  clearAllVenueData: (userId) => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(getStorageKey(key, userId));
    });
  },

  // Export completo dei dati venue per debugging
  exportVenueData: (userId) => {
    return {
      profile: venueProfileService.getProfile(userId),
      fixtures: fixturesService.getFixtures(userId),
      bookings: bookingsService.getBookings(userId),
      offers: offersService.getOffers(userId),
      account: accountService.getAccountData(userId),
      statistics: statisticsService.calculateStatistics(userId)
    };
  }
}; 