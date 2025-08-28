import React, { useState, useEffect } from 'react';
import { Plus, Download, Calendar, Edit, Trash2, Eye, Archive, RotateCcw, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { getVenueAnnouncements, deleteAnnouncement, getAnnouncement, updateAnnouncement, archiveAnnouncement } from '../../services/matchAnnouncementService';
import SimpleCreateAnnouncementForm from '../../components/forms/SimpleCreateAnnouncementForm';
// import EditMatchAnnouncementModal from '../../components/forms/EditMatchAnnouncementModal'; // TEMPORANEO  
// import ViewAnnouncementModal from '../../components/ui/ViewAnnouncementModal'; // TEMPORANEO

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
  const [syncing, setSyncing] = useState(false);
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
          console.log('📞 Calling getVenueAnnouncements...');
    const result = await getVenueAnnouncements({ includeArchived: true });
      
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
  const handleAnnouncementCreated = (creationResult: any) => {
    console.log('📢 Nuovo annuncio creato, analizzo il risultato:', creationResult);
    
    // Se il risultato ha un ID, significa che è stato creato con successo
    if (creationResult && (creationResult._id || creationResult.id)) {
      showMessage('Annuncio partita pubblicato con successo!', 'success');
      // Ricarica la lista per mostrare il nuovo annuncio
      fetchAnnouncements();
    } else if (creationResult && creationResult.success && creationResult.data) {
      // Fallback per struttura legacy
      showMessage('Annuncio partita pubblicato con successo!', 'success');
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
      const result = await deleteAnnouncement(id);
      
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
      const result = await archiveAnnouncement(id);
      
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
      const result = await updateAnnouncement(id, { 
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
    // 🎯 RIATTIVATO: Ora apre il prompt di modifica semplice
    const newDescription = prompt('Inserisci una nuova descrizione per questo annuncio:');
    if (newDescription !== null) {
      handleUpdateAnnouncement(id, { 'eventDetails.description': newDescription });
    }
  };

  const handleUpdateAnnouncement = async (id: string, updates: any) => {
    try {
      const result = await updateAnnouncement(id, updates);
      
      if (result.success) {
        showMessage('Annuncio modificato con successo!', 'success');
        fetchAnnouncements();
      } else {
        showMessage(result.error || 'Errore durante la modifica', 'error');
      }
    } catch (error) {
      console.error('❌ Error updating announcement:', error);
      showMessage('Errore durante la modifica dell\'annuncio', 'error');
    }
  };

  const handleEditSuccess = () => {
    showMessage('Annuncio modificato con successo!', 'success');
    fetchAnnouncements();
  };

  const handleViewAnnouncement = async (id: string) => {
    console.log('👁️ Viewing announcement', id);
    
    try {
      const result = await getAnnouncement(id);
      
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

  // Funzione per sincronizzare partite dalla API sportiva
  const handleSyncFixtures = async () => {
    setSyncing(true);
    console.log('🔄 Sincronizzando partite dalla API sportiva...');
    
    try {
      const response = await fetch('/api/fixtures/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dateRange: 30 }) // Prossimi 30 giorni
      });
      
      const result = await response.json();
      
      if (result.success) {
        showMessage(
          `Sincronizzazione completata! ${result.created} partite create, ${result.updated} aggiornate`, 
          'success'
        );
        // Le partite sincronizzate sono PopularMatch, non annunci diretti
        // Ma è utile ricaricare per vedere eventuali nuove opzioni
        console.log('✅ Sync results:', result);
      } else {
        showMessage(result.message || 'Errore durante la sincronizzazione', 'error');
      }
    } catch (error) {
      console.error('❌ Error syncing fixtures:', error);
      showMessage('Errore durante la sincronizzazione delle partite', 'error');
    } finally {
      setSyncing(false);
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
      <SimpleCreateAnnouncementForm
        isOpen={showCreateMatchForm}
        onClose={() => setShowCreateMatchForm(false)}
        onSubmit={handleAnnouncementCreated}
      />

      {/* {editingAnnouncementId && (
        <EditMatchAnnouncementModal
          isOpen={!!editingAnnouncementId}
          onClose={() => setEditingAnnouncementId(null)}
          announcementId={editingAnnouncementId}
          onSuccess={handleEditSuccess}
        />
      )} */}

      {/* 🎯 MODALE VISUALIZZA DETTAGLI SEMPLICE */}
      {viewingAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Dettagli Annuncio</h3>
                <Button variant="ghost" size="sm" onClick={() => setViewingAnnouncement(null)}>
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <strong>Partita:</strong> {viewingAnnouncement.match?.homeTeam} vs {viewingAnnouncement.match?.awayTeam}
                </div>
                <div>
                  <strong>Data:</strong> {viewingAnnouncement.match?.date} - {viewingAnnouncement.match?.time}
                </div>
                <div>
                  <strong>Competizione:</strong> {viewingAnnouncement.match?.competition?.name}
                </div>
                <div>
                  <strong>Status:</strong> <Badge>{viewingAnnouncement.status}</Badge>
                </div>
                <div>
                  <strong>Visualizzazioni:</strong> {viewingAnnouncement.views}
                </div>
                <div>
                  <strong>Click:</strong> {viewingAnnouncement.clicks}
                </div>
                {viewingAnnouncement.eventDetails?.description && (
                  <div>
                    <strong>Descrizione:</strong>
                    <p className="mt-1 text-gray-600">{viewingAnnouncement.eventDetails.description}</p>
                  </div>
                )}
                {viewingAnnouncement.eventDetails?.selectedOffers && viewingAnnouncement.eventDetails.selectedOffers.length > 0 && (
                  <div>
                    <strong>Offerte:</strong>
                    <ul className="mt-1 space-y-1">
                      {viewingAnnouncement.eventDetails.selectedOffers.map((offer: any, index: number) => (
                        <li key={index} className="text-gray-600">• {offer.title}: {offer.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setViewingAnnouncement(null)}>
                  Chiudi
                </Button>
                <Button onClick={() => handleEditAnnouncement(viewingAnnouncement._id)}>
                  Modifica
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioPartite;
