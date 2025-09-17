import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, TrendingUp, Users, Calendar, Plus, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { venueProfileService, statisticsService } from '@/services/venueService';
import adminVenueService from '@/services/adminVenueService';
import { analyticsService } from '@/services';
import SimpleCreateAnnouncementForm from '@/components/forms/SimpleCreateAnnouncementForm';

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

  // Carica profilo locale e statistiche (preferisci API analytics se disponibili)
  useEffect(() => {
    if (!user?.id) return;

    // Carica profilo locale (localStorage)
    const profile = venueProfileService.getProfile(user.id);
    setVenueProfile(profile);
    (async () => {
      // Ricava venueId: utente -> admin service -> profilo locale
      let venueId = user?.venue?.id || user?.venue?.backendId || profile?.backendId || '';
      if (!venueId) {
        try {
          const adminProfile = await adminVenueService.getVenueProfile();
          venueId = adminProfile?.backendId || venueId;
        } catch {
          // ignore, fallback sotto
        }
      }

      if (!venueId) {
        // Fallback locale
        const calculated = await statisticsService.calculateStatistics(user.id);
        setStats(calculated);
        return;
      }

      try {
        const res = await analyticsService.getOverview(venueId);
        const d = res?.data || {};
        setStats(prev => ({
          ...prev,
          views: d.views ?? 0,
          clicks: d.clicks ?? 0,
          bookings: {
            total: d.bookings?.total ?? 0,
            confirmed: d.bookings?.confirmed ?? 0,
            pending: d.bookings?.pending ?? 0
          },
          fixtures: {
            total: d.fixtures?.total ?? 0,
            upcoming: d.fixtures?.upcoming ?? 0
          },
          venue: prev.venue
        }));
      } catch (e) {
        const calculated = await statisticsService.calculateStatistics(user.id);
        setStats(calculated);
      }
    })();
  }, [user?.id, user?.venue?.id, user?.venue?.backendId, user.hasCompletedOnboarding]);

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
            Ecco una panoramica delle performance del tuo locale.
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

      {/* Dashboard Stats (mobile-first, 2x2) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2"><Eye className="h-5 w-5 text-primary" /></div>
              <div>
                <div className="font-racing text-xl">{stats.views}</div>
                <p className="text-xs text-muted-foreground font-kanit">Visualizzazioni</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2"><TrendingUp className="h-5 w-5 text-primary" /></div>
              <div>
                <div className="font-racing text-xl">{stats.clicks}</div>
                <p className="text-xs text-muted-foreground font-kanit">Click</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <div className="font-racing text-xl">{stats.bookings.total}</div>
                <p className="text-xs text-muted-foreground font-kanit">Prenotazioni</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2"><Calendar className="h-5 w-5 text-primary" /></div>
              <div>
                <div className="font-racing text-xl">{stats.fixtures.total}</div>
                <p className="text-xs text-muted-foreground font-kanit">Partite pubblicate</p>
              </div>
            </div>
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
      <SimpleCreateAnnouncementForm
        isOpen={showCreateMatchForm}
        onClose={() => setShowCreateMatchForm(false)}
        onSubmit={handleCreateMatchAnnouncement}
      />
    </div>
  );
};

export default AdminDashboard;
