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
  // Stato per giornate (rounds)
  const [roundsData, setRoundsData] = useState<any[]>([]);
  const [selectedRoundIdx, setSelectedRoundIdx] = useState(0);
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

  // Stato per leghe dinamiche
  const [availableLeagues, setAvailableLeagues] = useState([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  
  // ✅ AUTOMATIC SYSTEM: No sync state needed anymore
  
  // Carica leghe disponibili al mount del componente
  useEffect(() => {
    const fetchLeagues = async () => {
      setLoadingLeagues(true);
      try {
        const response = await apiClient.get('/global-matches/leagues');
        if (response.success) {
          console.log('🏆 Loaded leagues from API:', response.data);
          setAvailableLeagues(response.data);
        } else {
          console.warn('⚠️ Failed to load leagues, using fallback');
          // Fallback a leghe Piano European se API fallisce
          setAvailableLeagues([
            { id: 'serie-a', name: 'Serie A', flag: '🇮🇹', available: true },
            { id: 'premier-league', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', available: false },
            { id: 'la-liga', name: 'La Liga', flag: '🇪🇸', available: false },
            { id: 'bundesliga', name: 'Bundesliga', flag: '🇩🇪', available: false },
            { id: 'ligue-1', name: 'Ligue 1', flag: '🇫🇷', available: false },
            { id: 'eredivisie', name: 'Eredivisie', flag: '🇳🇱', available: false },
          ]);
        }
      } catch (error) {
        console.error('❌ Error loading leagues:', error);
        setAvailableLeagues([]);
      } finally {
        setLoadingLeagues(false);
      }
    };
    
    fetchLeagues();
  }, []);

  if (!isOpen) return null;

  // ✅ DEPRECATED: Sync is now automatic via backgroundScheduler
  /* const handleSyncLeague = async (leagueId) => {
    console.log('🔄 Creating sync job for league:', leagueId);
    setLoadingMatches(true);
    setSyncStatus(prev => ({ ...prev, isRunning: true, statusText: 'Avvio sincronizzazione...' }));
    
    try {
      // Trova la configurazione del periodo selezionato
      const selectedConfig = syncPeriods.find(p => p.value === selectedPeriod) || { value: 30, label: '30 giorni', type: 'days' };
      
      // Calcola range di date basato sul tipo
      const startDate = new Date();
      const endDate = new Date();
      
      let syncInfo;
      
      // 🎯 TUTTI sono ora approccio ROUNDS (giornate)
      const estimatedDays = selectedPeriod * 7; // Stima giorni per giornate
      endDate.setDate(endDate.getDate() + estimatedDays);
      
      syncInfo = {
        type: 'rounds',
        roundCount: selectedPeriod,
        label: selectedConfig.label,
        estimatedDays
      };
      
      console.log(`⚽ Sincronizzazione ${selectedLeague.name} per ${selectedConfig.label} - NUOVO APPROCCIO ROUND-BASED`);
      
      const response = await fetch('/api/sync-jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          league: leagueId,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          syncInfo // Include informazioni sul tipo di sync
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Sync job created:', result.data);
        setSyncStatus({
          isRunning: true,
          jobId: result.data.jobId,
          progress: 0,
          statusText: `🚀 Avviata: ${selectedLeague.name} ${syncInfo.label} (${result.data.estimatedDurationText})`,
          dateRange: result.data.dateRange
        });
        
        // Avvia polling per monitorare il progresso
        pollJobStatus(result.data.jobId);
      } else {
        console.error('❌ Sync job creation failed:', result.message);
        alert('Errore durante l\'avvio sincronizzazione: ' + result.message);
        setSyncStatus(prev => ({ ...prev, isRunning: false }));
      }
    } catch (error) {
      console.error('❌ Sync job error:', error);
      alert('Errore durante l\'avvio sincronizzazione');
      setSyncStatus(prev => ({ ...prev, isRunning: false }));
    } finally {
      setLoadingMatches(false);
    }
  }; */

  // Polling per monitorare lo stato del job
  const pollJobStatus = async (jobId) => {
    try {
      const response = await fetch(`/api/sync-jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        const jobData = result.data;
        console.log('📊 Job status:', jobData);
        
        setSyncStatus(prev => ({
          ...prev,
          progress: jobData.progress.percentage,
          statusText: `${jobData.statusText} - ${jobData.progressText} ${jobData.progress.currentChunk ? `(${jobData.progress.currentChunk})` : ''}`
        }));
        
        if (jobData.isComplete) {
          console.log('✅ Sync completed! Results:', jobData.results);
          setSyncStatus(prev => ({ 
            ...prev, 
            isRunning: false, 
            statusText: `✅ ${selectedLeague.name} sincronizzata: ${jobData.results.newMatches} nuove, ${jobData.results.cacheHits} cache`
          }));
          
          // ✅ Ricarica immediatamente le partite per questa lega
          try {
            console.log(`🔄 Auto-refreshing matches for ${selectedLeague.name}...`);
            const matchesData = await apiClient.get(`/global-matches?league=${selectedLeague.id}&limit=50`);
            
            if (matchesData && matchesData.data) {
              setAvailableMatches(matchesData.data);
              console.log(`✅ Auto-refresh successful: ${matchesData.data.length} matches loaded`);
            }
          } catch (refreshError) {
            console.error('❌ Auto-refresh failed:', refreshError);
            // Non bloccare il flusso, ma notifica il problema
          }
        } else if (jobData.isFailed) {
          console.error('❌ Sync failed:', jobData);
          setSyncStatus(prev => ({ 
            ...prev, 
            isRunning: false, 
            statusText: 'Errore durante la sincronizzazione'
          }));
          alert('Sincronizzazione fallita. Controlla i log per dettagli.');
        } else if (jobData.isRunning || jobData.status === 'pending') {
          // ✅ Continua polling se il job è running O pending
          setTimeout(() => pollJobStatus(jobId), 2000);
        } else {
          // Status sconosciuto - continua polling per essere sicuri
          console.log(`⚠️ Unknown job status: ${jobData.status}, continuing polling...`);
          setTimeout(() => pollJobStatus(jobId), 3000);
        }
      }
    } catch (error) {
      console.error('❌ Error polling job status:', error);
      setSyncStatus(prev => ({ ...prev, isRunning: false, statusText: 'Errore monitoraggio stato' }));
    }
  };

  // Step 1: Selezione Campionato
  const handleLeagueSelect = async (league) => {
    setSelectedLeague(league);
    setLoadingMatches(true);
    setStep(2);

    try {
      console.log(`🔍 Loading rounds for league: ${league.id}`);

      // 🎯 NUOVO: carica giornate (by-round) e mostra due round completi
      const roundsResp = await apiClient.get('/global-matches/rounds', {
        params: { league: league.id, limitRounds: 2 }
      });

      if (roundsResp.success && Array.isArray(roundsResp.data) && roundsResp.data.length > 0) {
        setRoundsData(roundsResp.data);
        setSelectedRoundIdx(0);
        setAvailableMatches(roundsResp.data[0]?.fixtures || []);
        console.log(`✅ Loaded ${roundsResp.data.length} rounds for ${league.name}`);
      } else {
        // Fallback: vecchia lista piatta (cache-first)
        const response = await apiClient.get('/global-matches', {
          params: {
            league: league.id,
            limit: 20,
            fromDate: new Date().toISOString().split('T')[0]
          }
        });
        setRoundsData([]);
        setAvailableMatches(response.success ? (response.data || []) : []);
      }
    } catch (error) {
      console.error('❌ Errore caricamento partite:', error);
      console.log('⚠️ No matches available - automatic system will update soon');
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
              <span className={`px-2 py-1 rounded ${step >= 1 ? 'bg-orange-100 text-gray-700' : 'bg-gray-100'}`}>
                1. Campionato
              </span>
              <ChevronRight size={14} />
              <span className={`px-2 py-1 rounded ${step >= 2 ? 'bg-orange-100 text-gray-700' : 'bg-gray-100'}`}>
                2. Partita
              </span>
              <ChevronRight size={14} />
              <span className={`px-2 py-1 rounded ${step >= 3 ? 'bg-orange-100 text-gray-700' : 'bg-gray-100'}`}>
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

              {loadingLeagues ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Caricamento campionati...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableLeagues.map((league) => (
                    <button
                      key={league.id}
                      onClick={() => handleLeagueSelect(league)}
                      className={`p-4 border rounded-lg transition-colors text-left group relative ${
                        league.available 
                          ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white' 
                          : 'border-gray-100 bg-gray-50'
                      }`}
                      disabled={!league.available}
                    >
                      <div className="flex items-center gap-3">
                        {/* Solo logo reale della lega */}
                        <img 
                          src={league.logo}
                          alt={league.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            // Se fallisce, mostra placeholder neutro
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzk0QTNBRiIvPgo8L3N2Zz4K';
                          }}
                        />
                        <div className="flex-1">
                          <h4 className={`font-medium ${
                            league.available 
                              ? 'text-gray-900 group-hover:text-gray-700' 
                              : 'text-gray-500'
                          }`}>
                            {league.name}
                          </h4>
                          {!league.available && (
                            <p className="text-xs text-gray-400 mt-1">
                              Nessuna partita disponibile
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Badge per indicare disponibilità */}
                      {league.available && (
                        <div className="absolute top-2 right-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Selezione Partita */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    {/* Logo lega sempre visibile */}
                    <img 
                      src={selectedLeague.logo}
                      alt={selectedLeague.name}
                      className="w-8 h-8 object-contain rounded"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzk0QTNBRiIvPgo8L3N2Zz4K';
                      }}
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Partite - {selectedLeague.name}
                      </h3>
                      <p className="text-gray-600">
                        Prossime partite della settimana
                      </p>
                    </div>
                  </div>
                </div>
                


                {/* ✅ AUTOMATIC SYSTEM: No more manual sync needed! */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="text-sm text-green-700">
                      <span className="font-medium">Sistema automatico attivo</span>
                      <p className="text-green-600 mt-1">Le partite si aggiornano automaticamente ogni 6 ore. Non è necessaria sincronizzazione manuale.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Selettore Giornata (Round) */}
              {roundsData.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  {roundsData.map((r, idx) => (
                    <button
                      key={r.roundId || idx}
                      onClick={() => { setSelectedRoundIdx(idx); setAvailableMatches(r.fixtures || []); }}
                      className={`px-3 py-1 rounded-md text-sm border ${selectedRoundIdx === idx ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}
                    >
                      Giornata {r.roundNumber || (idx + 1)}
                    </button>
                  ))}
                </div>
              )}

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
                      className="w-full p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left group !bg-white"
                      style={{
                        backgroundColor: 'white !important', 
                        borderColor: '#e5e7eb !important',
                        background: 'white !important',
                        color: '#374151 !important'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-500">
                              {match.date ? new Date(match.date).toLocaleDateString('it-IT', { 
                                weekday: 'short', 
                                day: 'numeric', 
                                month: 'short' 
                              }) : 'Data da definire'}
                            </div>
                            <div className="font-medium text-gray-900">{match.time || 'Orario TBD'}</div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {match.homeTeamLogo && (
                                <img 
                                  src={match.homeTeamLogo} 
                                  alt={`${match.homeTeam} logo`}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="font-medium text-gray-900 group-hover:text-gray-700">
                                {match.homeTeam}
                              </span>
                            </div>
                            <span className="text-gray-400">vs</span>
                            <div className="flex items-center gap-2">
                              {match.awayTeamLogo && (
                                <img 
                                  src={match.awayTeamLogo} 
                                  alt={`${match.awayTeam} logo`}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="font-medium text-gray-900 group-hover:text-gray-700">
                                {match.awayTeam}
                              </span>
                            </div>
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
                    className="text-gray-700 hover:text-gray-800 text-sm font-medium"
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
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
