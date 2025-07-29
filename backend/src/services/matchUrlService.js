/**
 * Service per generare URL strutturate per le partite
 * Formato: /locali/[date]/[teams-slug]/[fixtureId]
 * Esempio: /locali/2025-07-25/inter-vs-milan/serie_a_inter_milan_001
 */

/**
 * Genera uno slug sicuro per URL a partire da una stringa
 */
function generateSlug(text) {
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
function generateMatchUrl(match) {
  if (!match || !match.homeTeam || !match.awayTeam || !match.date || !match.id) {
    throw new Error('Match object must have homeTeam, awayTeam, date, and id');
  }

  // Formatta la data (YYYY-MM-DD)
  const date = new Date(match.date).toISOString().split('T')[0];
  
  // Genera slug per le squadre
  const teamsSlug = generateSlug(`${match.homeTeam}-vs-${match.awayTeam}`);
  
  // Costruisci URL
  return `/locali/${date}/${teamsSlug}/${match.id}`;
}

/**
 * Estrae i parametri dall'URL strutturata
 * @param {string} url - URL da parsare
 * @returns {Object} Oggetti con date, teamsSlug, fixtureId
 */
function parseMatchUrl(url) {
  // Formato: /locali/[date]/[teams-slug]/[fixtureId]
  const match = url.match(/^\/locali\/([0-9]{4}-[0-9]{2}-[0-9]{2})\/([^\/]+)\/(.+)$/);
  
  if (!match) {
    throw new Error('Invalid match URL format');
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
function isValidMatchUrl(url) {
  try {
    parseMatchUrl(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Genera MatchId unico basato su squadre, data e competizione
 * @param {Object} matchData - Dati della partita
 * @returns {string} ID unico della partita
 */
function generateMatchId(matchData) {
  const { homeTeam, awayTeam, date, competition } = matchData;
  
  if (!homeTeam || !awayTeam || !date) {
    throw new Error('homeTeam, awayTeam, and date are required');
  }

  // Prefisso basato sulla competizione
  let prefix = 'match';
  if (competition?.id) {
    const compSlug = generateSlug(competition.id);
    prefix = compSlug.substring(0, 8); // Max 8 caratteri
  }

  // Slug per le squadre (limitato per evitare URL troppo lunghe)
  const homeSlug = generateSlug(homeTeam).substring(0, 10);
  const awaySlug = generateSlug(awayTeam).substring(0, 10);
  
  // Data formattata
  const dateStr = new Date(date).toISOString().split('T')[0].replace(/-/g, '');
  
  // Hash semplice per evitare collisioni
  const timestamp = Date.now().toString().slice(-6);
  
  return `${prefix}_${homeSlug}_${awaySlug}_${dateStr}_${timestamp}`;
}

module.exports = {
  generateSlug,
  generateMatchUrl,
  parseMatchUrl,
  isValidMatchUrl,
  generateMatchId
}; 