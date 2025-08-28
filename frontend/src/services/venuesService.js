import { apiClient, apiConfig } from './index.js';

class VenuesService {
  // Ottiene venue per owner
  async getVenueByOwner() {
    try {
      const response = await apiClient.get('/venues/me'); // ✅ Rimosso /api/
      return response.data;
    } catch (error) {
      console.error('Error fetching venue by owner:', error);
      throw error;
    }
  }

  // Ottiene venues formattati per la homepage e pagine pubbliche
  async getFormattedVenues() {
    try {
      console.log('🏟️ Fetching venues from /venues/public...');
      const response = await apiClient.get('/venues/public');
      
      // L'endpoint ora restituisce {success, data} correttamente
      const venues = response.data || [];
      
      // Formatta i dati per l'uso nel frontend (INCLUDE COORDINATES!)
      const formattedVenues = venues.map(venue => ({
        id: venue._id,
        name: venue.name,
        description: venue.description,
        city: venue.location?.address?.city || 'Città',
        address: `${venue.location?.address?.street || ''}, ${venue.location?.address?.city || ''}`.trim(),
        image: venue.images?.[0]?.url || '/api/placeholder/300/200',
        features: venue.features || [],
        type: venue.type || 'Sport Bar',
        rating: venue.rating || 4.5,
        slug: venue.slug || venue._id,
        // 🗺️ CRITICAL: Passa le coordinate per le mappe
        coordinates: venue.coordinates || venue.location?.coordinates,
        location: venue.location // Mantieni anche location completa
      }));

      console.log(`🏟️ Loaded ${formattedVenues.length} venues from public API`);
      return formattedVenues;
    } catch (error) {
      console.error('Error fetching formatted venues:', error);
      // Restituisci array vuoto invece di lanciare errore
      return [];
    }
  }

