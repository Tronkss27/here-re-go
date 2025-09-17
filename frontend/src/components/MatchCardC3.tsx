import React from 'react';

export type MatchCardC3Data = {
  matchId: string;
  league?: string;
  homeTeam: string;
  awayTeam: string;
  date: string; // ISO
  time: string; // HH:mm
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  venueCount?: number;
};

type Props = {
  match: MatchCardC3Data;
  onClick?: () => void;
};

const getLeagueAccentStyle = (league?: string): React.CSSProperties => {
  const l = (league || '').toLowerCase();
  if (l.includes('serie a') || l.includes('ital')) {
    return { background: 'linear-gradient(180deg, #008C45 0%, #F4F5F0 50%, #CD212A 100%)' };
  }
  if (l.includes('liga') && !l.includes('ligue')) {
    return { background: 'linear-gradient(180deg, #AA151B 0%, #F1BF00 50%, #AA151B 100%)' };
  }
  if (l.includes('ligue 1') || l.includes('france')) {
    return { background: 'linear-gradient(180deg, #0055A4 0%, #FFFFFF 50%, #EF4135 100%)' };
  }
  if (l.includes('premier') || l.includes('england')) {
    return { background: 'linear-gradient(180deg, #012169 0%, #FFFFFF 50%, #C8102E 100%)' };
  }
  return { background: 'hsl(var(--primary))' };
};

const MatchCardC3: React.FC<Props> = ({ match, onClick }) => {
  return (
    <div
      className="rounded-2xl pt-6 md:pt-7 pb-5 md:pb-6 px-4 md:px-6 bg-white/95 backdrop-blur-sm shadow-lg h-full flex flex-col border-2 border-[hsl(var(--primary))] cursor-pointer"
      onClick={onClick}
    >
      <div className="-mt-1 md:-mt-2 mb-2 md:mb-3 inline-flex items-center gap-2 ml-[2px] text-[11px] md:text-[12px] font-semibold uppercase tracking-wide text-[hsl(var(--primary))]">
        <span className="inline-block w-1.5 h-5 rounded" style={getLeagueAccentStyle(match.league)} />
        <span>{match.league || 'Campionato'}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-3 mb-2 md:mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-gray-600 overflow-hidden">
            {match.homeTeamLogo ? (
              <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-full h-full object-contain" />
            ) : (
              match.homeTeam.charAt(0)
            )}
          </div>
          <div className="text-gray-800 font-semibold text-[17px] md:text-[19px] uppercase">{match.homeTeam}</div>
        </div>
        <div className="text-[11px] md:text-[12px] font-semibold px-2 py-0.5 rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">VS</div>
        <div className="flex items-center gap-2 justify-end">
          <div className="text-gray-800 font-semibold text-[17px] md:text-[19px] uppercase">{match.awayTeam}</div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-gray-600 overflow-hidden">
            {match.awayTeamLogo ? (
              <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-full h-full object-contain" />
            ) : (
              match.awayTeam.charAt(0)
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-700 mb-3 md:mb-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[hsl(var(--muted))] font-semibold text-[11px] md:text-[12px]">
          {new Date(match.date).toLocaleDateString('it-IT', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </span>
        <span className="font-extrabold text-[hsl(var(--primary))] text-[16px] md:text-[18px]">{match.time}</span>
      </div>

      <button
        className="mt-auto w-full py-3 rounded-lg text-black font-bold"
        style={{ background: 'linear-gradient(90deg, #80FF00 0%, #BFFF00 100%)' }}
      >
        Trova Locali
      </button>
    </div>
  );
};

export default MatchCardC3;




