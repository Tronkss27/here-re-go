import apiClient from './apiClient';
import { hotMatchesService } from './hotMatchesService';

// Funzione semplice per creare annunci
export const createMatchAnnouncement = async (data) => {
  try {
    const response = await apiClient.post('/match-announcements', data);
    
    // Invalida la cache delle hot matches dopo aver creato un annuncio
    hotMatchesService.invalidateCache();
    console.log('✅ Hot matches cache invalidated after announcement creation');
    
    return response.data;
  } catch (error) {
    console.error('❌ Error creating announcement:', error);
    throw error;
  }
};

// Ottieni annunci del venue corrente
export const getVenueAnnouncements = async (options = {}) => {
  try {
    const params = new URLSearchParams({
      status: 'published',
      limit: 20,
      page: 1,
      ...options
    });
    
    const response = await apiClient.get(`/match-announcements/venue?${params}`);
    return {
      success: true,
      data: response.data.data || response.data,
      pagination: response.data.pagination,
      stats: response.data.stats
    };
  } catch (error) {
    console.error('❌ Error getting venue announcements:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Errore durante il caricamento degli annunci',
      data: []
    };
  }
};

// Ottieni singolo annuncio
export const getAnnouncement = async (id) => {
  try {
    const response = await apiClient.get(`/match-announcements/${id}`);
    return {
      success: true,
      data: response.data.data || response.data
    };
  } catch (error) {
    console.error('❌ Error getting announcement:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Errore durante il caricamento dell\'annuncio'
    };
  }
};

// Aggiorna annuncio
export const updateAnnouncement = async (id, updates) => {
  try {
    const response = await apiClient.put(`/match-announcements/${id}`, updates);
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || 'Annuncio aggiornato con successo'
    };
  } catch (error) {
    console.error('❌ Error updating announcement:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Errore durante l\'aggiornamento dell\'annuncio'
    };
  }
};

// Archivia annuncio
export const archiveAnnouncement = async (id) => {
  try {
    const response = await apiClient.patch(`/match-announcements/${id}/archive`);
    return {
      success: true,
      message: response.data.message || 'Annuncio archiviato con successo'
    };
  } catch (error) {
    console.error('❌ Error archiving announcement:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Errore durante l\'archiviazione dell\'annuncio'
    };
  }
};

// Elimina annuncio
export const deleteAnnouncement = async (id) => {
  try {
    const response = await apiClient.delete(`/match-announcements/${id}`);
    return { success: true, message: 'Annuncio eliminato con successo' };
  } catch (error) {
    console.error('❌ Error deleting announcement:', error);
    return { success: false, error: 'Errore durante l\'eliminazione dell\'annuncio' };
  }
}; 