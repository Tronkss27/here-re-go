#!/usr/bin/env node

/**
 * 🧪 TEST ACCESSO VENUE PUBBLICO
 * 
 * Questo script testa se riusciamo ad accedere ai venue dal frontend
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:5174';

// Colori per output console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('blue', '\n🧪 TEST ACCESSO VENUE PUBBLICO\n');

  try {
    // Step 1: Controlla che il backend sia attivo
    log('yellow', '1. Controllo stato backend...');
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`);
      log('green', '✅ Backend attivo: ' + healthResponse.data.message);
    } catch (error) {
      log('red', '❌ Backend non raggiungibile: ' + error.message);
      return;
    }

    // Step 2: Prova a creare un venue di test
    log('yellow', '2. Creazione venue di test...');
    let testVenueId = null;
    try {
      const venueData = {
        name: "Test Venue Access",
        contact: {
          email: "test@testaccess.com",
          phone: "3331234567"
        },
        location: {
          address: {
            street: "Via Test Access 123",
            city: "Milano",
            postalCode: "20121"
          }
        },
        capacity: {
          total: 50
        }
      };

      const createResponse = await axios.post(`${API_BASE}/venues/test`, venueData, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (createResponse.data.success) {
        testVenueId = createResponse.data.data._id;
        log('green', '✅ Venue creato: ' + testVenueId);
      } else {
        log('red', '❌ Errore creazione venue: ' + createResponse.data.error);
        return;
      }
    } catch (error) {
      log('red', '❌ Errore creazione venue: ' + error.message);
      return;
    }

    // Step 3: Prova tutte le possibili route per accedere al venue
    log('yellow', '3. Test accesso venue con diverse route...');
    
    const routesToTest = [
      `/venues/${testVenueId}`,
      `/venues/details/${testVenueId}`,
      `/venues/public/${testVenueId}`,
      `/venues/venue_${testVenueId}`,
      `/venues/details/venue_${testVenueId}`
    ];

    for (const route of routesToTest) {
      try {
        log('blue', `   Testando: ${API_BASE}${route}`);
        const response = await axios.get(`${API_BASE}${route}`);
        if (response.data.success) {
          log('green', `   ✅ SUCCESSO! Route: ${route}`);
          log('green', `   📝 Venue trovato: ${response.data.data.name}`);
          
          // Test con frontend se questo endpoint funziona
          log('yellow', '4. Test integrazione frontend...');
          const frontendTestUrl = `${FRONTEND_BASE}/venue/${testVenueId}`;
          log('blue', `   Frontend URL: ${frontendTestUrl}`);
          log('green', '   📋 Ora puoi testare manualmente il frontend!');
          return;
        }
      } catch (error) {
        if (error.response?.status === 401) {
          log('red', `   ❌ 401 Unauthorized: ${route}`);
        } else if (error.response?.status === 404) {
          log('yellow', `   ⚠️  404 Not Found: ${route}`);
        } else {
          log('red', `   ❌ Error: ${route} - ${error.message}`);
        }
      }
    }

    log('red', '❌ Nessuna route funziona! Il problema è nel middleware di autenticazione.');

  } catch (error) {
    log('red', '❌ Errore generale del test: ' + error.message);
  }
}

main().catch(console.error); 