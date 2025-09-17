const fs = require('fs');
const path = require('path');

// Semplice cache in memoria
let cache = {
  loaded: false,
  // { [leagueSlug: string]: { [roundId: string]: number } }
  mapping: {}
};

const LEAGUE_TITLE_BY_SLUG = {
  'serie-a': 'Serie A',
  'serie-b': 'Serie B',
  'coppa-italia': 'Coppa Italia',
  'premier-league': 'Premier League',
  'la-liga': 'La Liga',
  'bundesliga': 'Bundesliga',
  'ligue-1': 'Ligue 1',
  'eredivisie': 'Eredivisie',
  'championship': 'Championship',
  // Usa il nome ufficiale come appare in SEASONID.md
  'primeira-liga': 'Liga Portugal',
};

function ensureLoaded() {
  if (cache.loaded) return;

  const mdPath = path.resolve(__dirname, '../../../SEASONID.md');
  let contents = '';
  try {
    contents = fs.readFileSync(mdPath, 'utf8');
  } catch (err) {
    console.warn('[roundMappingService] Unable to read SEASONID.md, round numbers may fallback:', err.message);
    cache.loaded = true;
    return;
  }

  const lines = contents.split(/\r?\n/);

  let currentLeague = null;
  let lastNumeric = null; // ultimo ID numerico visto
  let lastRoundNum = null; // ultimo "Round N" visto

  const setMap = (league, roundIdStr, roundNumber) => {
    if (!league || !roundIdStr || !roundNumber) return;
    const slug = Object.keys(LEAGUE_TITLE_BY_SLUG).find(k => LEAGUE_TITLE_BY_SLUG[k] === league) || league;
    if (!cache.mapping[slug]) cache.mapping[slug] = {};
    cache.mapping[slug][String(roundIdStr)] = Number(roundNumber);
  };

  const LEAGUE_TITLES = new Set(Object.values(LEAGUE_TITLE_BY_SLUG));

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] || '').trim();
    if (!line) continue;

    // Sezione lega: es. "Serie A: id = 384, ..."
    const leagueHeaderMatch = /^([\w\s]+):\s*id\s*=\s*\d+/.exec(line);
    if (leagueHeaderMatch) {
      const title = leagueHeaderMatch[1].trim();
      // Normalizza: alcuni file possono avere "Premiere League" vs "Premier League"
      currentLeague = LEAGUE_TITLES.has(title) ? title : title.replace('Premiere', 'Premier');
      lastNumeric = null;
      lastRoundNum = null;
      continue;
    }

    // Riga numerica (probabile roundId)
    const numericMatch = /^(\d{4,})$/.exec(line);
    if (numericMatch) {
      const idStr = numericMatch[1];
      if (lastRoundNum && currentLeague) {
        // Caso: "Round 1" prima, ID dopo
        setMap(currentLeague, idStr, lastRoundNum);
        lastRoundNum = null;
      } else {
        lastNumeric = idStr;
      }
      continue;
    }

    // Riga "Round N"
    const roundMatch = /^Round\s+(\d+)/i.exec(line);
    if (roundMatch) {
      const num = Number(roundMatch[1]);
      if (lastNumeric && currentLeague) {
        // Caso: ID prima, "Round N" dopo
        setMap(currentLeague, lastNumeric, num);
        lastNumeric = null;
      } else {
        // Caso inverso: memorizza per coppia successiva
        lastRoundNum = num;
      }
      continue;
    }
  }

  cache.loaded = true;
}

function getRoundNumber(leagueSlug, roundId) {
  ensureLoaded();
  if (!roundId) return null;
  const slug = leagueSlug;
  const byLeague = cache.mapping[slug];
  const key = String(roundId);
  const mapped = byLeague ? byLeague[key] : null;
  if (typeof mapped === 'number' && mapped > 0 && mapped < 1000) return mapped;
  return null;
}

function getMappingForLeague(leagueSlug) {
  ensureLoaded();
  return cache.mapping[leagueSlug] || {};
}

module.exports = {
  getRoundNumber,
  getMappingForLeague,
};


