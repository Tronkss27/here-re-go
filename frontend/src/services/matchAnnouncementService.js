import apiClient from './apiClient';

class MatchAnnouncementService {
  
  // ================================
  // 🔍 RICERCA & DISCOVERY
  // ================================

  /**
   * Ricerca partite tramite API esterne
   */
  async searchMatches(query = '', options = {}) {
    try {
      const params = new URLSearchParams({
        query,
        ...options
      });

      const response = await apiClient.get(`/match-announcements/search/matches?${params}`);
      
      console.log(`🔍 Search matches: ${response.data.data.length} risultati`);
      
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta
      };
    } catch (error) {
      console.error('❌ Error searching matches:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Errore durante la ricerca delle partite',
        data: []
      };
    }
  }

  /**
   * Ottieni competizioni disponibili
   */
  async getCompetitions() {
    try {
      const response = await apiClient.get('/match-announcements/competitions');
      
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta
      };
    } catch (error) {
      console.error('❌ Error getting competitions:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Errore durante il caricamento delle competizioni',
        data: []
      };
    }
  }

  // ================================
  // 🏟️ GESTIONE ANNUNCI VENUE
  // ================================

  /**
   * Crea nuovo annuncio partita
   */
  async createAnnouncement(announcementData) {
    try {
      console.log('🏟️ Creating announcement:', {
        match: `${announcementData.match.homeTeam} vs ${announcementData.match.awayTeam}`,
        date: announcementData.eventDetails.startDate,
        offers: announcementData.eventDetails.selectedOffers?.length || 0
      });

      const response = await apiClient.post('/match-announcements', announcementData);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Error creating announcement:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Errore durante la creazione dell\'annuncio',
        status: error.response?.status,
        validationErrors: error.response?.data?.errors
      };
    }
  }

  /**
   * Ottieni annunci del venue corrente
   */
  async getVenueAnnouncements(options = {}) {
    try {
      const params = new URLSearchParams({
        status: 'published',
        limit: 20,
        page: 1,
        ...options
      });

      console.log('🔗 Making API call to:', `/match-announcements/venue?${params}`);
      const response = await apiClient.get(`/match-announcements/venue?${params}`);
      
      console.log('📡 Raw response:', response);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response data:', response.data);
      console.log('📡 Response data keys:', Object.keys(response.data || {}));
      console.log('📡 Response data.data:', response.data?.data);
      console.log('📡 Response data.data type:', typeof response.data?.data);
      console.log('📡 Response data.data length:', response.data?.data?.length);
      
      return {
        success: true,
        data: response.data.data || response.data,  // ✅ FIX: usa response.data se response.data.data non esiste
        pagination: response.data.pagination,
        stats: response.data.stats
      };
    } catch (error) {
      console.error('❌ Error getting venue announcements:', error);
      console.error('❌ Error response:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || 'Errore durante il caricamento degli annunci',
        data: []
      };
    }
  }

  /**
   * Ottieni singolo annuncio
   */
  async getAnnouncement(announcementId, options = {}) {
    try {
      const params = new URLSearchParams(options);
      const response = await apiClient.get(`/match-announcements/${announcementId}?${params}`);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ Error getting announcement:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Errore durante il caricamento dell\'annuncio'
      };
    }
  }

  /**
   * Aggiorna annuncio
   */
  async updateAnnouncement(announcementId, updates) {
    try {
      console.log(`✏️ Updating announcement ${announcementId}`);
      
      const response = await apiClient.put(`/match-announcements/${announcementId}`, updates);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Error updating announcement:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Errore durante l\'aggiornamento dell\'annuncio'
      };
    }
  }

  /**
   * Elimina (archivia) annuncio
   */
  async deleteAnnouncement(announcementId) {
    try {
      console.log(`🗑️ Deleting announcement ${announcementId}`);
      
      const response = await apiClient.delete(`/match-announcements/${announcementId}`);
      
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Error deleting announcement:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Errore durante l\'eliminazione dell\'annuncio'
      };
    }
  }

  // ================================
  // 🌍 RICERCA PUBBLICA
  // ================================

  /**
   * Ricerca pubblica annunci (tutti i locali)
   */
  async searchPublicAnnouncements(query = '', options = {}) {
    try {
      const params = new URLSearchParams({
        query,
        limit: 50,
        page: 1,
        ...options
      });

      const response = await apiClient.get(`/match-announcements/search/public?${params}`);
      
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('❌ Error in public search:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Errore durante la ricerca pubblica',
        data: []
      };
    }
  }

  /**
   * Ottieni annuncio pubblico con tracking
   */
  async getPublicAnnouncement(announcementId, incrementView = false) {
    try {
      const params = new URLSearchParams({ incrementView });
      const response = await apiClient.get(`/match-announcements/public/${announcementId}?${params}`);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ Error getting public announcement:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Errore durante il caricamento dell\'annuncio'
      };
    }
  }

  // ================================
  // 📊 ANALYTICS & TRACKING
  // ================================

  /**
   * Ottieni statistiche venue
   */
  async getVenueStats() {
    try {
      const response = await apiClient.get('/match-announcements/venue/stats');
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ Error getting venue stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Errore durante il caricamento delle statistiche',
        data: {
          totalAnnouncements: 0,
          activeAnnouncements: 0,
          totalViews: 0,
          totalClicks: 0,
          engagementRate: 0
        }
      };
    }
  }

  /**
   * Track click su annuncio
   */
  async trackClick(announcementId) {
    try {
      await apiClient.post(`/match-announcements/track/click/${announcementId}`);
      console.log(`🖱️ Click tracked for announcement ${announcementId}`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error tracking click:', error);
      return { success: false };
    }
  }

  // ================================
  // 🔧 UTILITY & TESTING
  // ================================

  /**
   * Test connessione API esterne
   */
  async testApiConnection() {
    try {
      const response = await apiClient.get('/match-announcements/test/api-connection');
      
      return {
        success: true,
        data: response.data.data,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Test connessione fallito'
      };
    }
  }

  // ================================
  // 🚀 HELPERS & FORMATTERS
  // ================================

  /**
   * Formatta data per display
   */
  formatMatchDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Formatta orario per display
   */
  formatMatchTime(timeString) {
    try {
      return timeString.substring(0, 5); // "20:45:00" -> "20:45"
    } catch (error) {
      return timeString;
    }
  }

  /**
   * Calcola engagement rate
   */
  calculateEngagementRate(views, clicks) {
    if (views === 0) return '0.00';
    return ((clicks / views) * 100).toFixed(2);
  }

  /**
   * Valida dati annuncio prima del submit
   */
  validateAnnouncementData(data) {
    const errors = [];

    // Validazione match
    if (!data.match?.homeTeam) errors.push('Nome squadra di casa mancante');
    if (!data.match?.awayTeam) errors.push('Nome squadra ospite mancante');
    if (!data.match?.date) errors.push('Data partita mancante');
    if (!data.match?.time) errors.push('Orario partita mancante');

    // Validazione event details
    if (!data.eventDetails?.startDate) errors.push('Data evento mancante');
    if (!data.eventDetails?.startTime) errors.push('Orario inizio evento mancante');
    if (!data.eventDetails?.endTime) errors.push('Orario fine evento mancante');

    // Validazione orari
    if (data.eventDetails?.startTime && data.eventDetails?.endTime) {
      const start = data.eventDetails.startTime;
      const end = data.eventDetails.endTime;
      if (start >= end) errors.push('L\'orario di fine deve essere successivo all\'orario di inizio');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Genera ID temporaneo per dati mock
   */
  generateTempId() {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 👁️ OTTIENI SINGOLO ANNUNCIO
  async getAnnouncement(id) {
    try {
      console.log(`👁️ Getting announcement: ${id}`);
      
      const response = await apiClient.get(`/match-announcements/${id}`);
      
      if (response.success) {
        console.log('✅ Announcement retrieved successfully');
        return {
          success: true,
          data: response.data
        };
      } else {
        console.error('❌ Failed to get announcement:', response.error);
        return {
          success: false,
          error: response.error || 'Errore durante il recupero dell\'annuncio'
        };
      }
    } catch (error) {
      console.error('❌ Error getting announcement:', error);
      return {
        success: false,
        error: error.message || 'Errore durante il recupero dell\'annuncio'
      };
    }
  }

  // 🗑️ ELIMINA ANNUNCIO
  async deleteAnnouncement(id) {
    try {
      console.log(`🗑️ Deleting announcement: ${id}`);
      
      const response = await apiClient.delete(`/match-announcements/${id}`);
      
      if (response.success) {
        console.log('✅ Announcement deleted successfully');
        return {
          success: true,
          message: response.message || 'Annuncio eliminato con successo'
        };
      } else {
        console.error('❌ Failed to delete announcement:', response.error);
        return {
          success: false,
          error: response.error || 'Errore durante l\'eliminazione dell\'annuncio'
        };
      }
    } catch (error) {
      console.error('❌ Error deleting announcement:', error);
      return {
        success: false,
        error: error.message || 'Errore durante l\'eliminazione dell\'annuncio'
      };
    }
  }

  // ✏️ AGGIORNA ANNUNCIO
  async updateAnnouncement(id, updateData) {
    try {
      console.log(`✏️ Updating announcement: ${id}`, updateData);
      
      const response = await apiClient.put(`/match-announcements/${id}`, updateData);
      
      if (response.success) {
        console.log('✅ Announcement updated successfully');
        return {
          success: true,
          data: response.data,
          message: response.message || 'Annuncio aggiornato con successo'
        };
      } else {
        console.error('❌ Failed to update announcement:', response.error);
        return {
          success: false,
          error: response.error || 'Errore durante l\'aggiornamento dell\'annuncio'
        };
      }
    } catch (error) {
      console.error('❌ Error updating announcement:', error);
      return {
        success: false,
        error: error.message || 'Errore durante l\'aggiornamento dell\'annuncio'
      };
    }
  }

  // 📦 ARCHIVIA ANNUNCIO
  async archiveAnnouncement(id) {
    try {
      console.log(`📦 Archiving announcement: ${id}`);
      
      const response = await apiClient.patch(`/match-announcements/${id}/archive`);
      
      if (response.success) {
        console.log('✅ Announcement archived successfully');
        return {
          success: true,
          message: response.message || 'Annuncio archiviato con successo'
        };
      } else {
        console.error('❌ Failed to archive announcement:', response.error);
        return {
          success: false,
          error: response.error || 'Errore durante l\'archiviazione dell\'annuncio'
        };
      }
    } catch (error) {
      console.error('❌ Error archiving announcement:', error);
      return {
        success: false,
        error: error.message || 'Errore durante l\'archiviazione dell\'annuncio'
      };
    }
  }

  // 🗑️ ELIMINA ANNUNCIO DEFINITIVAMENTE
  async deleteAnnouncement(id) {
    try {
      console.log(`🗑️ Permanently deleting announcement: ${id}`);
      
      const response = await apiClient.delete(`/match-announcements/${id}`);
      
      if (response.success) {
        console.log('✅ Announcement deleted permanently');
        return {
          success: true,
          message: response.message || 'Annuncio eliminato definitivamente'
        };
      } else {
        console.error('❌ Failed to delete announcement:', response.error);
        return {
          success: false,
          error: response.error || 'Errore durante l\'eliminazione dell\'annuncio'
        };
      }
    } catch (error) {
      console.error('❌ Error deleting announcement:', error);
      return {
        success: false,
        error: error.message || 'Errore durante l\'eliminazione dell\'annuncio'
      };
    }
  }
}

export default new MatchAnnouncementService(); 