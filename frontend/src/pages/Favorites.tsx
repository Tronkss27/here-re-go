import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MapPin, 
  Star, 
  Calendar,
  Wifi,
  Car,
  Users,
  Eye,
  Trash2,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accesso richiesto
          </h2>
          <p className="text-gray-600 mb-4">
            Devi effettuare l'accesso per vedere i tuoi locali preferiti
          </p>
          <Button onClick={() => navigate('/login')}>
            Accedi
          </Button>
        </div>
      </div>
    );
  }

  // Dati mockup dei locali preferiti
  const favoriteVenues = [
    {
      id: 1,
      name: 'The Queen\'s Head',
      address: 'Via Brera 15, Milano',
      rating: 4.8,
      image: '/api/placeholder/300/200',
      amenities: ['Wi-Fi', 'Grande schermo', 'Prenotabile', 'Giardino'],
      description: 'Storico pub irlandese nel cuore di Brera',
      addedDate: '2025-01-15',
      lastVisit: '2025-01-20',
      distance: '1.2 km',
      type: 'pub'
    },
    {
      id: 2,
      name: 'Sports Café Milano',
      address: 'Corso Buenos Aires 42, Milano',
      rating: 4.6,
      image: '/api/placeholder/300/200',
      amenities: ['Schermo esterno', 'Pet friendly', 'Commentatore', 'Parcheggio'],
      description: 'Sport bar moderno con maxischermo HD',
      addedDate: '2025-01-10',
      lastVisit: null,
      distance: '2.8 km',
      type: 'sports_bar'
    },
    {
      id: 3,
      name: 'Birra & Calcio',
      address: 'Via Navigli 8, Milano',
      rating: 4.7,
      image: '/api/placeholder/300/200',
      amenities: ['Servi cibo', 'Wi-Fi', 'Grande schermo'],
      description: 'Atmosfera familiare sui Navigli',
      addedDate: '2025-01-05',
      lastVisit: '2025-01-18',
      distance: '3.5 km',
      type: 'restaurant'
    }
  ];

  const removeFavorite = (venueId: number) => {
    // Logica per rimuovere dai preferiti
    console.log('Remove favorite:', venueId);
  };

  const visitVenue = (venueId: number) => {
    navigate(`/locali/${venueId}`);
  };

  const bookVenue = (venueId: number) => {
    navigate(`/locali/${venueId}?action=book`);
  };

  const filteredVenues = favoriteVenues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         venue.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || venue.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-kanit">
            I miei locali preferiti
          </h1>
          <p className="text-gray-600 font-kanit">
            Gestisci i tuoi sport bar del cuore
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Totale preferiti</p>
                  <p className="text-2xl font-bold text-gray-900">{favoriteVenues.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Visite questo mese</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rating medio</p>
                  <p className="text-2xl font-bold text-gray-900">4.7</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Più vicino</p>
                  <p className="text-2xl font-bold text-gray-900">1.2 km</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cerca nei tuoi preferiti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterType('all')}
                  size="sm"
                >
                  Tutti
                </Button>
                <Button
                  variant={filterType === 'pub' ? 'default' : 'outline'}
                  onClick={() => setFilterType('pub')}
                  size="sm"
                >
                  Pub
                </Button>
                <Button
                  variant={filterType === 'sports_bar' ? 'default' : 'outline'}
                  onClick={() => setFilterType('sports_bar')}
                  size="sm"
                >
                  Sports Bar
                </Button>
                <Button
                  variant={filterType === 'restaurant' ? 'default' : 'outline'}
                  onClick={() => setFilterType('restaurant')}
                  size="sm"
                >
                  Ristoranti
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorites Grid */}
        {filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredVenues.map((venue) => (
              <Card key={venue.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white hover:bg-red-50 text-red-600"
                      onClick={() => removeFavorite(venue.id)}
                    >
                      <Heart className="h-4 w-4 mr-1 fill-current" />
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 font-kanit">
                        {venue.name}
                      </h3>
                      <p className="text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        {venue.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{venue.rating}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{venue.description}</p>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {venue.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>

                  {/* Info Row */}
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>Aggiunto: {new Date(venue.addedDate).toLocaleDateString('it-IT')}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {venue.distance}
                    </span>
                  </div>

                  {venue.lastVisit && (
                    <div className="text-sm text-green-600 mb-4">
                      Ultima visita: {new Date(venue.lastVisit).toLocaleDateString('it-IT')}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      onClick={() => bookVenue(venue.id)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Prenota
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => visitVenue(venue.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Dettagli
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2 font-kanit">
                {searchQuery || filterType !== 'all' ? 'Nessun risultato' : 'Nessun locale preferito'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filterType !== 'all' 
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia ad aggiungere i tuoi sport bar preferiti per trovarli qui'
                }
              </p>
              <Button 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => navigate('/locali')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Esplora Locali
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Favorites; 