const SportmonksAdapter = require('../../src/services/providers/sportmonksAdapter');
const mockFixtures = require('../../src/services/mocks/sportmonks_fixtures.json');

describe('SportmonksAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new SportmonksAdapter();
  });

  describe('mapToStandardFixture', () => {
    test('should map valid Sportmonks fixture to StandardFixture DTO', () => {
      // Use first fixture from mock data
      const mockFixture = mockFixtures[0];
      
      const result = adapter.mapToStandardFixture(mockFixture);

      // Verify structure
      expect(result).toHaveProperty('fixtureId');
      expect(result).toHaveProperty('externalId');
      expect(result).toHaveProperty('provider', 'sportmonks');
      expect(result).toHaveProperty('league');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('time');
      expect(result).toHaveProperty('participants');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('meta');

      // Verify fixtureId format
      expect(result.fixtureId).toBe(`sportmonks_${mockFixture.id}`);
      expect(result.externalId).toBe(String(mockFixture.id));

      // Verify league
      expect(result.league.id).toBe(String(mockFixture.league_id));
      expect(result.league.name).toBeDefined();

      // Verify participants
      expect(result.participants).toHaveLength(2);
      expect(result.participants.some(p => p.role === 'home')).toBe(true);
      expect(result.participants.some(p => p.role === 'away')).toBe(true);

      // Verify date/time format
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);

      // Verify status
      expect(result.status.code).toBeDefined();
      expect(['NS', 'LIVE', 'FT', 'HT', 'CANC', 'POSTP', 'SUSP']).toContain(result.status.code);
    });

    test('should handle fixture without venue', () => {
      const mockFixture = { ...mockFixtures[0] };
      delete mockFixture.venue;

      const result = adapter.mapToStandardFixture(mockFixture);
      
      expect(result.venue).toBeNull();
    });

    test('should handle fixture without scores', () => {
      const mockFixture = { ...mockFixtures[0] };
      delete mockFixture.scores;

      const result = adapter.mapToStandardFixture(mockFixture);
      
      expect(result.scores).toBeNull();
    });

    test('should throw error for invalid fixture data', () => {
      expect(() => adapter.mapToStandardFixture(null)).toThrow('Invalid fixture data');
      expect(() => adapter.mapToStandardFixture({})).toThrow();
      expect(() => adapter.mapToStandardFixture({ id: 1 })).toThrow(); // Missing required fields
    });

    test('should throw error for missing participants', () => {
      const invalidFixture = { ...mockFixtures[0] };
      delete invalidFixture.participants;

      expect(() => adapter.mapToStandardFixture(invalidFixture)).toThrow('Missing or invalid participants data');
    });

    test('should throw error for wrong number of participants', () => {
      const invalidFixture = { ...mockFixtures[0] };
      invalidFixture.participants = [mockFixtures[0].participants[0]]; // Only one participant

      expect(() => adapter.mapToStandardFixture(invalidFixture)).toThrow('Expected 2 participants, got 1');
    });

    test('should throw error for missing league data', () => {
      const invalidFixture = { ...mockFixtures[0] };
      delete invalidFixture.league_id;
      delete invalidFixture.league;

      expect(() => adapter.mapToStandardFixture(invalidFixture)).toThrow('Missing league data');
    });

    test('should throw error for invalid datetime', () => {
      const invalidFixture = { ...mockFixtures[0] };
      invalidFixture.starting_at = 'invalid-date';

      expect(() => adapter.mapToStandardFixture(invalidFixture)).toThrow('Invalid datetime format');
    });
  });

  describe('mapMultipleFixtures', () => {
    test('should map multiple valid fixtures', () => {
      const result = adapter.mapMultipleFixtures(mockFixtures);

      expect(result).toHaveProperty('successful');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('errors');

      expect(Array.isArray(result.successful)).toBe(true);
      expect(Array.isArray(result.failed)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);

      // Should have some successful mappings
      expect(result.successful.length).toBeGreaterThan(0);
    });

    test('should handle mixed valid/invalid fixtures', () => {
      const mixedFixtures = [
        mockFixtures[0], // Valid
        { id: 'invalid' }, // Invalid
        mockFixtures[1] // Valid
      ];

      const result = adapter.mapMultipleFixtures(mixedFixtures);

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    test('should throw error for non-array input', () => {
      expect(() => adapter.mapMultipleFixtures(null)).toThrow('Expected array of fixtures');
      expect(() => adapter.mapMultipleFixtures({})).toThrow('Expected array of fixtures');
    });
  });

  describe('_normalizeStatusCode', () => {
    test('should normalize known status codes', () => {
      expect(adapter._normalizeStatusCode(1)).toBe('NS');
      expect(adapter._normalizeStatusCode(2)).toBe('LIVE');
      expect(adapter._normalizeStatusCode(3)).toBe('FT');
      expect(adapter._normalizeStatusCode(6)).toBe('CANC');
      expect(adapter._normalizeStatusCode(7)).toBe('POSTP');
    });

    test('should default to NS for unknown status codes', () => {
      expect(adapter._normalizeStatusCode(999)).toBe('NS');
      expect(adapter._normalizeStatusCode(null)).toBe('NS');
    });
  });

  describe('_validateStandardFixture', () => {
    test('should validate correct StandardFixture', () => {
      const validFixture = adapter.mapToStandardFixture(mockFixtures[0]);
      
      // Should not throw
      expect(() => adapter._validateStandardFixture(validFixture)).not.toThrow();
    });

    test('should throw for missing required fields', () => {
      const invalidFixture = {
        fixtureId: 'test',
        // Missing other required fields
      };

      expect(() => adapter._validateStandardFixture(invalidFixture)).toThrow('Missing required field');
    });

    test('should throw for invalid date format', () => {
      const mockStandardFixture = adapter.mapToStandardFixture(mockFixtures[0]);
      mockStandardFixture.date = 'invalid-date';

      expect(() => adapter._validateStandardFixture(mockStandardFixture)).toThrow('Invalid date format');
    });

    test('should throw for invalid time format', () => {
      const mockStandardFixture = adapter.mapToStandardFixture(mockFixtures[0]);
      mockStandardFixture.time = 'invalid-time';

      expect(() => adapter._validateStandardFixture(mockStandardFixture)).toThrow('Invalid time format');
    });

    test('should throw for wrong number of participants', () => {
      const mockStandardFixture = adapter.mapToStandardFixture(mockFixtures[0]);
      mockStandardFixture.participants = [mockStandardFixture.participants[0]]; // Only one

      expect(() => adapter._validateStandardFixture(mockStandardFixture)).toThrow('Invalid participants data');
    });

    test('should throw for invalid participant roles', () => {
      const mockStandardFixture = adapter.mapToStandardFixture(mockFixtures[0]);
      mockStandardFixture.participants[0].role = 'invalid';

      expect(() => adapter._validateStandardFixture(mockStandardFixture)).toThrow('Invalid participant roles');
    });
  });
});
