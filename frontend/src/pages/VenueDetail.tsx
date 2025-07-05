import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVenue } from '../hooks/useVenues.js';
import Header from '../components/Header.tsx';
import BookingForm from '../components/BookingForm.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.tsx';
import { Button } from '../components/ui/button.tsx';
import { Badge } from '../components/ui/badge.tsx';
import { Star, MapPin, Phone, Clock, ChevronLeft, ChevronRight, ArrowLeft, Wifi, Monitor, Car, Users, Calendar, Eye } from 'lucide-react';
import matchVenueService from '../services/matchVenueService.js';

const VenueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const { venue, loading, error } = useVenue(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-red-600">Errore: {error}</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Dettagli del locale non disponibili.</p>
        </div>
      </div>
    );
  }

  // Cast venue to any to work with legacy structure
  const venueData = venue as any;

  const nextImage = () => {
    if (venueData.images && venueData.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % venueData.images.length);
    }
  };

  const prevImage = () => {
    if (venueData.images && venueData.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + venueData.images.length) % venueData.images.length);
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'wi-fi':
      case 'wifi':
        return <Wifi className="h-5 w-5 text-primary" />;
      case 'multiple screens':
      case 'grande schermo':
      case 'schermi':
        return <Monitor className="h-5 w-5 text-primary" />;
      case 'parking':
      case 'parcheggio':
        return <Car className="h-5 w-5 text-primary" />;
      case 'outdoor seating':
      case 'giardino':
        return <Users className="h-5 w-5 text-primary" />;
      default:
        return <Users className="h-5 w-5 text-primary" />;
    }
  };

  const formatOpeningHours = (openingHours: any) => {
    if (!openingHours) return null;
    
    const today = new Date().toLocaleDateString('it-IT', { weekday: 'long' });
    const todayKey = today.charAt(0).toUpperCase() + today.slice(1);
    const todayHours = openingHours[todayKey] || 'Non disponibile';
    
    return {
      today: todayHours,
      all: openingHours
    };
  };

  const openingInfo = venueData.openingHours ? formatOpeningHours(venueData.openingHours) : null;

  const fullAddress = venueData?.location?.address 
    ? `${venueData.location.address.street}, ${venueData.location.address.city}, ${venueData.location.address.postalCode}` 
    : 'Indirizzo non disponibile';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4 lg:mb-6">
          <span 
            onClick={() => navigate('/')}
            className="cursor-pointer hover:text-gray-700"
          >
            BarMatch
          </span>
          <span className="mx-2">›</span>
          <span 
            onClick={() => navigate('/venues')}
            className="cursor-pointer hover:text-gray-700"
          >
            Sport Bars
          </span>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">{venueData.name}</span>
        </nav>

        {/* Page Title and Rating */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{venueData.name}</h1>
              {venueData.rating && venueData.rating > 0 && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 lg:h-5 w-4 lg:w-5 ${i < Math.floor(venueData.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm lg:text-base font-medium text-gray-900">{venueData.rating.toFixed(1)}</span>
                  <span className="text-sm lg:text-base text-gray-600">({venueData.totalReviews || 0} recensioni)</span>
                </div>
              )}
              {fullAddress && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm lg:text-base">{fullAddress}</span>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 self-start sm:self-center"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm lg:text-base">Indietro</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-tight">
                Chi Siamo
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {venueData.description}
              </p>
            </div>

            {venueData.images && venueData.images.length > 0 && (
              <div className="relative">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                  <img
                    src={venueData.images[currentImageIndex] || '/placeholder.svg'}
                    alt={`${venueData.name} - Immagine ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', (e.target as HTMLImageElement).src, e);
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  
                  {venueData.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                
                {venueData.images.length > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    {venueData.images.map((_: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {venueData.amenities && venueData.amenities.length > 0 && (
              <div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">Servizi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {venueData.amenities.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3 bg-white p-3 lg:p-4 rounded-lg border border-gray-200">
                      {getFeatureIcon(amenity)}
                      <span className="font-medium text-gray-700 text-sm lg:text-base">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Venue Information */}
            <div className="space-y-4 lg:space-y-6">
              {/* Contact Details */}
              <div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">Contatti e Informazioni</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                  {venueData.phone && (
                    <div className="flex items-center space-x-3 p-3 lg:p-4 bg-white rounded-lg border border-gray-200">
                      <Phone className="h-4 lg:h-5 w-4 lg:w-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm lg:text-base">Telefono</p>
                        <a href={`tel:${venueData.phone}`} className="text-orange-600 hover:text-orange-700 text-sm lg:text-base">
                          {venueData.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {venueData.website && (
                    <div className="flex items-center space-x-3 p-3 lg:p-4 bg-white rounded-lg border border-gray-200">
                      <svg className="h-4 lg:h-5 w-4 lg:w-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900 text-sm lg:text-base">Sito Web</p>
                        <a href={venueData.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 text-sm lg:text-base">
                          Visita il sito
                        </a>
                      </div>
                    </div>
                  )}
                  {fullAddress && (
                    <div className="flex items-start space-x-3 p-3 lg:p-4 bg-white rounded-lg border border-gray-200">
                      <MapPin className="h-4 lg:h-5 w-4 lg:w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm lg:text-base">Indirizzo</p>
                        <p className="text-gray-600 text-sm lg:text-base">{fullAddress}</p>
                        <button 
                          onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`, '_blank')} 
                          className="text-orange-600 hover:text-orange-700 text-xs lg:text-sm font-medium mt-1"
                        >
                          Apri in Google Maps
                        </button>
                      </div>
                    </div>
                  )}
                  {venueData.capacity && (
                    <div className="flex items-center space-x-3 p-3 lg:p-4 bg-white rounded-lg border border-gray-200">
                      <Users className="h-4 lg:h-5 w-4 lg:w-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm lg:text-base">Capacità</p>
                        <p className="text-gray-600 text-sm lg:text-base">{venueData.capacity} persone</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Opening Hours */}
              {venueData.openingHours && (
                <div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">Orari di Apertura</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4">
                      {Object.entries(venueData.openingHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <span className="font-medium text-gray-900 capitalize text-sm lg:text-base">
                            {day === 'monday' ? 'Lunedì' :
                             day === 'tuesday' ? 'Martedì' :
                             day === 'wednesday' ? 'Mercoledì' :
                             day === 'thursday' ? 'Giovedì' :
                             day === 'friday' ? 'Venerdì' :
                             day === 'saturday' ? 'Sabato' :
                             day === 'sunday' ? 'Domenica' : day}
                          </span>
                          <span className="text-gray-600 text-sm lg:text-base">
                            {typeof hours === 'string' ? hours : 
                             hours && typeof hours === 'object' && 'open' in hours && 'close' in hours 
                               ? `${hours.open} - ${hours.close}` 
                               : 'Chiuso'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Price Range and Cuisine */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {venueData.priceRange && (
                  <div>
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">Fascia di Prezzo</h3>
                    <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl lg:text-2xl">
                          {'€'.repeat(
                            venueData.priceRange === 'budget' ? 1 :
                            venueData.priceRange === 'mid-range' ? 2 :
                            venueData.priceRange === 'upscale' ? 3 : 2
                          )}
                        </span>
                        <span className="text-gray-600 text-sm lg:text-base">
                          {venueData.priceRange === 'budget' ? 'Economico' :
                           venueData.priceRange === 'mid-range' ? 'Medio' :
                           venueData.priceRange === 'upscale' ? 'Alto' : 'Medio'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {venueData.cuisine && venueData.cuisine.length > 0 && (
                  <div>
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">Cucina</h3>
                    <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-4">
                      <div className="flex flex-wrap gap-2">
                        {venueData.cuisine.map((cuisineType: string, index: number) => (
                          <span key={index} className="px-2 lg:px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs lg:text-sm font-medium">
                            {cuisineType}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews Summary */}
              {venueData.rating && venueData.rating > 0 && (
                <div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">Valutazioni</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <div className="text-3xl lg:text-4xl font-bold text-gray-900">{venueData.rating.toFixed(1)}</div>
                        <div className="flex items-center justify-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 lg:h-5 w-4 lg:w-5 ${i < Math.floor(venueData.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <p className="text-gray-600 mt-1 text-sm lg:text-base">su {venueData.totalReviews || 0} recensioni</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 mt-6 lg:mt-0 space-y-4 lg:space-y-6 sticky top-24">
            {/* Annunci Partite */}
            {venueData.announcements && venueData.announcements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <span>Partite in Programma</span>
                  </CardTitle>
                  <CardDescription>
                    Le prossime partite che puoi guardare qui
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {venueData.announcements.slice(0, 3).map((announcement: any, index: number) => (
                    <div key={announcement._id || index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900">
                            {announcement.match.homeTeam} vs {announcement.match.awayTeam}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {announcement.match.competition.name}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {new Date(announcement.match.date).toLocaleDateString('it-IT')}
                        </Badge>
                      </div>
                      
                      {announcement.eventDetails?.description && (
                        <p className="text-xs text-gray-600 mb-2">
                          {announcement.eventDetails.description}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{announcement.views || 0} visualizzazioni</span>
                        </span>
                        <span>
                          {announcement.match.time}
                        </span>
                      </div>
                      
                      {announcement.eventDetails?.selectedOffers && announcement.eventDetails.selectedOffers.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-1">Offerte speciali:</p>
                          <div className="flex flex-wrap gap-1">
                            {announcement.eventDetails.selectedOffers.slice(0, 2).map((offer: any, offerIndex: number) => (
                              <span key={offerIndex} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                {offer.title}
                              </span>
                            ))}
                            {announcement.eventDetails.selectedOffers.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{announcement.eventDetails.selectedOffers.length - 2} altre
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {venueData.announcements.length > 3 && (
                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        Vedi tutte le partite ({venueData.announcements.length})
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isBookingOpen ? (
              <Card>
                <CardHeader className="pb-3 lg:pb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg lg:text-xl">Prenota un tavolo - {venueData.name}</CardTitle>
                      <CardDescription className="text-sm lg:text-base">Compila i campi sottostanti.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsBookingOpen(false)} className="rounded-full h-8 w-8 flex-shrink-0">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <BookingForm 
                    venueId={venueData.id}
                    venueName={venueData.name}
                    onSuccess={() => {
                      // FIXED: Gestione super-sicura per evitare conflitti DOM
                      // Usa RequestAnimationFrame per garantire che React completi il rendering
                      requestAnimationFrame(() => {
                        setIsBookingOpen(false);
                      });
                    }}
                    onCancel={() => setIsBookingOpen(false)}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">Prenota un tavolo</h3>
                <p className="text-gray-600 mb-4 text-sm lg:text-base">
                  Prenota ora per assicurarti un posto durante le partite più importanti.
                </p>
                <Button 
                  className="w-full text-sm lg:text-base" 
                  onClick={() => setIsBookingOpen(true)}
                  disabled={!venueData.features?.includes('Prenotabile')}
                >
                  {venueData.features?.includes('Prenotabile') ? 'Prenota ora' : 'Prenotazioni non disponibili'}
                </Button>
                {venueData.features?.includes('Prenotabile') && (
                  <p className="text-xs lg:text-xs text-center text-gray-500 mt-2">
                    ✓ Cancellazione flessibile
                  </p>
                )}
              </Card>
            )}

            {venueData.location.coordinates && (
              <div className="bg-gray-200 h-32 lg:h-48 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 text-sm lg:text-base">Mappa non disponibile</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;
