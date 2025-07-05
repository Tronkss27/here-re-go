import React, { useState, useEffect } from 'react';
import { Plus, Download, Calendar, Edit, Trash2, Eye, Archive, RotateCcw, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import matchAnnouncementService from '../../services/matchAnnouncementService';
import CreateMatchAnnouncementForm from '../../components/forms/CreateMatchAnnouncementForm';
import EditMatchAnnouncementModal from '../../components/forms/EditMatchAnnouncementModal';
import ViewAnnouncementModal from '../../components/ui/ViewAnnouncementModal';

// Definizione del tipo per un annuncio, basato sulla risposta API
interface Announcement {
  _id: string;
  match: {
    homeTeam: string;
    awayTeam: string;
    competition: {
      name: string;
      logo: string;
    };
    date: string;
    time: string;
  };
  status: 'published' | 'draft' | 'archived';
  views: number;
  clicks: number;
  eventDetails?: {
    description?: string;
    selectedOffers?: Array<{
      id: string;
      title: string;
      description: string;
    }>;
    atmosphere?: string;
    specialGuests?: string;
    foodAndDrinks?: string;
  };
  createdAt: string;
}

const CalendarioPartite = () => {
  const { user } = useAuth();
  const [showCreateMatchForm, setShowCreateMatchForm] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Funzione per caricare gli annunci dal backend
  const fetchAnnouncements = async () => {
    if (!user) {
      console.log('❌ No user found, skipping fetch');
      return;
    }
    
    setLoading(true);
    console.log('🔄 Starting fetchAnnouncements...');
    
    try {
      console.log('📞 Calling matchAnnouncementService.getVenueAnnouncements...');
      const result = await matchAnnouncementService.getVenueAnnouncements({ includeArchived: true });
      
      console.log('📊 Raw API Result:', result);
      console.log('📊 Result success:', result.success);
      console.log('📊 Result data:', result.data);
      console.log('📊 Result data type:', typeof result.data);
      console.log('📊 Result data length:', result.data?.length);
      
      if (result.success && result.data) {
        console.log(`✅ Success! Setting ${result.data.length} announcements`);
        setAnnouncements(result.data);
      } else {
        console.warn('⚠️ API call failed or no data:');
        console.warn('  - success:', result.success);
        console.warn('  - data:', result.data);
        console.warn('  - error:', result.error);
        setAnnouncements([]); // Assicurati che sia sempre un array
        showMessage(result.error || 'Errore durante il caricamento degli annunci.', 'error');
      }
    } catch (err) {
      console.error('💥 Exception in fetchAnnouncements:', err);
      setAnnouncements([]);
      showMessage('Errore durante il caricamento degli annunci.', 'error');
    } finally {
      setLoading(false);
      console.log('🏁 fetchAnnouncements completed');
    }
  };

  // Carica gli annunci al montaggio del componente
  useEffect(() => {
    fetchAnnouncements();
  }, [user]);

  // Mostra messaggio temporaneo
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Gestisce la creazione di un annuncio e aggiorna la lista
  const handleAnnouncementCreated = (creationResult: { success: boolean, data?: Announcement }) => {
    console.log('📢 Nuovo annuncio creato, analizzo il risultato:', creationResult);
    
    if (creationResult.success && creationResult.data) {
      showMessage('Annuncio partita pubblicato con successo!', 'success');
      // Ricarica la lista per mostrare il nuovo annuncio
      fetchAnnouncements();
    } else {
      showMessage('Errore: Annuncio creato ma dati di risposta non validi.', 'error');
    }
  };

  // Funzioni CRUD implementate
  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare DEFINITIVAMENTE questo annuncio? Questa azione non può essere annullata.')) {
      return;
    }
    
    console.log('🗑️ Permanently deleting announcement', id);
    
    try {
      const result = await matchAnnouncementService.deleteAnnouncement(id);
      
      if (result.success) {
        showMessage('Annuncio eliminato definitivamente!', 'success');
        fetchAnnouncements(); // Ricarica la lista
      } else {
        showMessage(result.error || 'Errore durante l\'eliminazione', 'error');
      }
    } catch (error) {
      console.error('❌ Error deleting announcement:', error);
      showMessage('Errore durante l\'eliminazione dell\'annuncio', 'error');
    }
  };

  const handleArchiveAnnouncement = async (id: string) => {
    if (!confirm('Sei sicuro di voler archiviare temporaneamente questo annuncio?')) {
      return;
    }
    
    console.log('📦 Archiving announcement', id);
    
    try {
      const result = await matchAnnouncementService.archiveAnnouncement(id);
      
      if (result.success) {
        showMessage('Annuncio archiviato temporaneamente!', 'success');
        fetchAnnouncements();
      } else {
        showMessage(result.error || 'Errore durante l\'archiviazione', 'error');
      }
    } catch (error) {
      console.error('❌ Error archiving announcement:', error);
      showMessage('Errore durante l\'archiviazione dell\'annuncio', 'error');
    }
  };

  const handleRestoreAnnouncement = async (id: string) => {
    if (!confirm('Sei sicuro di voler ripubblicare questo annuncio?')) {
      return;
    }
    
    console.log('🔄 Restoring announcement', id);
    
    try {
      const result = await matchAnnouncementService.updateAnnouncement(id, { 
        status: 'published',
        isActive: true 
      });
      
      if (result.success) {
        showMessage('Annuncio ripubblicato con successo!', 'success');
        fetchAnnouncements();
      } else {
        showMessage(result.error || 'Errore durante la ripubblicazione', 'error');
      }
    } catch (error) {
      console.error('❌ Error restoring announcement:', error);
      showMessage('Errore durante la ripubblicazione dell\'annuncio', 'error');
    }
  };

  const handleEditAnnouncement = (id: string) => {
    console.log('✏️ Editing announcement', id);
    setEditingAnnouncementId(id);
  };

  const handleEditSuccess = () => {
    showMessage('Annuncio modificato con successo!', 'success');
    fetchAnnouncements();
  };

  const handleViewAnnouncement = async (id: string) => {
    console.log('👁️ Viewing announcement', id);
    
    try {
      const result = await matchAnnouncementService.getAnnouncement(id);
      
      if (result.success && result.data) {
        console.log('✅ Announcement retrieved successfully:', result.data);
        setViewingAnnouncement(result.data);
      } else {
        showMessage(result.error || 'Errore durante il caricamento dei dettagli', 'error');
      }
    } catch (error) {
      console.error('❌ Error viewing announcement:', error);
      showMessage('Errore durante il caricamento dei dettagli', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="font-racing text-2xl text-fanzo-dark">CALENDARIO PARTITE</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowCreateMatchForm(true)}
            className="bg-fanzo-yellow hover:bg-fanzo-yellow/90 text-fanzo-dark"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crea Annuncio Partita
          </Button>
        </div>
      </div>

      {/* Messaggio feedback */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Lista Annunci */}
      <Card>
          <CardHeader>
          <CardTitle>I Tuoi Annunci Pubblicati</CardTitle>
          </CardHeader>
        <CardContent>
          {loading ? (
            <p>Caricamento annunci...</p>
          ) : !announcements || announcements.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun annuncio trovato</h3>
              <p className="mt-1 text-sm text-gray-500">Inizia creando il tuo primo annuncio di una partita.</p>
              </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card key={announcement._id} className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="font-bold text-lg">{new Date(announcement.match.date).toLocaleDateString('it-IT', { day: '2-digit' })}</div>
                      <div className="text-xs uppercase">{new Date(announcement.match.date).toLocaleDateString('it-IT', { month: 'short' })}</div>
              </div>
              <div>
                      <div className="font-semibold">{announcement.match.homeTeam} vs {announcement.match.awayTeam}</div>
                      <div className="text-sm text-gray-500">{announcement.match.competition.name} • {announcement.match.time}</div>
              </div>
            </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={announcement.status === 'published' ? 'default' : 'secondary'}>
                      {announcement.status}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Eye className="h-4 w-4 mr-1" /> {announcement.views}
                    </div>
                    <div className="flex items-center space-x-1">
              <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewAnnouncement(announcement._id)}
                        title="Visualizza dettagli"
              >
                        <Eye className="h-4 w-4 text-blue-500" />
              </Button>
              <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditAnnouncement(announcement._id)}
                        title="Modifica annuncio"
                      >
                        <Edit className="h-4 w-4 text-yellow-500" />
                      </Button>
                      {announcement.status === 'archived' ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRestoreAnnouncement(announcement._id)}
                          title="Ripubblica annuncio"
                        >
                          <RotateCcw className="h-4 w-4 text-green-500" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleArchiveAnnouncement(announcement._id)}
                          title="Archivia temporaneamente"
                        >
                          <Archive className="h-4 w-4 text-orange-500" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteAnnouncement(announcement._id)}
                        title="Elimina definitivamente"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
                  </div>
        </Card>
              ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Modale creazione annuncio */}
      {showCreateMatchForm && (
        <CreateMatchAnnouncementForm
          isOpen={showCreateMatchForm}
          onClose={() => setShowCreateMatchForm(false)}
          onSubmit={handleAnnouncementCreated}
        />
      )}

      {/* Modale modifica annuncio */}
      {editingAnnouncementId && (
        <EditMatchAnnouncementModal
          isOpen={!!editingAnnouncementId}
          onClose={() => setEditingAnnouncementId(null)}
          announcementId={editingAnnouncementId}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Modale visualizzazione dettagli annuncio */}
      <ViewAnnouncementModal
        isOpen={!!viewingAnnouncement}
        onClose={() => setViewingAnnouncement(null)}
        announcement={viewingAnnouncement}
      />
    </div>
  );
};

export default CalendarioPartite;
