import apiClient from './apiClient.js'

// Service per collegare partite e venue
class MatchVenueService {
  
  // Cerca venue che mostrano una partita specifica
  async searchVenuesForMatch(matchId, date, city = null) {
    try {
      console.log(`🔍 Searching venues for match ${matchId} on ${date}`);
      
      const params = new URLSearchParams({
        matchId,
        date
      });
      
      if (city) {
        params.append('city', city);
      }
      
      const response = await apiClient.get(`/venues/search?${params}`);
      
      if (response.success && response.data) {
        console.log(`✅ Found ${response.data.length} venues for match ${matchId}`);
        return {
          success: true,
          data: response.data.map(venue => this.formatVenueWithAnnouncement(venue)),
          meta: response.meta
        };
      }
      
      return {
        success: false,
        data: [],
        error: 'Nessun locale trovato per questa partita'
      };
      
    } catch (error) {
      console.error('❌ Error searching venues for match:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Errore durante la ricerca dei locali'
      };
    }
  }
  
  // Ottieni annunci pubblici per una partita
  async getPublicAnnouncementsForMatch(matchId, date) {
    try {
      console.log(`📢 Getting public announcements for match ${matchId}`);
      
      const params = new URLSearchParams({
        query: '',
        date,
        competition: '',
        limit: 50
      });
      
      const response = await apiClient.get(`/match-announcements/search/public?${params}`);
      
      if (response.success && response.data) {
        // Filtra per matchId specifico
        const matchAnnouncements = response.data.filter(announcement => 
          announcement.match.id === matchId
        );
        
        console.log(`✅ Found ${matchAnnouncements.length} public announcements for match ${matchId}`);
        return {
          success: true,
          data: matchAnnouncements
        };
      }
      
      return {
        success: false,
        data: [],
        error: 'Nessun annuncio trovato per questa partita'
      };
      
    } catch (error) {
      console.error('❌ Error getting public announcements:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Errore durante il caricamento degli annunci'
      };
    }
  }
  
  // Formatta venue con informazioni dell'annuncio
  formatVenueWithAnnouncement(venueWithAnnouncement) {
    const venue = venueWithAnnouncement;
    const announcement = venue.announcement;
    
    return {
      id: venue._id,
      name: venue.name,
      slug: venue.slug || venue.name.toLowerCase().replace(/\s+/g, '-'),
      location: venue.location?.address ? 
        `${venue.location.address.city}, ${venue.location.address.country}` : 
        'Posizione non disponibile',
      address: venue.location?.address ? 
        `${venue.location.address.street}, ${venue.location.address.city}, ${venue.location.address.postalCode}` :
        'Indirizzo non disponibile',
      phone: venue.contact?.phone || 'Non disponibile',
      rating: venue.rating || 0,
      totalReviews: venue.totalReviews || 0,
      image: venue.images?.[0] || '/placeholder.svg',
      images: venue.images || ['/placeholder.svg'],
      amenities: venue.amenities || [],
      description: venue.description || 'Descrizione non disponibile',
      capacity: venue.capacity?.total || 50,
      priceRange: '€€',
      features: this.mapAmenitiesToFeatures(venue.amenities || []),
      
      // Informazioni specifiche dell'annuncio
      announcement: {
        id: announcement._id,
        description: announcement.eventDetails?.description,
        offers: announcement.eventDetails?.selectedOffers || [],
        views: announcement.views || 0,
        clicks: announcement.clicks || 0,
        startTime: announcement.eventDetails?.startTime,
        endTime: announcement.eventDetails?.endTime
      }
    };
  }
  
  // Mappa amenities alle features (stesso metodo del venuesService)
  mapAmenitiesToFeatures(amenities) {
    const featureMap = {
      'tv_screens': { largeScreen: true },
      'wifi': { wifi: true },
      'food': { servesFood: true },
      'drinks': {},
      'parking': {},
      'outdoor_seating': { garden: true },
      'live_commentary': { commentator: true },
      'reservations': { bookable: true }
    };

    const features = {
      wifi: false,
      largeScreen: false,
      bookable: true,
      garden: false,
      outdoorScreen: false,
      servesFood: false,
      petFriendly: false,
      commentator: false
    };

    amenities.forEach(amenity => {
      const mappedFeatures = featureMap[amenity];
      if (mappedFeatures) {
        Object.assign(features, mappedFeatures);
      }
    });

    return features;
  }
  
  // Incrementa click su annuncio (tracking)
  async trackAnnouncementClick(announcementId) {
    try {
      await apiClient.post(`/match-announcements/track/click/${announcementId}`);
      console.log(`🖱️ Click tracked for announcement ${announcementId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error tracking click:', error);
      return { success: false };
    }
  }
}

// Export singleton instance
const matchVenueService = new MatchVenueService();
export default matchVenueService; 