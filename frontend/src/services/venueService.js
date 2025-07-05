// Servizio centralizzato per gestire tutti i dati del venue
// Utilizzando localStorage per la persistenza con supporto multi-tenant

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

  async createVenue(venueData) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      const response = await fetch(`${this.baseUrl}/${venueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      const response = await fetch(`${this.baseUrl}/${venueId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Error fetching venue from backend:', error);
      throw error;
    }
  }
}

const venueApiClient = new VenueApiClient();

// VENUE PROFILE MANAGEMENT
export const venueProfileService = {
  // Salva il profilo completo del venue
  saveProfile: (userId, profileData) => {
    const key = getStorageKey(STORAGE_KEYS.VENUE_PROFILE, userId);
    localStorage.setItem(key, JSON.stringify(profileData));
    return profileData;
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
      const savedVenue = await venueApiClient.createVenue(backendVenueData);
      
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
    const baseVenue = {
      name: profileData.name,
      description: profileData.description || profileData.about,
      contact: {
        email: user.email,
        phone: profileData.phone,
        website: profileData.website || undefined
      },
      location: {
        address: {
          street: profileData.address,
          city: profileData.city,
          postalCode: profileData.postalCode,
          country: 'Italy'
        },
        coordinates: {
          lat: 45.4642, // Default Milano coordinates
          lng: 9.1900
        }
      },
      capacity: {
        total: 80, // Default capacity
        indoor: 60,
        outdoor: 20
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

    // Aggiungi features se presenti - ARRAY DI STRINGHE SEMPLICI
    if (profileData.facilities && profileData.facilities.facilities && Array.isArray(profileData.facilities.facilities)) {
      baseVenue.features = profileData.facilities.facilities
        .filter(f => typeof f === 'string' && f.trim() !== '')
        .map(f => f.toLowerCase().replace(/\s+/g, '_'));
    } else {
      baseVenue.features = ['wifi', 'tv_screens', 'food_service']; // Default features
    }

    // Aggiungi sport offerings se presenti - FORMATO CORRETTO
    if (profileData.favourites && profileData.favourites.selectedCompetitions && Array.isArray(profileData.favourites.selectedCompetitions)) {
      baseVenue.sportsOfferings = profileData.favourites.selectedCompetitions
        .filter(comp => comp && comp.name)
        .map(comp => ({
          sport: comp.sport || 'football',
          leagues: [comp.name],
          isPrimary: true
        }));
    } else {
      baseVenue.sportsOfferings = [{
        sport: 'football',
        leagues: ['Serie A'],
        isPrimary: true
      }]; // Default sport offering
    }

    // Aggiungi orari di apertura se presenti
    if (profileData.openingHours) {
      baseVenue.hours = profileData.openingHours.reduce((acc, hour) => {
        if (hour.status === 'open') {
          acc[hour.day.toLowerCase()] = {
            open: hour.openTime,
            close: hour.closeTime,
            isOpen: true
          };
        } else {
          acc[hour.day.toLowerCase()] = {
            isOpen: false
          };
        }
        return acc;
      }, {});
    }

    return baseVenue;
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
      // Usa l'endpoint pubblico temporaneo per recuperare prenotazioni dal backend
      const response = await fetch(`/api/bookings/public/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Prenotazioni caricate dal backend:', result.data.length);
        return result.data || [];
      } else {
        throw new Error(result.message || 'Errore nel recupero prenotazioni');
      }
    } catch (error) {
      console.error('❌ Errore caricamento prenotazioni dal backend:', error);
      
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

  // Esporta tutti i dati del venue
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