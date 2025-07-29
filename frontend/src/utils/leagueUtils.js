// Mappatura dei nomi delle leghe ai loghi
export const getLeagueLogo = (leagueName) => {
  if (!leagueName) return null;
  
  const normalized = leagueName.toLowerCase();
  
  // Mappatura dei nomi alle immagini
  const leagueMap = {
    'champions league': '/img/leagues/champions.png',
    'uefa champions league': '/img/leagues/champions.png',
    'champions': '/img/leagues/champions.png',
    'ucl': '/img/leagues/champions.png',
    
    'premier league': '/img/leagues/premier.png',
    'premier': '/img/leagues/premier.png',
    'epl': '/img/leagues/premier.png',
    'english premier league': '/img/leagues/premier.png',
    
    'la liga': '/img/leagues/laliga.png',
    'laliga': '/img/leagues/laliga.png',
    'liga': '/img/leagues/laliga.png',
    'spanish la liga': '/img/leagues/laliga.png',
    
    'serie a': '/img/leagues/seriea.png',
    'seriea': '/img/leagues/seriea.png',
    'italian serie a': '/img/leagues/seriea.png',
    'italy serie a': '/img/leagues/seriea.png',
    
    'ligue 1': '/img/leagues/ligue1.png',
    'ligue1': '/img/leagues/ligue1.png',
    'french ligue 1': '/img/leagues/ligue1.png',
    'france ligue 1': '/img/leagues/ligue1.png'
  };
  
  return leagueMap[normalized] || null;
};

// Funzione per ottenere il nome display della lega
export const getLeagueDisplayName = (leagueName) => {
  if (!leagueName) return 'Lega Sconosciuta';
  
  const normalized = leagueName.toLowerCase();
  
  const displayNames = {
    'champions league': 'Champions League',
    'uefa champions league': 'Champions League',
    'champions': 'Champions League',
    'ucl': 'Champions League',
    
    'premier league': 'Premier League',
    'premier': 'Premier League',
    'epl': 'Premier League',
    'english premier league': 'Premier League',
    
    'la liga': 'La Liga',
    'laliga': 'La Liga',
    'liga': 'La Liga',
    'spanish la liga': 'La Liga',
    
    'serie a': 'Serie A',
    'seriea': 'Serie A',
    'italian serie a': 'Serie A',
    'italy serie a': 'Serie A',
    
    'ligue 1': 'Ligue 1',
    'ligue1': 'Ligue 1',
    'french ligue 1': 'Ligue 1',
    'france ligue 1': 'Ligue 1'
  };
  
  return displayNames[normalized] || leagueName;
};

// Funzione per abbreviare i nomi delle squadre
export const getTeamAbbreviation = (teamName) => {
  if (!teamName) return '';
  
  const abbreviations = {
    // Champions League Teams
    'paris saint-germain': 'PSG',
    'paris saint germain': 'PSG',
    'manchester city': 'MAN CITY',
    'manchester united': 'MAN UTD',
    'real madrid': 'REAL',
    'barcelona': 'BARCA',
    'fc barcelona': 'BARCA',
    'bayern munich': 'BAYERN',
    'fc bayern munich': 'BAYERN',
    'juventus': 'JUVE',
    'ac milan': 'MILAN',
    'inter milan': 'INTER',
    'liverpool': 'LIVERPOOL',
    'arsenal': 'ARSENAL',
    'chelsea': 'CHELSEA',
    'tottenham': 'SPURS',
    'atletico madrid': 'ATLETICO',
    'borussia dortmund': 'DORTMUND',
    
    // Serie A
    'napoli': 'NAPOLI',
    'roma': 'ROMA',
    'lazio': 'LAZIO',
    'atalanta': 'ATALANTA',
    'fiorentina': 'FIORENTINA',
    
    // Premier League
    'leicester city': 'LEICESTER',
    'west ham': 'WEST HAM',
    'everton': 'EVERTON',
    'newcastle': 'NEWCASTLE',
    
    // La Liga
    'sevilla': 'SEVILLA',
    'valencia': 'VALENCIA',
    'villarreal': 'VILLARREAL',
    'real sociedad': 'SOCIEDAD',
    
    // Ligue 1
    'olympique marseille': 'MARSEILLE',
    'olympique lyon': 'LYON',
    'monaco': 'MONACO',
    'lille': 'LILLE'
  };
  
  const normalized = teamName.toLowerCase().trim();
  
  // Controlla se esiste un'abbreviazione specifica
  if (abbreviations[normalized]) {
    return abbreviations[normalized];
  }
  
  // Logica di fallback per abbreviazioni automatiche
  const words = teamName.split(' ');
  
  // Se è una sola parola e è lunga, prendi le prime lettere
  if (words.length === 1) {
    return words[0].length > 8 ? words[0].substring(0, 6).toUpperCase() : words[0].toUpperCase();
  }
  
  // Se sono due parole, prendi la prima parola se è significativa
  if (words.length === 2) {
    // Rimuovi prefissi comuni
    const filteredWords = words.filter(word => 
      !['fc', 'ac', 'as', 'sc', 'cf', 'club', 'football', 'calcio'].includes(word.toLowerCase())
    );
    
    if (filteredWords.length === 1) {
      return filteredWords[0].length > 8 ? filteredWords[0].substring(0, 6).toUpperCase() : filteredWords[0].toUpperCase();
    }
    
    // Altrimenti prendi le prime due parole
    return `${words[0]} ${words[1]}`.toUpperCase();
  }
  
  // Per tre o più parole, prendi le prime due parole significative
  const significantWords = words.filter(word => 
    !['fc', 'ac', 'as', 'sc', 'cf', 'club', 'football', 'calcio', 'de', 'del', 'la', 'le', 'the'].includes(word.toLowerCase())
  );
  
  if (significantWords.length >= 2) {
    return `${significantWords[0]} ${significantWords[1]}`.toUpperCase();
  }
  
  if (significantWords.length === 1) {
    return significantWords[0].toUpperCase();
  }
  
  // Fallback: prime due parole
  return `${words[0]} ${words[1] || ''}`.trim().toUpperCase();
}; 