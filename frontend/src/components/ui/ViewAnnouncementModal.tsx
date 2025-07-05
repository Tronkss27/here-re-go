import React from 'react';
import { X, Calendar, Clock, Eye, MousePointer, MapPin, Users, Star } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description: string;
}

interface Announcement {
  _id: string;
  match: {
    homeTeam: string;
    awayTeam: string;
    competition: {
      name: string;
      logo?: string;
    };
    date: string;
    time: string;
  };
  status: 'published' | 'draft' | 'archived';
  views: number;
  clicks: number;
  eventDetails?: {
    description?: string;
    selectedOffers?: Offer[];
    atmosphere?: string;
    specialGuests?: string;
    foodAndDrinks?: string;
  };
  createdAt: string;
}

interface ViewAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

const ViewAnnouncementModal: React.FC<ViewAnnouncementModalProps> = ({
  isOpen,
  onClose,
  announcement
}) => {
  if (!isOpen || !announcement) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Pubblicato';
      case 'draft': return 'Bozza';
      case 'archived': return 'Archiviato';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-fanzo-yellow" />
            <h2 className="text-xl font-bold text-fanzo-dark">Dettagli Annuncio</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Match Info */}
          <div className="bg-gradient-to-r from-fanzo-yellow/10 to-fanzo-yellow/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-fanzo-dark">
                {announcement.match.homeTeam} vs {announcement.match.awayTeam}
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(announcement.status)}`}>
                {getStatusText(announcement.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{formatDate(announcement.match.date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{announcement.match.time}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-gray-500" />
                <span>{announcement.match.competition.name}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Visualizzazioni</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{announcement.views}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <MousePointer className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">Click</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{announcement.clicks}</div>
            </div>
          </div>

          {/* Description */}
          {announcement.eventDetails?.description && (
            <div>
              <h4 className="font-semibold text-fanzo-dark mb-2">Descrizione</h4>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                {announcement.eventDetails.description}
              </p>
            </div>
          )}

          {/* Active Offers */}
          {announcement.eventDetails?.selectedOffers && announcement.eventDetails.selectedOffers.length > 0 && (
            <div>
              <h4 className="font-semibold text-fanzo-dark mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Offerte Attive ({announcement.eventDetails.selectedOffers.length})
              </h4>
              <div className="space-y-3">
                {announcement.eventDetails.selectedOffers.map((offer, index) => (
                  <div key={offer.id || index} className="border rounded-lg p-3 bg-fanzo-yellow/5 border-fanzo-yellow/20">
                    <div className="font-medium text-fanzo-dark mb-1">{offer.title}</div>
                    {offer.description && (
                      <div className="text-sm text-gray-600">{offer.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcement.eventDetails?.atmosphere && (
              <div>
                <h5 className="font-medium text-fanzo-dark mb-1">Atmosfera</h5>
                <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                  {announcement.eventDetails.atmosphere}
                </p>
              </div>
            )}
            
            {announcement.eventDetails?.specialGuests && (
              <div>
                <h5 className="font-medium text-fanzo-dark mb-1">Ospiti Speciali</h5>
                <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                  {announcement.eventDetails.specialGuests}
                </p>
              </div>
            )}
          </div>

          {announcement.eventDetails?.foodAndDrinks && (
            <div>
              <h5 className="font-medium text-fanzo-dark mb-1">Cibo e Bevande</h5>
              <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                {announcement.eventDetails.foodAndDrinks}
              </p>
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-4 border-t text-xs text-gray-500">
            <div>Creato il: {new Date(announcement.createdAt).toLocaleDateString('it-IT')} alle {new Date(announcement.createdAt).toLocaleTimeString('it-IT')}</div>
            <div>ID Annuncio: {announcement._id}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-fanzo-yellow hover:bg-fanzo-yellow/90 text-fanzo-dark rounded-lg font-medium transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAnnouncementModal; 