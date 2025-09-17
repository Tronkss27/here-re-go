import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Clock, Users, MapPin, Trophy, ChevronRight, ChevronLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { createMatchAnnouncement } from '@/services/matchAnnouncementService';
import offerTemplatesService from '@/services/offerTemplatesService';
import apiClient from '@/services/apiClient';
import { useForm, useFieldArray } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';

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

  // Template picker state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

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

  // react-hook-form per Step 3 (Dettagli)
  type Offer = { id: string; name: string; description?: string; price?: number; highlight?: boolean };
  type DetailsForm = { description: string; offers: Offer[] };

  const form = useForm<DetailsForm>({
    mode: 'onChange',
    defaultValues: {
      description: '',
      offers: [],
    },
  });
  const { control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'offers' });

  useEffect(() => {
    // Sincronizza stato legacy con RHF all'apertura dello step
    if (step === 3) {
      form.reset({
        description: announcementData.description || '',
        offers: (announcementData.offers || []).map((o: any) => ({
          id: o.id || `offer_${Math.random().toString(36).slice(2)}`,
          name: o.title || '',
          description: o.description || '',
          price: typeof o.price === 'number' ? o.price : undefined,
          highlight: false,
        })),
      });
    }
  }, [step]);

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
      const mappedOffers = (announcementData.offers || [])
        .map((o: any) => ({
          id: o.id || crypto.randomUUID(),
          title: (o.title || o.name || '').toString().trim(),
          description: (o.description || '').toString().trim(),
          templateId: o.templateId || undefined
        }))
        .filter(o => o.id && o.title && o.description);

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
          selectedOffers: mappedOffers.length ? mappedOffers : undefined
        },
        status: 'published'
      };
      
      if (!mappedOffers.length && (announcementData.offers || []).length > 0) {
        console.warn('⚠️ Nessuna offerta valida dopo il mapping. name→title/descrizione mancante.');
        // Facoltativo: feedback non bloccante
      }

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

  // Load templates when opening picker
  const openTemplatePicker = async () => {
    setShowTemplatePicker(true);
    setTemplatesLoading(true);
    try {
      const list = await offerTemplatesService.list({ onlyActive: true });
      setTemplates(list);
    } catch (e) {
      console.warn('Failed loading templates', e);
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const confirmTemplateSelection = () => {
    const selected = templates.filter(t => selectedTemplateIds.includes(String(t._id)));
    if (selected.length) {
      setAnnouncementData(prev => ({
        ...prev,
        offers: [
          ...prev.offers,
          ...selected.map(t => ({ id: crypto.randomUUID(), title: t.title, description: t.description, templateId: t._id }))
        ]
      }));
    }
    setSelectedTemplateIds([]);
    setShowTemplatePicker(false);
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
    <div className="fixed inset-0 z-50 flex p-0 sm:p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" />
      {/* Fullscreen container */}
      <div className="relative bg-white w-full h-[100svh] sm:h-auto sm:max-h-[90vh] sm:rounded-lg shadow-xl max-w-none sm:max-w-4xl mx-auto my-0 sm:my-auto overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Crea Nuovo Annuncio Partita</h2>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className={`${step >= 1 ? 'bg-muted text-foreground' : 'bg-muted/60 text-muted-foreground'} px-2 py-1 rounded`}>1. Campionato</span>
              <ChevronRight size={12} className="text-muted-foreground" />
              <span className={`${step >= 2 ? 'bg-muted text-foreground' : 'bg-muted/60 text-muted-foreground'} px-2 py-1 rounded`}>2. Partita</span>
              <ChevronRight size={12} className="text-muted-foreground" />
              <span className={`${step >= 3 ? 'bg-muted text-foreground' : 'bg-muted/60 text-muted-foreground'} px-2 py-1 rounded`}>3. Dettagli</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-4 sm:p-6">
          {/* STEP 1: Selezione Campionato */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Trophy className="mx-auto text-primary mb-4" size={48} />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Scegli il Campionato
                </h3>
                <p className="text-muted-foreground">
                  Seleziona il campionato per vedere le prossime partite
                </p>
              </div>

              {loadingLeagues ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Caricamento campionati...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableLeagues.map((league) => (
                    <button
                      key={league.id}
                      onClick={() => handleLeagueSelect(league)}
                      className={`p-4 border rounded-lg transition-colors text-left group relative ${league.available ? 'border-border hover:bg-muted/40 bg-card' : 'border-border bg-muted/40'}`}
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
                          <h4 className={`font-medium ${league.available ? 'text-foreground group-hover:text-foreground/80' : 'text-muted-foreground'}`}>
                            {league.name}
                          </h4>
                          {!league.available && (
                            <p className="text-xs text-muted-foreground mt-1">
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="text-muted-foreground hover:text-foreground"
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
                      <h3 className="text-base font-semibold text-foreground">
                        Partite - {selectedLeague.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Prossime partite della settimana
                      </p>
                    </div>
                  </div>
                </div>
                


                {/* ✅ AUTOMATIC SYSTEM: No more manual sync needed! */}
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 animate-pulse"></span>
                    <div className="text-sm text-green-700">
                      <span className="font-medium">Sistema automatico attivo</span>
                      <p className="text-green-600 mt-1">Le partite si aggiornano automaticamente ogni 6 ore. Non è necessaria sincronizzazione manuale.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Selettore Giornata (Round) */}
              {roundsData.length > 0 && (
                <div className="flex items-center gap-2 mb-2 overflow-x-auto whitespace-nowrap">
                  {roundsData.map((r, idx) => (
                    <button
                      key={r.roundId || idx}
                      onClick={() => { setSelectedRoundIdx(idx); setAvailableMatches(r.fixtures || []); }}
                      className={`shrink-0 px-3 py-1 rounded-md text-sm border ${selectedRoundIdx === idx ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border'}`}
                    >
                      Giornata {r.roundNumber || (idx + 1)}
                    </button>
                  ))}
                </div>
              )}

              {loadingMatches ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Caricamento partite...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableMatches.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => handleMatchSelect(match)}
                      className="w-full p-4 border border-border rounded-lg text-left bg-card hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center justify-center text-center min-w-[56px] h-16">
                          <div className="text-xs text-muted-foreground">
                            {match.date ? new Date(match.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Data TBD'}
                          </div>
                          <div className="text-sm font-semibold text-foreground">{match.time || 'Orario TBD'}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            {match.homeTeamLogo && (
                              <img src={match.homeTeamLogo} alt="" className="w-6 h-6 object-contain" />
                            )}
                            <span className="text-[16px] font-semibold leading-snug break-words">
                              {match.homeTeam}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {match.awayTeamLogo && (
                              <img src={match.awayTeamLogo} alt="" className="w-6 h-6 object-contain" />
                            )}
                            <span className="text-[16px] font-semibold leading-snug break-words">
                              {match.awayTeam}
                            </span>
                          </div>
                          {/* Venue rimosso su richiesta */}
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
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft size={20} />
                  </button>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  {/* Lega centrata */}
                  <div className="flex items-center justify-center gap-2">
                    {selectedMatch.competition?.logo && (
                      <img src={selectedMatch.competition.logo} alt="" className="w-5 h-5 object-contain" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {selectedMatch.competition?.name || 'Competizione'}
                    </span>
                  </div>

                  {/* Logo vs Logo - versione compatta mobile-first */}
                  <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                    <div className="flex flex-col items-center min-w-0">
                      {selectedMatch.homeTeamLogo && (
                        <img src={selectedMatch.homeTeamLogo} alt="" className="w-10 h-10 object-contain" />)
                      }
                      <div className="mt-2 text-[16px] font-semibold leading-tight text-center break-words line-clamp-2">
                        {selectedMatch.homeTeam}
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="px-2 text-[12px] font-medium text-[#98A2B3]">vs</span>
                    </div>
                    <div className="flex flex-col items-center min-w-0">
                      {selectedMatch.awayTeamLogo && (
                        <img src={selectedMatch.awayTeamLogo} alt="" className="w-10 h-10 object-contain" />)
                      }
                      <div className="mt-2 text-[16px] font-semibold leading-tight text-center break-words line-clamp-2">
                        {selectedMatch.awayTeam}
                      </div>
                    </div>
                  </div>

                  {/* Meta centrata */}
                  <div className="mt-3 text-sm font-medium text-muted-foreground text-center">
                    {new Date(selectedMatch.date).toLocaleDateString('it-IT')} • {selectedMatch.time}
                  </div>
                </div>
              </div>

              {/* Descrizione Evento */}
              <div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Descrizione Evento</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} maxLength={280} className="min-h-[120px] resize-none rounded-lg" placeholder="Descrivi l'atmosfera, l'evento speciale, quello che rende unica la serata..." />
                      </FormControl>
                      <div className="flex items-center justify-between">
                        <FormDescription>Massimo 280 caratteri</FormDescription>
                        <span className="text-xs text-muted-foreground">{(field.value?.length || 0)}/280</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Offerte Speciali */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-semibold">Offerte Speciali</span>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => append({ id: crypto.randomUUID(), name: '', description: '', price: undefined, highlight: false })}>
                      <Plus className="mr-1 h-4 w-4" /> Aggiungi
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={openTemplatePicker}>Da template</Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {fields.map((f, index) => (
                    <div key={f.id} className="bg-muted/30 rounded-lg p-3 space-y-3">
                      <FormField
                        control={form.control}
                        name={`offers.${index}.name` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input {...field} placeholder="Nome offerta" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`offers.${index}.description` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Textarea {...field} rows={2} placeholder="Descrizione" /></FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`offers.${index}.price` as const}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                <Input {...field} type="number" inputMode="decimal" step="0.5" min="0" className="pl-7" placeholder="Prezzo" />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`offers.${index}.highlight` as const}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormLabel className="text-sm">Evidenzia</FormLabel>
                              <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Picker (sheet semplificato) */}
              {showTemplatePicker && (
                <div className="fixed inset-0 z-50 bg-black/40">
                  <div className="absolute bottom-0 left-0 right-0 rounded-t-xl bg-white p-4 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-semibold">Seleziona template</h4>
                      <button onClick={() => setShowTemplatePicker(false)} className="text-sm text-muted-foreground">Chiudi</button>
                    </div>
                    {templatesLoading ? (
                      <div className="py-8 text-center text-muted-foreground">Caricamento...</div>
                    ) : (
                      <div className="space-y-2">
                        {templates.length === 0 && (
                          <div className="text-sm text-muted-foreground">Nessun template disponibile</div>
                        )}
                        {templates.map((t) => (
                          <label key={String(t._id)} className="flex items-start gap-3 p-3 border rounded-lg">
                            <input
                              type="checkbox"
                              checked={selectedTemplateIds.includes(String(t._id))}
                              onChange={(e) => {
                                const id = String(t._id);
                                setSelectedTemplateIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id))
                              }}
                            />
                            <div>
                              <div className="font-medium">{t.title}</div>
                              <div className="text-sm text-muted-foreground">{t.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowTemplatePicker(false)}>Annulla</Button>
                      <Button type="button" className="flex-1" onClick={confirmTemplateSelection}>Aggiungi</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions - sticky footer */}
              <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-t px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 text-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !form.formState.isValid}
                    className="flex-1 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Pubblicazione...</>) : 'Pubblica annuncio'}
                  </button>
                </div>
              </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleCreateAnnouncementForm; 
