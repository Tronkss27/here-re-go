/**
 * 🎯 ADMIN VENUE SERVICE - SOLO BACKEND, NO LOCALSTORAGE
 * 
 * Servizio dedicato per la gestione del profilo venue dall'admin panel.
 * Sostituisce completamente il localStorage con chiamate dirette al backend.
 */

import apiClient from './apiClient.js';

class AdminVenueService {
  
  /**
   * Ottiene il profilo venue dell'utente autenticato
   */
  async getVenueProfile() {
    try {
      console.log('🏢 Getting venue profile from backend...');
      
      // Prima ottieni tutti i venue dell'utente
      const venuesResponse = await apiClient.get('/venues');
      
      if (!venuesResponse.success || !venuesResponse.data || venuesResponse.data.length === 0) {
        console.log('❌ No venues found for user');
        throw new Error('No venues found - backend must work!');
      }
      
      // Prendi il primo venue (assumendo un venue per utente per ora)
      const venue = venuesResponse.data[0];
      console.log('✅ Found venue:', venue.name);
      
      // Converti dal formato backend al formato admin panel
      const adminProfile = this.convertBackendToAdmin(venue);
      
      return adminProfile;
      
    } catch (error) {
      console.error('❌ Error getting venue profile:', error);
      throw error; // FORZA il backend a funzionare, no localStorage!
    }
  }

  /**
   * Carica il profilo da localStorage come fallback
   */
  getFromLocalStorage() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const venueKey = `venue_profile_${user.id}`;
      const venueData = localStorage.getItem(venueKey);
      
      if (!venueData) {
        console.log('❌ No venue data in localStorage');
        return null;
      }
      
      const profile = JSON.parse(venueData);
      console.log('✅ Loaded venue from localStorage:', profile.name);
      
