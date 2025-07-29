import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Clock, Users, MapPin, Trophy, ChevronRight, ChevronLeft } from 'lucide-react';
import { createMatchAnnouncement } from '@/services/matchAnnouncementService';
import apiClient from '@/services/apiClient';

interface SimpleCreateAnnouncementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const SimpleCreateAnnouncementForm: React.FC<SimpleCreateAnnouncementFormProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [step, setStep] = useState(1); // 1: campionato, 2: partite, 3: dettagli
  const [selectedLeague, setSelectedLeague] = useState('');
  const [availableMatches, setAvailableMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [announcementData, setAnnouncementData] = useState({
    description: '',
    offers: [
      { 
        id: 'default_1',
        title: 'Aperitivo Match', 
        description: 'Spritz + stuzzichini', 
        price: '12€' 
      }
    ],
    eventDetails: {
      startTime: '19:30',
      endTime: '23:00'
    }
  });

  // Lista campionati popolari
  const popularLeagues = [
    { id: 'serie-a', name: 'Serie A', flag: '🇮🇹' },
    { id: 'champions-league', name: 'Champions League', flag: '🏆' },
    { id: 'europa-league', name: 'Europa League', flag: '🥈' },
    { id: 'premier-league', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: 'la-liga', name: 'La Liga', flag: '🇪🇸' },
    { id: 'bundesliga', name: 'Bundesliga', flag: '🇩🇪' },
  ];

  if (!isOpen) return null;

  // Step 1: Selezione Campionato
  const handleLeagueSelect = async (league) => {
    setSelectedLeague(league);
    setLoadingMatches(true);
    setStep(2);

    try {
      console.log(`🔍 Loading real matches from GlobalMatches API for league: ${league.id}`);
      
      // Carica partite reali dalle GlobalMatches (simulate API call)
      const response = await apiClient.get('/global-matches', {
        params: {
          league: league.id,
          limit: 10,
          fromDate: new Date().toISOString().split('T')[0] // Solo partite future
        }
      });
      
      if (response.success) {
        console.log(`📋 Found ${response.data.length} real matches for ${league.name}`);
        setAvailableMatches(response.data);
      } else {
        throw new Error('API response not successful');
      }
    } catch (error) {
      console.error('❌ Errore caricamento partite da GlobalMatches:', error);
      console.log('⚠️ No real matches available - admin should create announcements from real data only');
      setAvailableMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Step 2: Selezione Partita
  const handleMatchSelect = (match) => {
    setSelectedMatch(match);
    setStep(3);
  };

  // Step 3: Submit finale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepara i dati nel formato corretto per il backend
      const finalData = {
        match: {
          id: selectedMatch.id,                    // ✅ AGGIUNTO
          homeTeam: selectedMatch.homeTeam,
          awayTeam: selectedMatch.awayTeam,
          competition: {
            id: selectedMatch.competition.id,     // ✅ AGGIUNTO
            name: selectedMatch.competition.name,
            logo: selectedMatch.competition.logo
          },
          date: selectedMatch.date,               // Formato ISO8601
          time: selectedMatch.time,               // Formato HH:MM
          venue: selectedMatch.venue,
          source: selectedMatch.source || 'manual'
        },
        eventDetails: {
          startDate: selectedMatch.date,          // ✅ AGGIUNTO (stesso della partita)
          startTime: announcementData.eventDetails.startTime,  // ✅ CORRETTO
          endTime: announcementData.eventDetails.endTime,      // ✅ CORRETTO
          description: announcementData.description,           // ✅ SPOSTATO QUI
          selectedOffers: announcementData.offers              // ✅ RINOMINATO
        },
        status: 'published'
      };
      
      console.log('📤 Sending data to backend:', JSON.stringify(finalData, null, 2));

      const result = await createMatchAnnouncement(finalData);
      
      console.log('✅ Annuncio creato:', result);
      onSubmit(result);
      handleClose();

    } catch (error) {
      console.error('❌ Errore creazione annuncio:', error);
      alert('Errore durante la creazione dell\'annuncio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedLeague('');
    setAvailableMatches([]);
    setSelectedMatch(null);
    setAnnouncementData({
      description: '',
      offers: [
        { 
          id: 'default_1',
          title: 'Aperitivo Match', 
          description: 'Spritz + stuzzichini', 
          price: '12€' 
        }
      ],
      eventDetails: {
        startTime: '19:30',
        endTime: '23:00'
      }
    });
    onClose();
  };

  const addOffer = () => {
    const newOfferId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setAnnouncementData(prev => ({
      ...prev,
      offers: [...prev.offers, { id: newOfferId, title: '', description: '', price: '' }]
    }));
  };

  const updateOffer = (index, field, value) => {
    setAnnouncementData(prev => ({
      ...prev,
      offers: prev.offers.map((offer, i) => 
        i === index ? { ...offer, [field]: value } : offer
      )
    }));
  };

  const removeOffer = (index) => {
    setAnnouncementData(prev => ({
      ...prev,
      offers: prev.offers.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Crea Nuovo Annuncio Partita
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <span className={`px-2 py-1 rounded ${step >= 1 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100'}`}>
                1. Campionato
              </span>
              <ChevronRight size={14} />
              <span className={`px-2 py-1 rounded ${step >= 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100'}`}>
                2. Partita
              </span>
              <ChevronRight size={14} />
              <span className={`px-2 py-1 rounded ${step >= 3 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100'}`}>
                3. Dettagli
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* STEP 1: Selezione Campionato */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Trophy className="mx-auto text-orange-500 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Scegli il Campionato
                </h3>
                <p className="text-gray-600">
                  Seleziona il campionato per vedere le prossime partite
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popularLeagues.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => handleLeagueSelect(league)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{league.flag}</span>
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-orange-600">
                          {league.name}
                        </h4>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Selezione Partita */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Partite - {selectedLeague.name} {selectedLeague.flag}
                  </h3>
                  <p className="text-gray-600">
                    Prossime partite della settimana
                  </p>
                </div>
              </div>

              {loadingMatches ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Caricamento partite...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableMatches.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => handleMatchSelect(match)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-500">
                              {new Date(match.date).toLocaleDateString('it-IT', { 
                                weekday: 'short', 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </div>
                            <div className="font-medium text-gray-900">{match.time}</div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900 group-hover:text-orange-600">
                              {match.homeTeam}
                            </span>
                            <span className="text-gray-400">vs</span>
                            <span className="font-medium text-gray-900 group-hover:text-orange-600">
                              {match.awayTeam}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-gray-500">
                          <div>{match.venue}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Dettagli Annuncio */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
                  </h3>
                  <p className="text-gray-600">
                    {new Date(selectedMatch.date).toLocaleDateString('it-IT')} • {selectedMatch.time} • {selectedMatch.venue}
                  </p>
                </div>
              </div>

              {/* Descrizione Evento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione Evento
                </label>
                <textarea
                  value={announcementData.description}
                  onChange={(e) => setAnnouncementData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Descrivi l'atmosfera, l'evento speciale, quello che rende unica la serata..."
                />
              </div>

              {/* Offerte Speciali */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Offerte Speciali
                  </label>
                  <button
                    type="button"
                    onClick={addOffer}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    + Aggiungi Offerta
                  </button>
                </div>
                
                <div className="space-y-3">
                  {announcementData.offers.map((offer, index) => (
                    <div key={offer.id || index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={offer.title}
                          onChange={(e) => updateOffer(index, 'title', e.target.value)}
                          placeholder="Nome offerta"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <input
                          type="text"
                          value={offer.description}
                          onChange={(e) => updateOffer(index, 'description', e.target.value)}
                          placeholder="Descrizione"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={offer.price}
                            onChange={(e) => updateOffer(index, 'price', e.target.value)}
                            placeholder="Prezzo"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          {announcementData.offers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOffer(index)}
                              className="px-3 py-2 text-red-600 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Pubblicazione...
                    </>
                  ) : (
                    'Pubblica Annuncio'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleCreateAnnouncementForm; 