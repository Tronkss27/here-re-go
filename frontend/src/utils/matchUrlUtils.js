/**
 * Utility per generare URL strutturate per le partite nel frontend
 * Sincronizzate con il backend service
 */

/**
 * Genera uno slug sicuro per URL a partire da una stringa
 */
export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^\w\s-]/g, '') // Rimuovi caratteri speciali
    .replace(/[\s_-]+/g, '-') // Sostituisci spazi e underscore con trattini
    .replace(/^-+|-+$/g, ''); // Rimuovi trattini all'inizio e alla fine
}

/**
 * Genera URL strutturata per una partita
 * @param {Object} match - Oggetto partita con homeTeam, awayTeam, date, id
 * @returns {string} URL strutturata
 */
export function generateMatchUrl(match) {
  if (!match || !match.homeTeam || !match.awayTeam || !match.date || !match.id) {
    // Fallback a URL semplice se dati incompleti
    return `/locali/${match.id || 'unknown'}`;
  }

  try {
    // Formatta la data (YYYY-MM-DD)
    const date = new Date(match.date).toISOString().split('T')[0];
    
    // Genera slug per le squadre
    const teamsSlug = generateSlug(`${match.homeTeam}-vs-${match.awayTeam}`);
    
    // Costruisci URL strutturata
    return `/locali/${date}/${teamsSlug}/${match.id}`;
  } catch (error) {
    console.warn('Error generating structured URL, falling back to simple format:', error);
    return `/locali/${match.id}`;
  }
}

/**
 * Estrae i parametri dall'URL strutturata
 * @param {string} url - URL da parsare
 * @returns {Object|null} Oggetti con date, teamsSlug, fixtureId
 */
export function parseMatchUrl(url) {
  // Formato: /locali/[date]/[teams-slug]/[fixtureId]
  const match = url.match(/^\/locali\/([0-9]{4}-[0-9]{2}-[0-9]{2})\/([^\/]+)\/(.+)$/);
  
  if (!match) {
    return null;
  }

  return {
    date: match[1],
    teamsSlug: match[2],
    fixtureId: match[3]
  };
}

/**
 * Valida se una stringa è un URL di partita valido
 * @param {string} url - URL da validare
 * @returns {boolean}
 */
export function isValidMatchUrl(url) {
  return parseMatchUrl(url) !== null;
}

/**
 * Fallback per retrocompatibilità: estrae matchId da URL semplice
 * @param {string} url - URL formato /locali/matchId
 * @returns {string|null} matchId se trovato
 */
export function parseSimpleMatchUrl(url) {
  const match = url.match(/^\/locali\/([^\/]+)$/);
  return match ? match[1] : null;
}

/**
 * Ottiene il matchId da qualsiasi formato URL
 * @param {string} url - URL da processare
 * @returns {string|null} matchId
 */
export function extractMatchId(url) {
  // Prova prima il formato strutturato
  const structured = parseMatchUrl(url);
  if (structured) {
    return structured.fixtureId;
  }
  
  // Fallback al formato semplice
  return parseSimpleMatchUrl(url);
} 