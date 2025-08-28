import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, ChevronRight, Users, Clock, Calendar, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHotMatches } from '@/services/hotMatchesService';
import { useNavigate } from 'react-router-dom';
import { getLeagueLogo, getLeagueDisplayName, getTeamAbbreviation } from '@/utils/leagueUtils';

const Index = () => {
  const [activeDay, setActiveDay] = useState('big-fixtures');
  const navigate = useNavigate();
  
  // Hook per partite popolari - prendiamo più partite per avere dati sufficienti
  const { matches: hotMatches, loading: hotLoading, error: hotError, trackClick } = useHotMatches(20);

  // Genera i prossimi 7 giorni
  const getDayTabs = () => {
    const tabs = [];
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

  const dayTabs = getDayTabs();

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
  }, [hotMatches, activeDay, dayTabs]);

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
    <div className="min-h-screen bg-white">
      <Header />
      
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
      <section className="day-navigation">
        <div className="container mx-auto px-4">
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
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          
          {/* Hot Matches Section */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-orange-500" size={32} />
                <h2 className="text-3xl font-bold text-gray-900 font-special">
                  {getActiveTabTitle()}
                </h2>
              </div>
              <button 
                onClick={() => navigate('/locali')}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
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
                {filteredMatches.map((match, index) => (
                  <div
                    key={`${match.matchId}-${index}`}
                    className="match-card"
                    onClick={() => {
                      trackClick(match.matchId);
                      // Genera URL strutturata
                      const date = match.date || new Date().toISOString().split('T')[0];
                      const teamsSlug = `${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}-vs-${match.awayTeam.toLowerCase().replace(/\s+/g, '-')}`;
                      navigate(`/locali/${date}/${teamsSlug}/${match.matchId}`);
                    }}
                  >
                    <div className="p-6">
                      {/* Match Header - Logo Lega */}
                      <div className="match-card-header">
                        <div className="competition-info">
                          {match.leagueLogo ? (
                            <img 
                              src={match.leagueLogo} 
                              alt={match.league || 'League'}
                              className="competition-logo-img w-5 h-5 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling.style.display = 'inline';
                              }}
                            />
                          ) : null}
                          <span 
                            className="competition-logo-placeholder"
                            style={{ display: match.leagueLogo ? 'none' : 'inline' }}
                          >
                            ⚽
                          </span>
                          <span>{match.league || getLeagueDisplayName(match.competition?.name) || 'Campionato'}</span>
                        </div>
                        <div className="hot-badge">
                          <TrendingUp size={12} />
                          HOT
                        </div>
                      </div>
                      
                      {/* Teams con Loghi Placeholder */}
                      <div className="teams-section">
                        <div className="teams-with-logos">
                          {/* Logo squadra casa */}
                          <div className="flex flex-col items-center">
                            <div className="team-logo-placeholder">
                              {match.homeTeamLogo ? (
                                <img 
                                  src={match.homeTeamLogo} 
                                  alt={`${match.homeTeam} logo`}
                                  className="w-8 h-8 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling.style.display = 'block';
                                  }}
                                />
                              ) : null}
                              <span 
                                className="text-lg font-bold text-gray-500"
                                style={{ display: match.homeTeamLogo ? 'none' : 'block' }}
                              >
                                {match.homeTeam.charAt(0)}
                              </span>
                            </div>
                            <span className="team-name">
                              {getTeamAbbreviation(match.homeTeam)}
                            </span>
                          </div>
                          
                          {/* VS */}
                          <div className="vs-separator">VS</div>
                          
                          {/* Logo squadra ospite */}
                          <div className="flex flex-col items-center">
                            <div className="team-logo-placeholder">
                              {match.awayTeamLogo ? (
                                <img 
                                  src={match.awayTeamLogo} 
                                  alt={`${match.awayTeam} logo`}
                                  className="w-8 h-8 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling.style.display = 'block';
                                  }}
                                />
                              ) : null}
                              <span 
                                className="text-lg font-bold text-gray-500"
                                style={{ display: match.awayTeamLogo ? 'none' : 'block' }}
                              >
                                {match.awayTeam.charAt(0)}
                              </span>
                            </div>
                            <span className="team-name">
                              {getTeamAbbreviation(match.awayTeam)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Orario evidenziato */}
                        <div className="text-center">
                          <div className="time-highlight">
                            <div className="time-date">
                              {new Date(match.date).toLocaleDateString('it-IT', { 
                                weekday: 'short', 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </div>
                            <div className="time-hour">
                              {match.time}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="venue-count">
                        <div className="flex items-center justify-center gap-1">
                          <Users size={14} />
                          <span>{match.venueCount} locali disponibili</span>
                        </div>
                      </div>
                      
                      {/* CTA Button */}
                      <button className="match-cta-button">
                        <MapPin size={16} className="cta-icon-map" />
                        <span>Trova Locali</span>
                        <ChevronRight size={16} className="cta-icon-arrow" />
                      </button>
                    </div>
                  </div>
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
