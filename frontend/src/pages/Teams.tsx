import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  Bell, 
  BellOff, 
  Search, 
  Plus,
  Trash2,
  Heart,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';

const Teams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accesso richiesto
          </h2>
          <p className="text-gray-600 mb-4">
            Devi effettuare l'accesso per gestire le tue squadre preferite
          </p>
          <Button onClick={() => navigate('/login')}>
            Accedi
          </Button>
        </div>
      </div>
    );
  }

  // Dati mockup delle squadre preferite
  const favoriteTeams = [
    {
      id: 1,
      name: 'Inter',
      league: 'Serie A',
      logo: '⚫🔵',
      notifications: true,
      nextMatch: 'vs Juventus - Dom 15:00'
    },
    {
      id: 2,
      name: 'Manchester United',
      league: 'Premier League',
      logo: '🔴',
      notifications: true,
      nextMatch: 'vs Arsenal - Sab 17:30'
    },
    {
      id: 3,
      name: 'Real Madrid',
      league: 'La Liga',
      logo: '⚪',
      notifications: false,
      nextMatch: 'vs Barcelona - Ven 21:00'
    }
  ];

  const toggleNotifications = (teamId: number) => {
    // Logica per toggle notifiche
    console.log('Toggle notifications for team:', teamId);
  };

  const removeTeam = (teamId: number) => {
    // Logica per rimuovere squadra
    console.log('Remove team:', teamId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-kanit">
            Le mie squadre
          </h1>
          <p className="text-gray-600 font-kanit">
            Gestisci le tue squadre preferite e le notifiche partite
          </p>
        </div>

        {/* Search and Add Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-kanit">
              <Plus className="h-5 w-5 text-orange-600" />
              Aggiungi nuova squadra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cerca squadra per nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600">
                Cerca
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Squadre seguite</p>
                  <p className="text-2xl font-bold text-gray-900">{favoriteTeams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bell className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Notifiche attive</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {favoriteTeams.filter(team => team.notifications).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prossime partite</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Favorite Teams List */}
        <Card>
          <CardHeader>
            <CardTitle className="font-kanit">Le mie squadre preferite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {favoriteTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{team.logo}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 font-kanit">
                        {team.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {team.league}
                        </Badge>
                        {team.notifications && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            Notifiche ON
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {team.nextMatch}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleNotifications(team.id)}
                      className={team.notifications ? 'text-green-600' : 'text-gray-600'}
                    >
                      {team.notifications ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTeam(team.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {favoriteTeams.length === 0 && (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nessuna squadra aggiunta
                </h3>
                <p className="text-gray-600">
                  Inizia seguendo le tue squadre preferite per ricevere notifiche sui match
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-kanit">Impostazioni notifiche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Notifiche pre-partita</h4>
                  <p className="text-sm text-gray-600">Ricevi una notifica 2 ore prima del match</p>
                </div>
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Attiva
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Risultati partite</h4>
                  <p className="text-sm text-gray-600">Ricevi il risultato finale delle partite</p>
                </div>
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Attiva
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Nuove partite</h4>
                  <p className="text-sm text-gray-600">Notifica quando vengono aggiunte nuove partite</p>
                </div>
                <Button variant="outline" size="sm">
                  <BellOff className="h-4 w-4 mr-2" />
                  Disattiva
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Teams; 