      return {
        name: profile.name || '',
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postalCode || '',
        description: profile.description || '',
        website: profile.website || '',
        phone: profile.phone || '',
        openingHours: profile.openingHours || [],
        capacity: profile.capacity || { total: 50, maxReservations: 15 },
        facilities: profile.facilities || { screens: 1, services: [] },
        photos: profile.photos || [],
        backendId: profile.backendId || null
      };
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Salva il profilo venue sul backend
   */
  async saveVenueProfile(profileData) {
    try {
      console.log('💾 Saving venue profile to backend...');
      
      if (!profileData.backendId) {
        throw new Error('Backend ID is required for saving');
      }
      
      // Converti dal formato admin al formato backend
      const backendPayload = this.convertAdminToBackend(profileData);
      
      console.log('📤 Backend payload:', backendPayload);
      
      // Salva via API
      const response = await apiClient.put(`/venues/${profileData.backendId}`, backendPayload);
      
      if (response.success) {
        console.log('✅ Venue profile saved successfully');
        
            // 🎯 FIX CRITICO: Invalida TUTTE le cache venue per forzare refresh
    if (window.venueCache) {
      window.venueCache = {}; // Pulisci TUTTA la cache
      console.log(`🗑️ CLEARED ALL venue cache after profile save`);
    }
    
    // 🎯 ANCHE: Invalida cache del browser per API venue
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('venues')) {
            caches.delete(cacheName);
            console.log(`🗑️ Deleted browser cache: ${cacheName}`);
          }
        });
      });
    }
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to save venue profile');
      }
      
    } catch (error) {
      console.error('❌ Error saving venue profile:', error);
      throw error;
    }
  }
  
  /**
   * Upload foto venue
   */
  async uploadVenuePhotos(venueId, files) {
    try {
      console.log(`📸 Uploading ${files.length} photos for venue ${venueId}...`);
      
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('image', file);
      });
      
      // 🎯 FIX UPLOAD: Usa fetch diretta per evitare Content-Type automatico di apiClient
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      
      // Aggiungi tenant header se necessario
      if (user.tenantId) {
        headers['X-Tenant-ID'] = user.tenantId;
      }
      
      const rawResponse = await fetch(`http://localhost:3001/api/venues/${venueId}/images`, {
        method: 'POST',
        headers: headers, // NO Content-Type per FormData
        body: formData
      });
      
      const response = await rawResponse.json();
      
      if (!rawResponse.ok) {
        throw new Error(response.message || 'Upload failed');
      }
      
      if (response.success) {
        console.log('✅ Photos uploaded successfully');
        return response.uploadedImages || [];
      } else {
        throw new Error(response.error || 'Failed to upload photos');
      }
      
    } catch (error) {
      console.error('❌ Error uploading photos:', error);
      throw error;
    }
  }
  
  /**
   * Elimina foto venue
   */
  async deleteVenuePhoto(venueId, imageUrl) {
    try {
      console.log(`🗑️ Deleting photo from venue ${venueId}...`);
      
      const response = await apiClient.delete(`/venues/${venueId}/images`, {
        imageUrl
      });
      
      if (response.success) {
        console.log('✅ Photo deleted successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete photo');
      }
      
    } catch (error) {
      console.error('❌ Error deleting photo:', error);
      throw error;
    }
  }
  
  /**
   * Converti dal formato backend al formato admin panel
   */
  convertBackendToAdmin(venue) {
    // Normalizza ID servizi del backend verso il set usato in Admin (italiano)
    const normalizeService = (s) => {
      const rawId = (s?.id || s?.name || '').toLowerCase();
      const map = {
        // EN -> IT
        'food': 'cibo',
        'projector': 'grandi-schermi',
        'outdoor-screen': 'grandi-schermi',
        'garden': 'giardino',
        // already IT stay as-is
        'wifi': 'wifi',
        'cibo': 'cibo',
        'grandi-schermi': 'grandi-schermi',
        'prenotabile': 'prenotabile',
        'pet-friendly': 'pet-friendly',
        'giardino': 'giardino',
        'parcheggio': 'parcheggio',
        'aria-condizionata': 'aria-condizionata'
      };
      const id = map[rawId] || rawId;
      const labelMap = {
        'wifi': 'Wi‑Fi',
        'cibo': 'Cibo',
        'grandi-schermi': 'Grandi Schermi',
        'prenotabile': 'Prenotabile',
        'pet-friendly': 'Pet Friendly',
        'giardino': 'Giardino',
        'parcheggio': 'Parcheggio',
        'aria-condizionata': 'Aria Condizionata'
      };
      return {
        id,
        name: labelMap[id] || id,
        enabled: s?.enabled !== false
      };
    };
    // Mappa gli orari dal formato backend {monday: {open, close, closed}} al formato admin [{day: 'MON', status, openTime, closeTime}]
    const convertHours = (backendHours = {}) => {
      const dayMap = {
        'monday': 'MON', 'tuesday': 'TUE', 'wednesday': 'WED', 
        'thursday': 'THU', 'friday': 'FRI', 'saturday': 'SAT', 'sunday': 'SUN'
      };
      
      return Object.entries(dayMap).map(([backendDay, adminDay]) => {
        const dayData = backendHours[backendDay] || {};
        return {
          day: adminDay,
          status: dayData.closed ? 'closed' : 'open',
          openTime: dayData.open || '09:00',
          closeTime: dayData.close || '23:00'
        };
      });
    };
    
    // Converti le immagini nel formato admin
    const convertImages = (backendImages = []) => {
      return backendImages.map((img, index) => ({
        id: img.url || `img_${index}`,
        preview: img.url || ''
      }));
    };
    
    return {
      // Informazioni principali
      name: venue.name || '',
      address: venue.location?.address?.street || '',
      city: venue.location?.address?.city || '',
      postalCode: venue.location?.address?.postalCode || '',
      description: venue.description || '',
      website: venue.contact?.website || '',
      phone: venue.contact?.phone || '',
      
      // Orari di apertura
      openingHours: convertHours(venue.hours),
      
      // Facilities
      facilities: {
        screens: venue.facilities?.screens || 1,
        services: Array.isArray(venue.facilities?.services)
          ? venue.facilities.services.map(normalizeService)
          : [],
      },
      
      // Capacità (preserva valori salvati)
      capacity: {
        total: venue.capacity?.total ?? 0,
        maxReservations: venue.capacity?.maxReservations ?? 15
      },
      
      // Foto
      photos: convertImages(venue.images),
      
      // Backend reference
      backendId: venue._id,
      
      // Booking settings
      bookingSettings: venue.bookingSettings || {
        enabled: true,
        requiresApproval: false,
        advanceBookingDays: 30,
        minimumPartySize: 1,
        maximumPartySize: 10,
        timeSlotDuration: 120
      }
    };
  }
  
  /**
   * Converti dal formato admin panel al formato backend
   */
  convertAdminToBackend(adminData) {
    // Mappa gli orari dal formato admin al formato backend
    const convertHours = (adminHours = []) => {
      const dayMap = {
        'MON': 'monday', 'TUE': 'tuesday', 'WED': 'wednesday',
        'THU': 'thursday', 'FRI': 'friday', 'SAT': 'saturday', 'SUN': 'sunday'
      };
      
      const hours = {};
      adminHours.forEach(h => {
        const backendDay = dayMap[h.day?.toUpperCase()];
        if (backendDay) {
          hours[backendDay] = h.status === 'open' ? {
            open: h.openTime || '09:00',
            close: h.closeTime || '23:00',
            closed: false
          } : {
            closed: true
          };
        }
      });
      
      return hours;
    };
    
    return {
      name: adminData.name,
      description: adminData.description,
      
      location: {
        address: {
          street: adminData.address,
          city: adminData.city,
          postalCode: adminData.postalCode || '00000',
          country: 'Italy'
        }
      },
      
      contact: {
        email: adminData.userEmail || adminData.email || 'admin@venue.com', // Usa email utente autenticato
        phone: adminData.phone,
        website: adminData.website
      },
      
      // Orari convertiti
      hours: convertHours(adminData.openingHours),
      
      // Facilities complete
      facilities: {
        screens: adminData.facilities?.screens || 1,
        services: adminData.facilities?.services || []
      },
      
      // ❌ Niente features legacy
      features: [],
      
      // Capacity indipendente dagli schermi (non usarla come fallback)
      capacity: adminData.capacity || { total: 50 },
      
      // Booking settings
      bookingSettings: adminData.bookingSettings
    };
  }
}

// Export singleton instance
export default new AdminVenueService();

















