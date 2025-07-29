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
import { getVenueAnnouncements } from '../services/matchAnnouncementService.js';
import apiClient from '../services/apiClient'; // Import apiClient

const VenueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  
  // 🎯 NUOVO: Stato per le partite pubblicate
  const [venueAnnouncements, setVenueAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  const { venue, loading, error } = useVenue(id);

  // 🎯 CARICO LE PARTITE PUBBLICATE DAL LOCALE - ENDPOINT PUBBLICO
  useEffect(() => {
    const loadVenueAnnouncements = async () => {
      if (!id || !venue) return;
      
      try {
        setAnnouncementsLoading(true);
        
        // 🎯 USO ENDPOINT PUBBLICO INSTEAD OF PROTECTED ENDPOINT
        const response = await apiClient.get('/match-announcements/search/public', {
          limit: 10,
          page: 1
        });
        
        if (response && Array.isArray(response)) {
          // Filtra solo gli annunci di questo venue
          const venueAnnouncements = response.filter(announcement => 
            announcement.venueId === id || 
            announcement.venue?._id === id ||
            announcement.venue?.id === id
          );
          
          setVenueAnnouncements(venueAnnouncements);
          console.log(`✅ Loaded ${venueAnnouncements.length} announcements for venue ${id} from ${response.length} total`);
        } else {
          console.error('❌ Unexpected response format:', response);
          setVenueAnnouncements([]);
        }
      } catch (error) {
        console.error('❌ Error in loadVenueAnnouncements:', error);
        setVenueAnnouncements([]);
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    loadVenueAnnouncements();
  }, [id, venue]); // Aggiungo venue come dependency

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

  const venueAddress = fullAddress.replace(/, [A-Z]{2}$/, ''); // Rimuove la città e il CAP dall'indirizzo

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {venue ? (
          <>
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                  {/* 🎯 NOME LOCALE PROMINENTE */}
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
                    {venue.name}
                  </h1>
                  
                  {/* 🎯 RATING E RECENSIONI */}
                  {venueData.rating && venueData.rating > 0 && (
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-5 w-5 ${i < Math.floor(venueData.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-gray-900">{venueData.rating.toFixed(1)}</span>
                      {venueData.totalReviews && (
                        <span className="text-sm text-gray-600">({venueData.totalReviews} recensioni)</span>
                      )}
                    </div>
                  )}
                  
                  {/* 🎯 INDIRIZZO */}
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{venueAddress}</span>
                  </div>
                </div>
              </div>

              {/* 🎯 CAROSELLO FOTO MIGLIORATO */}
              {venueData.images && venueData.images.length > 0 && (
                <div className="mb-8">
                  <div className="relative">
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={venueData.images[currentImageIndex] || '/placeholder.svg'}
                        alt={`${venueData.name} - Immagine ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
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
                          
                          {/* Indicatori */}
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {venueData.images.map((_: any, index: number) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Thumbnails */}
                    {venueData.images.length > 1 && (
                      <div className="flex space-x-2 mt-4 overflow-x-auto">
                        {venueData.images.map((image: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                              index === currentImageIndex ? 'border-orange-500' : 'border-gray-300'
                            }`}
                          >
                            <img
                              src={image || '/placeholder.svg'}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder.svg';
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={`grid gap-6 lg:gap-8 ${
                venueData.bookingSettings?.enabled 
                  ? 'grid-cols-1 lg:grid-cols-3' 
                  : 'grid-cols-1 max-w-4xl mx-auto'
              }`}>
                <div className={`space-y-6 lg:space-y-8 ${
                  venueData.bookingSettings?.enabled 
                    ? 'lg:col-span-2' 
                    : 'w-full'
                }`}>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-tight">
                      Descrizione
                    </h2>
                    {venueData.description ? (
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {venueData.description}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic">
                        Il locale non ha ancora aggiunto una descrizione.
                      </p>
                    )}
                  </div>

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

                    {/* 🎯 ORARI DI APERTURA - STILE ADMIN */}
                    {venueData.hours && (
                      <Card className="bg-white">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                            Orari di Apertura
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(venueData.hours).map(([day, hours]) => {
                              const dayLabels = {
                                monday: 'Lunedì',
                                tuesday: 'Martedì', 
                                wednesday: 'Mercoledì',
                                thursday: 'Giovedì',
                                friday: 'Venerdì',
                                saturday: 'Sabato',
                                sunday: 'Domenica'
                              };
                              
                              const isToday = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' }) === day;
                              const isClosed = hours?.closed || (!hours?.open && !hours?.close);
                              
                              return (
                                <div key={day} className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-20 font-semibold ${
                                      isToday ? 'text-orange-900' : 'text-gray-900'
                                    }`}>
                                      {dayLabels[day] || day}
                                    </div>
                                    {isToday && (
                                      <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-medium">
                                        Oggi
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {isClosed ? (
                                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-md font-medium text-sm">
                                        Chiuso
                                      </span>
                                    ) : (
                                      <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-md font-medium text-sm ${
                                          isToday ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                          {hours.open}
                                        </span>
                                        <span className="text-gray-500">-</span>
                                        <span className={`px-3 py-1 rounded-md font-medium text-sm ${
                                          isToday ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                          {hours.close}
                                        </span>
                                        {isToday && (
                                          <span className={`ml-2 text-xs font-medium ${
                                            (() => {
                                              const now = new Date();
                                              const currentTime = now.toTimeString().substring(0, 5);
                                              const isOpen = currentTime >= hours.open && currentTime <= hours.close;
                                              return isOpen ? 'text-green-600' : 'text-red-600';
                                            })()
                                          }`}>
                                            {(() => {
                                              const now = new Date();
                                              const currentTime = now.toTimeString().substring(0, 5);
                                              const isOpen = currentTime >= hours.open && currentTime <= hours.close;
                                              return isOpen ? '🟢 Aperto' : '🔴 Chiuso';
                                            })()}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
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

                {/* Sidebar - Solo se le prenotazioni sono abilitate */}
                {venueData.bookingSettings?.enabled && (
                  <div className="space-y-4 lg:space-y-6">
                    {/* Match Announcements */}
                  {venueData.announcements && venueData.announcements.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3 lg:pb-6">
                          <CardTitle className="text-lg lg:text-xl">Prossime partite</CardTitle>
                          <CardDescription className="text-sm lg:text-base">Partite in programma per i prossimi giorni</CardDescription>
                      </CardHeader>
                        <CardContent className="space-y-3 lg:space-y-4">
                        {venueData.announcements.slice(0, 3).map((announcement: any, index: number) => (
                            <div key={index} className="border-l-4 border-orange-500 pl-3 lg:pl-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 text-sm lg:text-base">{announcement.title}</h4>
                                  <p className="text-gray-600 text-xs lg:text-sm mt-1">{announcement.matchTime}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                  {announcement.league}
                              </Badge>
                            </div>
                            
                            {announcement.eventDetails?.selectedOffers && announcement.eventDetails.selectedOffers.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs lg:text-xs text-gray-500 mb-1">Offerte disponibili:</p>
                                <div className="flex flex-wrap gap-1">
                                  {announcement.eventDetails.selectedOffers.slice(0, 2).map((offer: any, offerIndex: number) => (
                                      <Badge key={offerIndex} variant="outline" className="text-xs">
                                        {offer.name}
                                      </Badge>
                                  ))}
                                  {announcement.eventDetails.selectedOffers.length > 2 && (
                                      <span className="text-xs text-gray-500">
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
                          disabled={!venueData.bookingSettings?.enabled}
                      >
                          {venueData.bookingSettings?.enabled ? 'Prenota ora' : 'Prenotazioni non disponibili'}
                      </Button>
                        {venueData.bookingSettings?.enabled && (
                      <p className="text-xs lg:text-xs text-center text-gray-500 mt-2">
                        ✓ Cancellazione flessibile
                      </p>
                    )}
                    </Card>
                  )}

                  {venueData.location?.coordinates && (
                    <div className="bg-gray-200 h-32 lg:h-48 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500 text-sm lg:text-base">Mappa non disponibile</p>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>

            {/* 🎯 SEZIONE PARTITE PUBBLICATE DAL LOCALE */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-tight">
                Partite in Programma
              </h2>
              
              {announcementsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Caricamento partite...</p>
                </div>
              ) : venueAnnouncements && venueAnnouncements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {venueAnnouncements.map((announcement: any, index: number) => (
                    <Card key={announcement._id || index} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">
                            {announcement.eventDetails?.title || 
                             `${announcement.match?.homeTeam || 'Team 1'} vs ${announcement.match?.awayTeam || 'Team 2'}`}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {announcement.match?.competition?.name || announcement.league || 'Calcio'}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{announcement.match?.date || announcement.eventDetails?.startDate}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{announcement.match?.time || announcement.eventDetails?.startTime}</span>
                            </div>
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {announcement.eventDetails?.description && (
                          <p className="text-gray-600 text-sm mb-3">
                            {announcement.eventDetails.description}
                          </p>
                        )}
                        {announcement.eventDetails?.selectedOffers && announcement.eventDetails.selectedOffers.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Offerte disponibili:</p>
                            <div className="flex flex-wrap gap-1">
                              {announcement.eventDetails.selectedOffers.map((offer: any, offerIndex: number) => (
                                <Badge key={offerIndex} variant="outline" className="text-xs">
                                  {offer.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {announcement.eventDetails?.capacity && (
                          <div className="flex items-center space-x-1 mt-3 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>Max {announcement.eventDetails.capacity} persone</span>
                          </div>
                        )}
                        {announcement.status && (
                          <div className="mt-3">
                            <Badge variant={announcement.status === 'published' ? 'default' : 'outline'} className="text-xs">
                              {announcement.status === 'published' ? 'Pubblicato' : 'In attesa'}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nessuna partita in programma al momento</p>
                  <p className="text-sm text-gray-400 mt-2">Torna presto per vedere le prossime partite!</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8 text-center">
              <p>Dettagli del locale non disponibili.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueDetail;
