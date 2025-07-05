import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Trophy, Users, MapPin, X, Plus, Star, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { venueProfileService } from '@/services/venueService';
import matchAnnouncementService from '@/services/matchAnnouncementService';
import ManualMatchForm from './ManualMatchForm';

interface Competition {
  id: string;
  name: string;
  sport: string;
  priority: 'high' | 'medium' | 'low';
  logo: string;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: Competition;
  date: string;
  time: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  isLive: boolean;
  venue?: string;
}

interface EventDetails {
  matchId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  description: string;
  selectedOffers: EventOffer[];
}

interface EventOffer {
  id: string;
  title: string;
  description: string;
  timeframe?: string;
  isTemplate?: boolean;
}

interface CreateMatchAnnouncementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateMatchAnnouncementForm: React.FC<CreateMatchAnnouncementFormProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'search' | 'details' | 'offers' | 'preview'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [userPreferences, setUserPreferences] = useState<Competition[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    matchId: '',
    startDate: '',
    startTime: '',
    endTime: '',
    description: '',
    selectedOffers: []
  });

  // Mock data per competitions calcistiche
  const mockCompetitions: Competition[] = [
    { id: 'champions', name: 'Champions League', sport: 'football', priority: 'high', logo: '🏆' },
    { id: 'serie-a', name: 'Serie A', sport: 'football', priority: 'high', logo: '⚽' },
    { id: 'world-cup', name: 'FIFA World Cup', sport: 'football', priority: 'high', logo: '🌍' },
    { id: 'premier', name: 'Premier League', sport: 'football', priority: 'medium', logo: '🇬🇧' },
    { id: 'bundesliga', name: 'Bundesliga', sport: 'football', priority: 'medium', logo: '🇩🇪' },
    { id: 'laliga', name: 'La Liga', sport: 'football', priority: 'medium', logo: '🇪🇸' },
    { id: 'europa', name: 'Europa League', sport: 'football', priority: 'medium', logo: '🏅' },
    { id: 'ligue1', name: 'Ligue 1', sport: 'football', priority: 'low', logo: '🇷🇴' }
  ];

  const getFutureDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const mockMatches: Match[] = [
    {
      id: '101',
      homeTeam: 'Lazio',
      awayTeam: 'Roma',
      competition: mockCompetitions[1], // Serie A
      date: getFutureDate(1),
      time: '20:45',
      homeTeamLogo: '🦅',
      awayTeamLogo: '🐺',
      isLive: false
    },
    {
      id: '102',
      homeTeam: 'Arsenal',
      awayTeam: 'Tottenham',
      competition: mockCompetitions[3], // Premier League
      date: getFutureDate(2),
      time: '17:30',
      homeTeamLogo: '🔴',
      awayTeamLogo: '⚪',
      isLive: false
    },
    {
      id: '103',
      homeTeam: 'Paris SG',
      awayTeam: 'Monaco',
      competition: mockCompetitions[7], // Ligue 1
      date: getFutureDate(3),
      time: '21:00',
      homeTeamLogo: '🔵🔴',
      awayTeamLogo: '🔴⚪',
      isLive: false
    },
    {
      id: '104',
      homeTeam: 'Atletico Madrid',
      awayTeam: 'Sevilla',
      competition: mockCompetitions[5], // La Liga
      date: getFutureDate(4),
      time: '18:30',
      homeTeamLogo: '🔴⚪',
      awayTeamLogo: '⚪🔴',
      isLive: false
    },
    {
      id: '105',
      homeTeam: 'Ajax',
      awayTeam: 'Feyenoord',
      competition: { id: 'eredivisie', name: 'Eredivisie', sport: 'football', priority: 'low', logo: '🇳🇱' },
      date: getFutureDate(5),
      time: '16:45',
      homeTeamLogo: '⚪🔴',
      awayTeamLogo: '🔴⚪⚫',
      isLive: false
    },
    {
      id: '1',
      homeTeam: 'Juventus',
      awayTeam: 'Inter',
      competition: mockCompetitions[1],
      date: '2025-01-20',
      time: '20:45',
      homeTeamLogo: '⚪⚫',
      awayTeamLogo: '🔵⚫',
      isLive: false
    },
    {
      id: '5',
      homeTeam: 'Bayern Munich',
      awayTeam: 'Borussia Dortmund',
      competition: mockCompetitions[4],
      date: '2025-01-24',
      time: '18:30',
      homeTeamLogo: '🔴⚪',
      awayTeamLogo: '🟡⚫',
      isLive: false
    }
  ];

  // Template offerte predefiniti (zero liability)
  const offerTemplates: EventOffer[] = [
    {
      id: 'happy-hour',
      title: 'Happy Hour',
      description: 'Sconto 20% su tutte le bevande',
      timeframe: '17:00-19:00',
      isTemplate: true
    },
    {
      id: 'aperitivo-partita',
      title: 'Aperitivo + Partita',
      description: 'Aperitivo completo a prezzo fisso',
      timeframe: 'Durante la partita',
      isTemplate: true
    },
    {
      id: 'pizza-birra',
      title: 'Pizza + Birra Combo',
      description: 'Pizza + Birra media a prezzo speciale',
      timeframe: 'Tutta la serata',
      isTemplate: true
    },
    {
      id: 'gruppo-sconto',
      title: 'Sconto Gruppo',
      description: 'Sconto per gruppi da 4+ persone',
      timeframe: 'Su prenotazione',
      isTemplate: true
    }
  ];

  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State per offerta personalizzata
  const [customOffer, setCustomOffer] = useState({
    title: '',
    description: '',
    timeframe: ''
  });

  // Carica le preferenze dell'utente dalle competizioni favorite nell'onboarding
  useEffect(() => {
    if (user) {
      const profile = venueProfileService.getProfile(user.id);
      if (profile?.favouriteSports) {
        // Mappa le competizioni favorite alle priorità
        const favoriteCompetitions = mockCompetitions.filter(comp => 
          ['champions', 'serie-a', 'world-cup'].includes(comp.id)
        );
        setUserPreferences(favoriteCompetitions);
      } else {
        // Default per demo: Champions, Serie A, World Cup
        setUserPreferences(mockCompetitions.slice(0, 3));
      }
    }
  }, [user]);

  // Filtra le partite in base alla ricerca e alla competizione selezionata
  const filteredMatches = matches.filter(match => {
    const matchesSearch = searchQuery === '' || 
      match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.competition.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCompetition = selectedCompetition === 'all' || 
      match.competition.id === selectedCompetition;
    
    return matchesSearch && matchesCompetition;
  });

  // Ordina le partite per priorità delle competizioni preferite
  const sortedMatches = filteredMatches.sort((a, b) => {
    const aIsFavorite = userPreferences.some(pref => pref.id === a.competition.id);
    const bIsFavorite = userPreferences.some(pref => pref.id === b.competition.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // Ordina per data se entrambe hanno la stessa priorità
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const handleMatchSelect = (match: Match) => {
    setSelectedMatch(match);
    setEventDetails(prev => ({
      ...prev,
      matchId: match.id,
      startDate: match.date,
      startTime: match.time,
      endTime: calculateEndTime(match.time),
      description: `Guarda ${match.homeTeam} vs ${match.awayTeam} nel nostro locale! Atmosfera garantita per questa partita di ${match.competition.name}.`
    }));
    setCurrentStep('details');
  };

  const handleManualSubmit = (manualData: Omit<Match, 'id' | 'homeTeamLogo' | 'awayTeamLogo' | 'isLive'>) => {
    const manualMatch: Match = {
      id: `manual_${Date.now()}`,
      ...manualData,
      homeTeamLogo: '🏠',
      awayTeamLogo: '✈️',
      isLive: false,
    };
    setShowManualForm(false);
    handleMatchSelect(manualMatch);
  };

  const calculateEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 2; // Durata media partita + extra time
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleAddCustomOffer = () => {
    // Validazione campi obbligatori
    if (!customOffer.title.trim() || !customOffer.description.trim()) {
      alert('Titolo e descrizione sono obbligatori per l\'offerta personalizzata');
      return;
    }

    // Crea nuova offerta personalizzata
    const newOffer: EventOffer = {
      id: `custom_${Date.now()}`,
      title: customOffer.title.trim(),
      description: customOffer.description.trim(),
      timeframe: customOffer.timeframe.trim() || 'Durante l\'evento',
      isTemplate: false
    };

    // Aggiungi alle offerte selezionate
    setEventDetails(prev => ({
      ...prev,
      selectedOffers: [...prev.selectedOffers, newOffer]
    }));

    // Reset form offerta personalizzata
    setCustomOffer({
      title: '',
      description: '',
      timeframe: ''
    });

    console.log('✅ Offerta personalizzata aggiunta:', newOffer);
  };

  const handleSubmit = async () => {
    if (!selectedMatch) return;

    const eventDetailsData: Partial<EventDetails> = {
      startDate: eventDetails.startDate,
      startTime: eventDetails.startTime,
      endTime: eventDetails.endTime,
      description: eventDetails.description
    };
    
    // Includi selectedOffers solo se non è vuoto
    if (eventDetails.selectedOffers && eventDetails.selectedOffers.length > 0) {
      eventDetailsData.selectedOffers = eventDetails.selectedOffers;
    }

    const announcementData = {
      match: selectedMatch,
      eventDetails: eventDetailsData
    };
    
    try {
      console.log('🚀 Submitting announcement to backend:', announcementData);
      
      const result = await matchAnnouncementService.createAnnouncement(announcementData);
      
      if (result.success) {
        console.log('✅ Announcement created successfully:', result);
        onSubmit(result);
        onClose();
        
        // Reset form
        setCurrentStep('search');
        setSelectedMatch(null);
        setSearchQuery('');
        setSelectedCompetition('all');
        setShowManualForm(false);
        setEventDetails({
          matchId: '',
          startDate: '',
          startTime: '',
          endTime: '',
          description: '',
          selectedOffers: []
        });
        setCustomOffer({
          title: '',
          description: '',
          timeframe: ''
        });
      } else {
        console.error('❌ Error creating announcement:', result);
        if (result.status === 409) {
          alert('Annuncio duplicato: esiste già un annuncio per questa partita in questa data.');
        } else {
          alert(`Errore durante la creazione dell'annuncio: ${result.error || 'Errore sconosciuto'}`);
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      alert(`Errore imprevisto: ${error instanceof Error ? error.message : 'Dettagli nella console.'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-fanzo-dark text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="font-racing text-2xl">CREA ANNUNCIO PARTITA</h2>
            <p className="text-fanzo-gray text-sm mt-1">
              {currentStep === 'search' && 'Seleziona la partita da pubblicizzare'}
              {currentStep === 'details' && 'Configura i dettagli dell\'evento'}
              {currentStep === 'offers' && 'Aggiungi offerte speciali (opzionale)'}
              {currentStep === 'preview' && 'Anteprima e conferma'}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Step 1: Ricerca e Selezione Partita */}
          {currentStep === 'search' && (
            <div className="space-y-6">
              {/* User Preferences Header */}
              {userPreferences.length > 0 && (
                <div className="bg-fanzo-yellow/10 border border-fanzo-yellow/30 rounded-lg p-4">
                  <h3 className="font-semibold text-fanzo-dark mb-2 flex items-center">
                    <Star className="h-4 w-4 mr-2 text-fanzo-yellow" />
                    Le tue competizioni preferite
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences.map(comp => (
                      <Badge key={comp.id} variant="secondary" className="bg-fanzo-yellow/20">
                        {comp.logo} {comp.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cerca squadre, competizioni..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Competition Filter */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCompetition === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCompetition('all')}
                    className="text-xs"
                  >
                    Tutte
                  </Button>
                  {mockCompetitions.map(comp => (
                    <Button
                      key={comp.id}
                      variant={selectedCompetition === comp.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCompetition(comp.id)}
                      className="text-xs"
                    >
                      {comp.logo} {comp.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Matches List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Partite nelle prossime 2 settimane</h3>
                {sortedMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Nessuna partita trovata</p>
                    <Button
                      onClick={() => setShowManualForm(true)}
                      variant="outline"
                      className="border-fanzo-teal text-fanzo-teal"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crea partita manualmente
                    </Button>
                  </div>
                ) : (
                  <>
                    {sortedMatches.map(match => {
                      const isFavorite = userPreferences.some(pref => pref.id === match.competition.id);
                      return (
                        <Card 
                          key={match.id} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isFavorite ? 'border-fanzo-yellow/50 bg-fanzo-yellow/5' : ''
                          }`}
                          onClick={() => handleMatchSelect(match)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {/* Teams */}
                                <div className="flex items-center space-x-3">
                                  <div className="text-center">
                                    <div className="text-lg mb-1">{match.homeTeamLogo}</div>
                                    <div className="font-medium text-sm">{match.homeTeam}</div>
                                  </div>
                                  <div className="text-gray-400 font-bold">VS</div>
                                  <div className="text-center">
                                    <div className="text-lg mb-1">{match.awayTeamLogo}</div>
                                    <div className="font-medium text-sm">{match.awayTeam}</div>
                                  </div>
                                </div>

                                {/* Competition */}
                                <Badge variant="outline" className="ml-4">
                                  {match.competition.logo} {match.competition.name}
                                </Badge>
                                
                                {isFavorite && (
                                  <Star className="h-4 w-4 text-fanzo-yellow fill-current" />
                                )}
                              </div>

                              {/* Date & Time */}
                              <div className="text-right">
                                <div className="flex items-center text-sm text-gray-600 mb-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(match.date).toLocaleDateString('it-IT', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short'
                                  })}
                                </div>
                                <div className="flex items-center text-sm font-medium">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {match.time}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    {/* Manual Creation Option */}
                    <div className="text-center pt-4">
                      <Button
                        onClick={() => setShowManualForm(true)}
                        variant="outline"
                        className="border-fanzo-teal text-fanzo-teal"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Non trovi la partita? Creala manualmente
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Event Details */}
          {currentStep === 'details' && selectedMatch && (
            <div className="space-y-6">
              {/* Selected Match Summary */}
              <Card className="bg-fanzo-yellow/10 border-fanzo-yellow/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-lg">
                        {selectedMatch.homeTeamLogo} {selectedMatch.homeTeam} vs {selectedMatch.awayTeam} {selectedMatch.awayTeamLogo}
                      </div>
                      <Badge>{selectedMatch.competition.logo} {selectedMatch.competition.name}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(selectedMatch.date).toLocaleDateString('it-IT')} • {selectedMatch.time}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Configuration */}
              <div className="max-w-2xl mx-auto">
                {/* Date & Time */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Data e Orari
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="startDate">Data Evento</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={eventDetails.startDate}
                        onChange={(e) => setEventDetails(prev => ({...prev, startDate: e.target.value}))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="startTime">Orario Inizio</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={eventDetails.startTime}
                          onChange={(e) => setEventDetails(prev => ({...prev, startTime: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">Orario Fine</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={eventDetails.endTime}
                          onChange={(e) => setEventDetails(prev => ({...prev, endTime: e.target.value}))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrizione Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Descrivi l'atmosfera, i servizi disponibili, le offerte speciali..."
                    value={eventDetails.description}
                    onChange={(e) => setEventDetails(prev => ({...prev, description: e.target.value}))}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('search')}
                >
                  ← Indietro
                </Button>
                <Button
                  onClick={() => setCurrentStep('offers')}
                  className="bg-fanzo-yellow hover:bg-fanzo-yellow/90 text-fanzo-dark"
                >
                  Continua alle Offerte →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Offerte */}
          {currentStep === 'offers' && selectedMatch && (
            <div className="space-y-6">
              {/* Selected Match Summary */}
              <Card className="bg-fanzo-yellow/10 border-fanzo-yellow/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-lg">
                        {selectedMatch.homeTeamLogo} {selectedMatch.homeTeam} vs {selectedMatch.awayTeam} {selectedMatch.awayTeamLogo}
                      </div>
                      <Badge>{selectedMatch.competition.logo} {selectedMatch.competition.name}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(selectedMatch.date).toLocaleDateString('it-IT')} • {selectedMatch.time}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Disclaimer Zero-Liability */}
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-red-500 text-xl">⚠️</div>
                    <div>
                      <h4 className="font-bold text-red-800 mb-2">IMPORTANTE - Gestione Offerte</h4>
                      <p className="text-sm text-red-700 mb-2">
                        <strong>SPOrTS facilita solo la comunicazione delle offerte.</strong> La gestione, validazione e applicazione delle offerte è completamente a carico del locale.
                      </p>
                      <ul className="text-xs text-red-600 space-y-1">
                        <li>• Non forniamo sistemi di validazione o QR codes</li>
                        <li>• Le offerte sono collegate all'evento, non ai singoli clienti</li>
                        <li>• Il cliente dovrà presentarsi al locale e richiedere l'offerta</li>
                        <li>• Tutte le condizioni e limitazioni sono a discrezione del gestore</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Template Offerte Veloci */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🏷️ Template Offerte Veloci</CardTitle>
                  <p className="text-sm text-gray-600">Seleziona i template predefiniti più comuni</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {offerTemplates.map((template) => {
                      const isSelected = eventDetails.selectedOffers.some(offer => offer.id === template.id);
                      return (
                        <div
                          key={template.id}
                          onClick={() => {
                            if (isSelected) {
                              setEventDetails(prev => ({
                                ...prev,
                                selectedOffers: prev.selectedOffers.filter(offer => offer.id !== template.id)
                              }));
                            } else {
                              setEventDetails(prev => ({
                                ...prev,
                                selectedOffers: [...prev.selectedOffers, template]
                              }));
                            }
                          }}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-fanzo-yellow bg-fanzo-yellow/10' 
                              : 'border-gray-200 hover:border-fanzo-yellow/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{template.title}</h4>
                            <div className={`w-4 h-4 rounded border-2 ${
                              isSelected ? 'bg-fanzo-yellow border-fanzo-yellow' : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-full h-full bg-fanzo-yellow rounded"></div>}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{template.description}</p>
                          <p className="text-xs text-fanzo-teal font-medium">{template.timeframe}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Offerta Personalizzata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">➕ Crea Offerta Personalizzata</CardTitle>
                  <p className="text-sm text-gray-600">Aggiungi un'offerta specifica per questo evento</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customOfferTitle">Titolo Offerta</Label>
                      <Input
                        id="customOfferTitle"
                        placeholder="Es: Aperitivo Champions"
                        value={customOffer.title}
                        onChange={(e) => setCustomOffer(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customOfferTimeframe">Orario Validità</Label>
                      <Input
                        id="customOfferTimeframe"
                        placeholder="Es: 19:00-21:00"
                        value={customOffer.timeframe}
                        onChange={(e) => setCustomOffer(prev => ({ ...prev, timeframe: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="customOfferDescription">Descrizione</Label>
                    <Textarea
                      id="customOfferDescription"
                      placeholder="Descrivi l'offerta (es: Aperitivo completo + posto riservato per la partita)"
                      rows={2}
                      value={customOffer.description}
                      onChange={(e) => setCustomOffer(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-fanzo-teal text-fanzo-teal hover:bg-fanzo-teal hover:text-white"
                    onClick={handleAddCustomOffer}
                  >
                    + Aggiungi Offerta Personalizzata
                  </Button>
                </CardContent>
              </Card>

              {/* Anteprima Offerte Selezionate */}
              {eventDetails.selectedOffers.length > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800">✅ Offerte Selezionate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {eventDetails.selectedOffers.map((offer, index) => (
                        <div key={offer.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <span className="font-medium">{offer.title}</span>
                            <span className="text-sm text-gray-600 ml-2">({offer.timeframe})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEventDetails(prev => ({
                                ...prev,
                                selectedOffers: prev.selectedOffers.filter(o => o.id !== offer.id)
                              }));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('details')}
                >
                  ← Indietro
                </Button>
                <Button
                  onClick={() => setCurrentStep('preview')}
                  className="bg-fanzo-yellow hover:bg-fanzo-yellow/90 text-fanzo-dark"
                >
                  Anteprima Finale →
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 'preview' && selectedMatch && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Anteprima Annuncio</h3>
                <p className="text-gray-600">Ecco come apparirà il tuo annuncio ai clienti</p>
              </div>

              {/* Preview Card */}
              <Card className="max-w-2xl mx-auto border-2 border-fanzo-teal/30">
                <CardContent className="p-6">
                  {/* Match Header */}
                  <div className="text-center mb-6">
                    <Badge className="mb-2">{selectedMatch.competition.logo} {selectedMatch.competition.name}</Badge>
                    <div className="text-2xl font-bold flex items-center justify-center space-x-4">
                      <span>{selectedMatch.homeTeamLogo} {selectedMatch.homeTeam}</span>
                      <span className="text-fanzo-teal">VS</span>
                      <span>{selectedMatch.awayTeam} {selectedMatch.awayTeamLogo}</span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <Calendar className="h-5 w-5 mx-auto mb-1 text-fanzo-teal" />
                      <div className="font-semibold">{new Date(eventDetails.startDate).toLocaleDateString('it-IT')}</div>
                      <div className="text-sm text-gray-600">{eventDetails.startTime} - {eventDetails.endTime}</div>
                    </div>
                    <div className="text-center">
                      <Users className="h-5 w-5 mx-auto mb-1 text-fanzo-teal" />
                      <div className="font-semibold">Evento Speciale</div>
                      <div className="text-sm text-gray-600">
                        {eventDetails.selectedOffers.length > 0 
                          ? `${eventDetails.selectedOffers.length} offerte disponibili`
                          : 'Vieni a guardare la partita!'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {eventDetails.description && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Descrizione</h4>
                      <p className="text-sm text-gray-700">{eventDetails.description}</p>
                    </div>
                  )}

                  {/* Selected Offers */}
                  {eventDetails.selectedOffers.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">🏷️ Offerte Disponibili</h4>
                      <div className="space-y-2">
                        {eventDetails.selectedOffers.map((offer) => (
                          <div key={offer.id} className="bg-fanzo-yellow/10 p-2 rounded border border-fanzo-yellow/30">
                            <div className="font-medium text-sm">{offer.title}</div>
                            <div className="text-xs text-gray-600">{offer.description}</div>
                            <div className="text-xs text-fanzo-teal font-medium">{offer.timeframe}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-600">
                          ⚠️ Presentati al locale e richiedi le offerte direttamente al gestore
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Venue Info */}
                  <div className="border-t pt-4 text-center">
                    <MapPin className="h-4 w-4 inline mr-1 text-fanzo-teal" />
                    <span className="text-sm text-gray-600">
                      {user?.venue?.name || 'Il tuo locale'} • Prenota il tuo posto!
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('offers')}
                >
                  ← Modifica Offerte
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-fanzo-yellow hover:bg-fanzo-yellow/90 text-fanzo-dark px-8"
                >
                  🚀 Pubblica Annuncio
                </Button>
              </div>
            </div>
          )}

          {/* Manual Form Modal */}
          {showManualForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Crea Partita Manualmente
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManualForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ManualMatchForm onSubmit={handleManualSubmit} onCancel={() => setShowManualForm(false)} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateMatchAnnouncementForm; 