  // Cerca venues disponibili per prenotazioni
  async searchVenues(query = {}) {
    try {
      const searchParams = new URLSearchParams();
      
      if (query.city) searchParams.append('city', query.city);
      if (query.date) searchParams.append('date', query.date);
      if (query.guests) searchParams.append('guests', query.guests);
      if (query.features) searchParams.append('features', query.features.join(','));

      const endpoint = `/venues/search?${searchParams.toString()}`; // ✅ Rimosso /api/
      const response = await apiClient.get(endpoint);
      
      return {
        success: true,
        data: response.data || [],
        total: response.total || 0
      };
    } catch (error) {
      console.error('Error searching venues:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Ottiene venues pubblici per booking
  async getPublicVenues(filters = {}) {
    try {
      const searchParams = new URLSearchParams(filters);
      const endpoint = `/venues/public?${searchParams.toString()}`; // ✅ Rimosso /api/
      const response = await apiClient.get(endpoint, { includeAuth: false });
      
      return {
        success: true,
        data: response.data || [],
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error fetching public venues:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Ottiene un venue formattato per ID (per visualizzazione pubblica)
  async getFormattedVenueById(venueId) {
    try {
      // Usa endpoint pubblico dedicato per garantire shape coerente e fields (hours, features, announcements)
      const response = await apiClient.get(`/venues/public/${venueId}`, { includeAuth: false });
      
      if (!response.data) {
        throw new Error('Venue non trovato');
      }
      
      // Il backend pubblico restituisce { success, venue, data }
      const venue = response.venue || response.data?.venue || response.data;
      
      // Formatta il venue per il frontend
      return this.convertBackendVenueToLegacy(venue);
    } catch (error) {
      console.error('Error fetching formatted venue by ID:', error);
      throw error;
    }
  }

  // Aggiorna il profilo di un venue
  async updateVenueProfile(venueId, profileData) {
    try {
      const response = await apiClient.put(`/venues/${venueId}`, profileData); // ✅ Rimosso /api/
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating venue profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload foto venue
  async uploadVenuePhoto(file, venueId) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      // ✅ FIX: Ottieni il tenantId corretto dall'utente
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = user.tenantId || user.id; // Usa tenantId se disponibile, altrimenti fallback su id
      
      console.log('📤 Uploading photo with tenantId:', tenantId);

      const response = await fetch(`/api/venues/${venueId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': tenantId // ✅ Usa il tenantId corretto
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error uploading venue photo:', error);
      throw error;
    }
  }

  // Cancella foto venue
  async deleteVenuePhoto(photoUrl, venueId) {
    try {
      const response = await apiClient.delete(`/venues/${venueId}/images`, {
        data: { imageUrl: photoUrl }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  // Converte un array raw di operatingHours in formato legacy
  convertOpeningHours(rawHours = {}) {
    // 🎯 NUOVO: Gestisci formato backend 'hours' (object con chiavi monday, tuesday, etc.)
    if (typeof rawHours === 'object' && !Array.isArray(rawHours) && Object.keys(rawHours).length > 0) {
      const dayMapping = {
        monday: 'MON',
        tuesday: 'TUE', 
        wednesday: 'WED',
        thursday: 'THU',
        friday: 'FRI',
        saturday: 'SAT',
        sunday: 'SUN'
      };
      
      return Object.entries(rawHours).map(([day, info]) => ({
        day: dayMapping[day] || day.toUpperCase(),
        status: info?.closed ? 'closed' : (info?.open && info?.close ? 'open' : 'closed'),
        openTime: info?.open || '11:00',
        closeTime: info?.close || '23:00'
      }));
    }
    
    // Il backend può restituire vari formati; gestiamo alcuni casi comuni
    // Caso 1: array di oggetti { day, openTime, closeTime, status }
    if (Array.isArray(rawHours) && rawHours.length > 0 && rawHours[0].day !== undefined) {
      return rawHours.map(h => ({
        day: h.day,
        status: h.status || (h.openTime && h.closeTime ? 'open' : 'closed'),
        openTime: h.openTime || '11:00',
        closeTime: h.closeTime || '23:00'
      }));
    }

    // Caso 2: object mapping day -> {openTime, closeTime} (formato legacy)
    if (typeof rawHours === 'object' && !Array.isArray(rawHours)) {
      return Object.entries(rawHours).map(([day, info]) => ({
        day,
        status: info?.status || (info?.openTime ? 'open' : 'closed'),
        openTime: info?.openTime || '11:00',
        closeTime: info?.closeTime || '23:00'
      }));
    }

    // Default: ritorna struttura di 7 giorni chiusi
    const defaultDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return defaultDays.map(day => ({
      day,
      status: 'closed',
      openTime: '11:00',
      closeTime: '23:00'
    }));
  }

  // Converte venue backend al formato legacy
  convertBackendVenueToLegacy(backendVenue) {
    if (!backendVenue) return null;
    
    // Funzione helper per convertire URL immagini
    const convertImageUrl = (url) => {
      if (!url) return '';
      
      // Decodifica entità HTML se presenti
      let decodedUrl = url
        .replace(/&#x2F;/g, '/')
        .replace(/&amp;/g, '&');
      
      // Se l'URL è relativo, aggiungi il base URL del backend
      if (decodedUrl.startsWith('/uploads/')) {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const baseUrl = API_BASE_URL.replace('/api', ''); // Rimuovi /api se presente
        decodedUrl = `${baseUrl}${decodedUrl}`;
      }
      
      return decodedUrl;
    };
    
    return {
      id: backendVenue._id,
      name: backendVenue.name,
      description: backendVenue.description,
      address: backendVenue.location?.address?.street || '',
      city: backendVenue.location?.address?.city || '',
      postalCode: backendVenue.location?.address?.postalCode || '',
      website: backendVenue.contact?.website || '',
      phone: backendVenue.contact?.phone || '',
      
      // Converti immagini con URL completi
      images: (backendVenue.images || []).map(img => {
        if (typeof img === 'string') {
          return convertImageUrl(img);
        } else if (img && img.url) {
          return convertImageUrl(img.url);
        }
        return '';
      }).filter(url => url), // Rimuovi URL vuoti
      
      // Facilities
      facilities: {
        screens: backendVenue.facilities?.screens || 1,
        services: (backendVenue.facilities?.services || []).map(service => ({
          id: service.id || service._id || service,
          name: service.name || service,
          enabled: service.enabled !== false
        }))
      },
      
      // Opening hours - FIX: Usa 'hours' dal backend invece di 'operatingHours'
      openingHours: this.convertOpeningHours(backendVenue.hours || backendVenue.operatingHours || {}),
      
      // ✅ NUOVO: Aggiungi anche 'hours' per compatibilità
      hours: backendVenue.hours || {},
      
      // ✅ FIX: Aggiungi bookingSettings per abilitare le prenotazioni
      bookingSettings: backendVenue.bookingSettings || { enabled: false },
      
      // Altri campi
      rating: backendVenue.rating || 0,
      capacity: backendVenue.capacity?.total || 50,
      
      // 🗺️ CRITICAL: Coordinate per le mappe
      coordinates: backendVenue.coordinates || backendVenue.location?.coordinates,
      location: backendVenue.location, // Mantieni anche location completa
      
      // Mantieni il backendId per il salvataggio
      backendId: backendVenue._id
    };
  }
}

const venuesService = new VenuesService();
export default venuesService; 