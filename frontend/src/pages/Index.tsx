import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import CardNav from '../components/CardNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useHotMatches } from '../services/hotMatchesService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import MatchCardC3 from '../components/MatchCardC3';
import { getLeagueDisplayName } from '../utils/leagueUtils';

const Index = () => {
  const [activeDay, setActiveDay] = useState('big-fixtures');
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const useNewUI = (import.meta as any).env.VITE_ENABLE_NEW_UI === 'true';

  type DayTab = { id: string; label: string; date: Date | null };
  
  // Hook per partite popolari - prendiamo più partite per avere dati sufficienti
  const { matches: hotMatches, loading: hotLoading, error: hotError, trackClick } = useHotMatches(20) as any;

  // Genera i prossimi 7 giorni
  const getDayTabs = () => {
    const tabs: DayTab[] = [];
    const today = new Date();
    
    // Big Fixtures sempre primo
    tabs.push({ id: 'big-fixtures', label: 'BIG FIXTURES', date: null });
    
    // Genera prossimi 6 giorni
    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
      const dayName = dayNames[date.getDay()];
      const dayNum = date.getDate();
      
      if (i === 0) {
        tabs.push({ id: 'today', label: 'OGGI', date: date });
      } else if (i === 1) {
        tabs.push({ id: 'tomorrow', label: 'DOMANI', date: date });
      } else {
        tabs.push({ 
          id: `day-${i}`, 
          label: `${dayName} ${dayNum}`, 
          date: date 
        });
      }
    }
    
    return tabs;
  };

  const dayTabs: DayTab[] = getDayTabs();

  // Filtra e ordina le partite in base al giorno selezionato
  const filteredMatches = useMemo(() => {
    if (!hotMatches || hotMatches.length === 0) return [];
    
    let matches = [...hotMatches];
    
    if (activeDay === 'big-fixtures') {
      // Per "Big Fixtures" mostra le prime 6-8 più cliccate/popolari
      return matches
        .sort((a, b) => (b.venueCount || 0) - (a.venueCount || 0))
        .slice(0, 8);
    } else {
      // Per giorni specifici, filtra per data
      const selectedTab = dayTabs.find(tab => tab.id === activeDay);
      if (selectedTab && selectedTab.date) {
        const targetDate = selectedTab.date.toISOString().split('T')[0];
        matches = matches.filter(match => {
          const matchDate = new Date(match.date).toISOString().split('T')[0];
          return matchDate === targetDate;
        });
      }
      
      // Prima le più popolari (prime 4), poi le altre
      const popular = matches
        .sort((a, b) => (b.venueCount || 0) - (a.venueCount || 0))
        .slice(0, 4);
      
      const others = matches
        .sort((a, b) => (b.venueCount || 0) - (a.venueCount || 0))
        .slice(4);
      
      return [...popular, ...others];
    }
  }, [hotMatches as any, activeDay, dayTabs]);

  // Supporto query param per attivare tab (es. /?tab=big)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'big') setActiveDay('big-fixtures');
  }, [location.search]);

  const getActiveTabTitle = () => {
    switch(activeDay) {
      case 'big-fixtures': return 'PARTITE PIÙ CALDE';
      case 'today': return 'PARTITE DI OGGI';
      case 'tomorrow': return 'PARTITE DI DOMANI';
      default: {
        const tab = dayTabs.find(t => t.id === activeDay);
        return tab ? `PARTITE DEL ${tab.label}` : 'PARTITE DEL GIORNO SELEZIONATO';
      }
    }
  };

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      {useNewUI ? (
        <CardNav
          logo={''}
          logoText={"It's a Match"}
          user={auth?.isAuthenticated ? { name: auth?.user?.name, avatarUrl: auth?.user?.avatarUrl, isVenueOwner: auth?.user?.isVenueOwner } : null}
          onLogin={() => navigate('/client-login')}
          onBusiness={() => navigate('/sports-login')}
          onLogout={() => auth?.logout?.()}
          onProfile={() => navigate('/profile')}
          onAdmin={() => navigate('/admin')}
          baseColor="#BFFF00"
          mode="header"
          headerTheme="light"
          items={[
            {
              label: 'Locali',
              bgDesktop: 'linear-gradient(180deg, #BFFF00 0%, #FFFFFF 100%)',
              bgMobile: 'linear-gradient(90deg, #BFFF00 0%, #FFFFFF 100%)',
              textColor: '#111111',
              links: [
                { label: 'Vicino a te', ariaLabel: 'Locali vicino a te', href: '/locali?near=me' },
                { label: 'Migliori', ariaLabel: 'Locali migliori', href: '/locali?sort=top' }
              ]
            },
            {
              label: 'Partite',
              bgDesktop: 'linear-gradient(180deg, #BFFF00 0%, #FFFFFF 100%)',
              bgMobile: 'linear-gradient(90deg, #BFFF00 0%, #FFFFFF 100%)',
              textColor: '#111111',
              links: [
                { label: 'Big fixtures', ariaLabel: 'Partite più calde', href: '/?tab=big' },
                { label: 'Per Lega', ariaLabel: 'Partite per lega', href: '/locali?league=serie-a' }
              ]
            },
            {
              label: 'Chi siamo',
              bgDesktop: 'linear-gradient(180deg, #BFFF00 0%, #FFFFFF 100%)',
              bgMobile: 'linear-gradient(90deg, #BFFF00 0%, #FFFFFF 100%)',
              textColor: '#111111',
              links: [
                { label: 'Mission', ariaLabel: 'Mission', href: '/mission' },
                { label: 'Contatti', ariaLabel: 'Contatti', href: '/contatti' }
              ]
            }
          ]}
        />
      ) : (
        <Header />
      )}
      
      {/* Client Landing Section - only visible for authenticated clients */}
      {/* ClientLandingSection component was removed from imports, so this section is removed */}
      
      {/* Hero Banner */}
      <section className="hero-banner">
        {/* Immagine banner caricata */}
        <img 
          src={`/img/hero-banner.png?v=${Date.now()}`} 
          alt="Sports Banner" 
          className="w-full h-full object-cover absolute inset-0"
        />
        <div className="hero-content">
          <h1 className="hero-title">SCOPRI I MIGLIORI SPORT BAR</h1>
          <p className="hero-subtitle">Trova il locale perfetto per guardare la tua partita preferita</p>
        </div>
      </section>

      {/* Day Navigation Tabs */}
      {useNewUI ? (
        <section className="pt-4">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="flex items-center justify-center">
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-2">
                {dayTabs.map((tab, index) => {
                  const isActive = activeDay === tab.id;
                  const isBig = tab.id === 'big-fixtures';
                  // Calcola etichetta come nel mock
                  const displayLabel = isBig
                    ? 'PARTITE PIÙ CALDE'
                    : tab.id === 'today'
                      ? 'OGGI'
                      : tab.id === 'tomorrow'
                        ? 'DOMANI'
                        : (tab.date ? tab.date.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase() : tab.label);
                  const monthDay = tab.date ? tab.date.getDate() : null;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDay(tab.id)}
                      className={`${isActive ? 'bg-white shadow-[0_6px_20px_rgba(0,0,0,0.08)] ring-2 ring-[hsl(var(--primary))] ring-offset-2 ring-offset-white' : 'bg-transparent'} min-w-[120px] flex flex-col items-center px-4 py-2 rounded-xl transition-all`}
                    >
                      <span className={`text-sm font-semibold ${isActive ? 'text-gray-800' : 'text-gray-700'}`}>{displayLabel}</span>
                      {!isBig && monthDay !== null && (
                        <span className="text-[12px] text-muted-foreground mt-1">{monthDay}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="day-navigation">
          <div className="day-tabs">
            {dayTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDay(tab.id)}
                className={`day-tab ${activeDay === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="bg-white py-12 w-full overflow-x-hidden">
        <div className="w-full px-0">
          
          {/* Hot Matches Section */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-[hsl(var(--primary))]" size={28} />
                <h2 className="text-3xl font-bold text-gray-900 font-special">
                  {getActiveTabTitle()}
                </h2>
              </div>
              <button 
                onClick={() => navigate('/locali')}
                className="flex items-center gap-2 text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-dark))] font-medium transition-colors"
              >
                Vedi tutti i locali <ChevronRight size={16} />
              </button>
            </div>
            
            {hotLoading ? (
              <div className="matches-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
                ))}
              </div>
            ) : hotError ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 text-center">
                <TrendingUp className="mx-auto text-orange-400 mb-4" size={48} />
                <p className="text-orange-600 font-medium mb-2">Partite in arrivo...</p>
                <p className="text-gray-600">Le partite più popolari appariranno qui quando i locali inizieranno a pubblicare annunci</p>
              </div>
            ) : filteredMatches.length > 0 ? (
              <div className="matches-grid">
                {filteredMatches.map((m, index) => (
                  <MatchCardC3
                    key={`${m.matchId}-${index}`}
                    match={{
                      matchId: m.matchId,
                      league: m.league || getLeagueDisplayName(m.competition?.name),
                      homeTeam: m.homeTeam,
                      awayTeam: m.awayTeam,
                      date: m.date,
                      time: m.time,
                      homeTeamLogo: m.homeTeamLogo,
                      awayTeamLogo: m.awayTeamLogo,
                      venueCount: m.venueCount,
                    }}
                    onClick={async () => {
                      // Usa il servizio centralizzato (gestisce throttle + tenant via apiClient)
                      await trackClick(m.matchId);
                      const date = m.date || new Date().toISOString().split('T')[0];
                      const teamsSlug = `${m.homeTeam.toLowerCase().replace(/\s+/g, '-')}-vs-${m.awayTeam.toLowerCase().replace(/\s+/g, '-')}`;
                      navigate(`/locali/${date}/${teamsSlug}/${m.matchId}`);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 font-medium mb-2">Nessuna partita per questo giorno</p>
                <p className="text-gray-500">Prova a selezionare un altro giorno o torna più tardi</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            © 2025 SPOrTS • Privacy • Termini
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
