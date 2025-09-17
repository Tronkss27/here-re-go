const path = require('path');

/**
 * Adapter per Sportmonks API - converte risposte API in StandardFixture DTO
 */
class SportmonksAdapter {
  constructor() {
    this.provider = 'sportmonks';
  }

  /**
   * Mappa una fixture di Sportmonks al nostro StandardFixture DTO
   * @param {object} fixture - Raw fixture data da Sportmonks API
   * @returns {object} StandardFixture DTO
   */
  mapToStandardFixture(fixture) {
    try {
      // Validation input
      if (!fixture || typeof fixture !== 'object') {
        throw new Error('Invalid fixture data');
      }

      // Extract participants (teams)
      const participants = this._extractParticipants(fixture);
      
      // Extract league info
      const league = this._extractLeague(fixture);
      
      // Extract venue info
      const venue = this._extractVenue(fixture);
      
      // Extract timing info
      const timing = this._extractTiming(fixture);
      
      // Extract status
      const status = this._extractStatus(fixture);
      
      // Extract scores
      const scores = this._extractScores(fixture);

      // Build StandardFixture DTO
      const standardFixture = {
        // Identificativi
        fixtureId: `sportmonks_${fixture.id}`,
        externalId: String(fixture.id),
        provider: this.provider,
        
        // League
        league,
        
        // Timing
        date: timing.date,
        time: timing.time,
        datetime: timing.datetime,
        timezone: timing.timezone,
        
        // Participants
        participants,
        
        // Venue
        venue,
        
        // Status
        status,
        
        // Scores
        scores,
        
        // Metadata
        meta: {
          hasOdds: Boolean(fixture.has_odds),
          isLive: status.code === 'LIVE',
          // roundId può arrivare come round_id o come round.id se abbiamo include: 'round'
          round: fixture.round_id
            ? String(fixture.round_id)
            : (fixture.round?.id ? String(fixture.round.id) : null),
          season: fixture.season_id ? String(fixture.season_id) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      // Final validation
      this._validateStandardFixture(standardFixture);
      
      return standardFixture;

    } catch (error) {
      console.error(`[SportmonksAdapter] Error mapping fixture ${fixture?.id}:`, error.message);
      throw new Error(`Failed to map Sportmonks fixture: ${error.message}`);
    }
  }

  /**
   * Estrae e normalizza i participants (teams)
   */
  _extractParticipants(fixture) {
    if (!fixture.participants || !Array.isArray(fixture.participants)) {
      throw new Error('Missing or invalid participants data');
    }

    if (fixture.participants.length !== 2) {
      throw new Error(`Expected 2 participants, got ${fixture.participants.length}`);
    }

    return fixture.participants.map(participant => {
      const role = participant.meta?.location;
      if (!role || !['home', 'away'].includes(role)) {
        throw new Error(`Invalid participant role: ${role}`);
      }

      return {
        id: String(participant.id),
        name: participant.name || 'Unknown Team',
        role: role,
        image_path: participant.image_path || null,
        shortName: participant.short_code || null
      };
    });
  }

  /**
   * Estrae info lega
   */
  _extractLeague(fixture) {
    // Supporta sia fixture.league che fixture.league_id
    const league = fixture.league || (fixture.league_id ? { id: fixture.league_id } : null);
    
    if (!league) {
      throw new Error('Missing league data');
    }

    return {
      id: String(league.id),
      name: league.name || 'Unknown League',
      logo: league.image_path || null,
      country: league.country?.name || null
    };
  }

  /**
   * Estrae info venue
   */
  _extractVenue(fixture) {
    if (!fixture.venue) {
      return null;
    }

    return {
      id: fixture.venue.id ? String(fixture.venue.id) : null,
      name: fixture.venue.name || null,
      city: fixture.venue.city_name || null,
      capacity: fixture.venue.capacity || null
    };
  }

  /**
   * Estrae info timing
   */
  _extractTiming(fixture) {
    const startingAt = fixture.starting_at;
    
    // ✅ FIX: Gestisci starting_at null/invalid (TBD fixtures)
    if (!startingAt || startingAt === null || startingAt === 'TBD') {
      // Fallback: prova a usare la data di inizio del round se inclusa
      const roundStart = fixture.round?.starting_at || fixture.round?.starting_at_date || null;
      if (roundStart) {
        const dt = new Date(roundStart);
        return {
          date: isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10),
          time: null,
          datetime: null,
          timezone: fixture.timezone || null,
          invalid: false
        };
      }
      console.warn(`[SportmonksAdapter] TBD fixture ${fixture.id}: starting_at missing or null`);
      return {
        date: null,
        time: null,
        datetime: null,
        timezone: fixture.timezone || null,
        invalid: true,
        reason: 'missing_starting_at'
      };
    }

    // Parse datetime (format: "2025-08-30 18:45:00")
    const datetime = new Date(startingAt);
    if (isNaN(datetime.getTime())) {
      console.warn(`[SportmonksAdapter] Invalid datetime for fixture ${fixture.id}: ${startingAt}`);
      return {
        date: null,
        time: null,
        datetime: null,
        timezone: fixture.timezone || null,
        invalid: true,
        reason: 'invalid_datetime_format'
      };
    }

    const date = datetime.toISOString().slice(0, 10); // YYYY-MM-DD
    const time = datetime.toTimeString().slice(0, 5);  // HH:mm

    return {
      date,
      time,
      datetime: datetime.toISOString(),
      timezone: fixture.timezone || null
    };
  }

  /**
   * Estrae e normalizza status
   */
  _extractStatus(fixture) {
    const stateId = fixture.state_id;
    const statusCode = this._normalizeStatusCode(stateId);
    
    return {
      code: statusCode,
      description: this._getStatusDescription(statusCode),
      minutes: fixture.minute || null
    };
  }

  /**
   * Normalizza i codici status di Sportmonks
   */
  _normalizeStatusCode(stateId) {
    // Mapping Sportmonks state_id -> nostro standard
    const statusMap = {
      1: 'NS',    // Not Started
      2: 'LIVE',  // Live
      3: 'FT',    // Finished
      4: 'FT',    // Finished After Extra Time
      5: 'FT',    // Finished After Penalty Shootout
      6: 'CANC',  // Cancelled
      7: 'POSTP', // Postponed
      8: 'SUSP',  // Suspended
      9: 'NS',    // To Be Determined
      10: 'HT'    // Half Time
    };

    return statusMap[stateId] || 'NS';
  }

  /**
   * Ottiene descrizione human-readable dello status
   */
  _getStatusDescription(statusCode) {
    const descriptions = {
      'NS': 'Not Started',
      'LIVE': 'Live',
      'FT': 'Full Time',
      'HT': 'Half Time',
      'CANC': 'Cancelled',
      'POSTP': 'Postponed',
      'SUSP': 'Suspended'
    };

    return descriptions[statusCode] || 'Unknown';
  }

  /**
   * Estrae scores
   */
  _extractScores(fixture) {
    if (!fixture.scores || !Array.isArray(fixture.scores)) {
      return null;
    }

    // Trova full-time score
    const ftScore = fixture.scores.find(s => s.description === 'CURRENT' || s.description === 'FT');
    const htScore = fixture.scores.find(s => s.description === 'HT');

    if (!ftScore) {
      return null;
    }

    return {
      home: ftScore.score?.participant === 'home' ? ftScore.score.goals : 
            ftScore.score?.participant === 'away' ? null : ftScore.score?.home || null,
      away: ftScore.score?.participant === 'away' ? ftScore.score.goals : 
            ftScore.score?.participant === 'home' ? null : ftScore.score?.away || null,
      halftime: htScore ? {
        home: htScore.score?.home || null,
        away: htScore.score?.away || null
      } : null
    };
  }

  /**
   * Valida il DTO finale
   */
  _validateStandardFixture(fixture) {
    // time può essere null (TBD). Richiediamo sempre date.
    const required = ['fixtureId', 'league', 'date', 'participants', 'status'];
    
    for (const field of required) {
      if (!fixture[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate league
    if (!fixture.league.id || !fixture.league.name) {
      throw new Error('Invalid league data');
    }

    // Validate participants
    if (!Array.isArray(fixture.participants) || fixture.participants.length !== 2) {
      throw new Error('Invalid participants data');
    }

    // Validate roles
    const roles = fixture.participants.map(p => p.role).sort();
    if (roles.join(',') !== 'away,home') {
      throw new Error('Invalid participant roles');
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fixture.date)) {
      throw new Error('Invalid date format');
    }

    // Validate time format solo se presente
    if (fixture.time && !/^\d{2}:\d{2}$/.test(fixture.time)) {
      throw new Error('Invalid time format');
    }
  }

  /**
   * Batch mapping per array di fixtures
   */
  mapMultipleFixtures(fixtures) {
    if (!Array.isArray(fixtures)) {
      throw new Error('Expected array of fixtures');
    }

    const results = {
      successful: [],
      failed: [],
      errors: []
    };

    fixtures.forEach((fixture, index) => {
      try {
        const mapped = this.mapToStandardFixture(fixture);
        results.successful.push(mapped);
      } catch (error) {
        results.failed.push({ index, fixture: fixture.id, error: error.message });
        results.errors.push(error.message);
      }
    });

    return results;
  }
}

module.exports = SportmonksAdapter;
