import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Heart, 
  Settings, 
  BookOpen,
  Star,
  MapPin,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ClientLandingSection = () => {
  const { user, isAuthenticated } = useAuth();

  // Non mostrare la sezione se l'utente non è autenticato o non è un client
  if (!isAuthenticated || !user || user.role !== 'client') {
    return null;
  }

  const quickActions = [
    {
      title: 'Il Mio Profilo',
      description: 'Gestisci le tue informazioni personali',
      icon: User,
      link: '/profile',
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Le Mie Prenotazioni',
      description: 'Visualizza e gestisci le tue prenotazioni',
      icon: Calendar,
      link: '/bookings',
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Locali Preferiti',
      description: 'I tuoi sport bar del cuore',
      icon: Heart,
      link: '/favorites',
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600'
    },
    {
      title: 'Squadre Preferite',
      description: 'Gestisci le tue squadre e notifiche',
      icon: Star,
      link: '/teams',
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600'
    }
  ];

  return (
    <section className="bg-gradient-to-br from-orange-50 to-orange-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 font-kanit">
            Ciao, {user.name}! 👋
          </h2>
          <p className="text-lg text-gray-600 font-kanit">
            Benvenuto nella tua area personale SPOrTS
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Prossime prenotazioni</p>
                <p className="text-xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Locali preferiti</p>
                <p className="text-xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Squadre seguite</p>
                <p className="text-xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Link key={index} to={action.link} className="group">
                <Card className={`${action.color} hover:shadow-lg transition-all duration-300 border-2 group-hover:scale-105`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-white rounded-full mb-4 shadow-sm">
                        <IconComponent className={`h-6 w-6 ${action.iconColor}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 font-kanit">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {action.description}
                      </p>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity Section */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-kanit">
              <Clock className="h-5 w-5 text-orange-600" />
              Attività Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Prenotazione confermata</p>
                  <p className="text-sm text-gray-600">The Queen's Head - Oggi alle 20:00</p>
                </div>
                <span className="text-xs text-gray-500">2h fa</span>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Heart className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Nuovo locale aggiunto ai preferiti</p>
                  <p className="text-sm text-gray-600">Sports Café Milano</p>
                </div>
                <span className="text-xs text-gray-500">1g fa</span>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Nuova partita della tua squadra</p>
                  <p className="text-sm text-gray-600">Inter vs Juventus - Dom 15:00</p>
                </div>
                <span className="text-xs text-gray-500">3g fa</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                <BookOpen className="h-4 w-4 mr-2" />
                Vedi tutte le attività
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Booking CTA */}
        <div className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2 font-kanit">Pronto per la prossima partita?</h3>
          <p className="mb-4 opacity-90">Trova il locale perfetto per guardare il tuo match preferito</p>
          <Link to="/locali">
            <Button className="bg-white text-orange-600 hover:bg-gray-100">
              <MapPin className="h-4 w-4 mr-2" />
              Trova Locali
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ClientLandingSection; 