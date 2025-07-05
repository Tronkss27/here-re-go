import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, TrendingUp, Users, Calendar, Plus, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { venueProfileService, statisticsService } from '@/services/venueService';
import CreateMatchAnnouncementForm from '@/components/forms/CreateMatchAnnouncementForm';

interface DashboardStats {
  views: number;
  clicks: number;
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
  };
  fixtures: {
    total: number;
    upcoming: number;
  };
  venue: {
    screens: number;
    sports: number;
  };
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [venueProfile, setVenueProfile] = useState<any>(null);
  const [showCreateMatchForm, setShowCreateMatchForm] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    views: 0,
    clicks: 0,
    bookings: { total: 0, confirmed: 0, pending: 0 },
    fixtures: { total: 0, upcoming: 0 },
    venue: { screens: 0, sports: 0 }
  });

  // Carica i dati del venue e calcola le statistiche
  useEffect(() => {
    if (user?.id) {
      // Carica sempre il profilo venue se disponibile, indipendentemente dall'onboarding
      const profile = venueProfileService.getProfile(user.id);
      setVenueProfile(profile);
      
      // Calcola le statistiche solo se l'onboarding è completato
      if (user.hasCompletedOnboarding) {
        const calculatedStats = statisticsService.calculateStatistics(user.id);
        setStats(calculatedStats);
      }
    }
  }, [user?.id, user.hasCompletedOnboarding]);

  // Gestisce i messaggi di successo dal routing
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Pulisce lo state per evitare che il messaggio persista
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Chiude il messaggio di successo dopo 5 secondi
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const venueName = venueProfile?.name || user?.venue?.name || 'Il tuo locale';

  const handleCreateMatchAnnouncement = (announcementData: any) => {
    console.log('📢 Annuncio partita creato:', announcementData);
    
    // Simula salvataggio
    setSuccessMessage('Annuncio partita pubblicato con successo! I tuoi clienti potranno vederlo sulla piattaforma.');
    
    // TODO: Integrare con il backend per salvare l'annuncio
    // TODO: Aggiornare le statistiche
    
    // Aggiorna le statistiche localmente per demo
    setStats(prev => ({
      ...prev,
      fixtures: {
        total: prev.fixtures.total + 1,
        upcoming: prev.fixtures.upcoming + 1
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
              <div>
          <h1 className="font-racing text-3xl text-fanzo-dark">
            BENVENUTO, {venueName.toUpperCase()}!
          </h1>
          <p className="font-kanit text-gray-600 mt-2">
            {user.hasCompletedOnboarding 
              ? 'Ecco una panoramica delle performance del tuo locale.'
              : 'Completa il tuo profilo per iniziare a utilizzare la piattaforma.'
            }
                </p>
              </div>
        {user.hasCompletedOnboarding && (
          <Button
            variant="outline"
            className="border-fanzo-teal text-fanzo-teal hover:bg-fanzo-teal hover:text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizza Profilo Pubblico
          </Button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800 font-kanit">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-kanit font-medium">
              Visualizzazioni
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-racing text-fanzo-dark">
              {user.hasCompletedOnboarding ? stats.views : '0'}
            </div>
            <p className="text-xs text-muted-foreground font-kanit">
              {user.hasCompletedOnboarding ? '+12% vs settimana scorsa' : 'Completa il profilo per iniziare'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-kanit font-medium">
              Click
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-racing text-fanzo-dark">
              {user.hasCompletedOnboarding ? stats.clicks : '0'}
              </div>
            <p className="text-xs text-muted-foreground font-kanit">
              {user.hasCompletedOnboarding ? '+8% vs settimana scorsa' : 'Nessun dato disponibile'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-kanit font-medium">
              Prenotazioni
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-racing text-fanzo-dark">
              {user.hasCompletedOnboarding ? stats.bookings.total : '0'}
            </div>
            <p className="text-xs text-muted-foreground font-kanit">
              {user.hasCompletedOnboarding 
                ? `${stats.bookings.confirmed} confermate, ${stats.bookings.pending} in attesa`
                : 'Nessuna prenotazione'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-kanit font-medium">
              Partite Pubblicate
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-racing text-fanzo-dark">
              {user.hasCompletedOnboarding ? stats.fixtures.total : '0'}
            </div>
            <p className="text-xs text-muted-foreground font-kanit">
              {user.hasCompletedOnboarding 
                ? `${stats.fixtures.upcoming} in programma`
                : 'Nessuna partita programma'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Only show if onboarding completed */}
      {user.hasCompletedOnboarding && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-racing text-xl text-fanzo-dark">
                AZIONI RAPIDE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-fanzo-yellow hover:bg-fanzo-yellow/90 text-fanzo-dark"
                onClick={() => setShowCreateMatchForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crea Annuncio Partita
              </Button>
              <Button 
                variant="outline"
                className="w-full border-fanzo-yellow text-fanzo-dark hover:bg-fanzo-yellow/20"
                onClick={() => window.location.href = '/admin/calendario'}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Vai al Calendario Partite
              </Button>
              <Button 
                variant="outline"
                className="w-full border-fanzo-teal text-fanzo-teal hover:bg-fanzo-teal hover:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Gestisci Prenotazioni
              </Button>
              <Button 
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Impostazioni Locale
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-racing text-xl text-fanzo-dark">
                INFORMAZIONI VENUE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-kanit text-gray-600">Schermi:</span>
                <span className="font-kanit font-semibold">{stats.venue.screens}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-kanit text-gray-600">Sport seguiti:</span>
                <span className="font-kanit font-semibold">{stats.venue.sports}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-kanit text-gray-600">Status:</span>
                <span className="font-kanit font-semibold text-green-600">Attivo</span>
              </div>
            </CardContent>
          </Card>

        <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-racing text-xl text-fanzo-dark">
                PROSSIMI EVENTI
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.fixtures.upcoming > 0 ? (
                <p className="font-kanit text-gray-600">
                  Hai {stats.fixtures.upcoming} partite in programma.
                </p>
              ) : (
                <div className="text-center py-4">
                  <Calendar className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="font-kanit text-gray-600 text-sm">
                    Nessuna partita in programma
                </p>
                <Button 
                    className="mt-2 bg-fanzo-yellow hover:bg-fanzo-yellow/90 text-fanzo-dark text-sm"
                    onClick={() => setShowCreateMatchForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crea Annuncio
                </Button>
              </div>
              )}
          </CardContent>
        </Card>
      </div>
      )}

      {/* Create Match Announcement Form Modal */}
      <CreateMatchAnnouncementForm
        isOpen={showCreateMatchForm}
        onClose={() => setShowCreateMatchForm(false)}
        onSubmit={handleCreateMatchAnnouncement}
      />
    </div>
  );
};

export default AdminDashboard;
