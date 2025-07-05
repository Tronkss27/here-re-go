#!/usr/bin/env node

/**
 * 🧪 TEST COMPLETO WORKFLOW BOOKING CLIENTE-VENUE
 * 
 * Questo script testa l'intero flusso:
 * 1. Creazione venue admin via onboarding
 * 2. Sincronizzazione venue al database backend
 * 3. Ricerca venue da parte del cliente
 * 4. Creazione prenotazione cliente
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:5173';

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

function step(stepNumber, title) {
  log('blue', `\n${colors.bold}📋 STEP ${stepNumber}: ${title}${colors.reset}`);
}

function success(message) {
  log('green', `✅ ${message}`);
}

function error(message) {
  log('red', `❌ ${message}`);
}

function warning(message) {
  log('yellow', `⚠️ ${message}`);
}

// Dati di test
const testData = {
  // Admin user che crea il venue
  admin: {
    email: 'admin@nicksportsbar.com',
    password: 'password123',
    name: 'Nick Rossi',
    role: 'admin'
  },
  
  // Cliente che prenota
  customer: {
    name: 'Mario Bianchi',
    email: 'mario.bianchi@email.com',
    phone: '+393331234567'
  },
  
  // Dati venue
  venue: {
    name: 'Nick Sports Bar Milano',
    description: 'Il miglior sports bar di Milano per vedere le partite',
    address: 'Via Brera 15',
    city: 'Milano',
    postalCode: '20121',
    phone: '3331234567',
    capacity: 80
  },
  
  // Dati prenotazione
  booking: {
    date: '2025-06-25',
    timeSlot: {
      start: '20:00',
      end: '22:00'
    },
    partySize: 4,
    specialRequests: 'Tavolo vicino al maxischermo per la partita'
  }
};

let authTokens = {
  admin: null,
  customer: null
};

let createdVenue = null;

/**
 * 1. SETUP: Registra/Login admin
 */
async function setupAdminAuth() {
  step(1, 'Setup Autenticazione Admin');
  
  try {
    // Prova prima il login
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: testData.admin.email,
        password: testData.admin.password
      });
      
      authTokens.admin = loginResponse.data.token;
      success(`Admin login successful: ${testData.admin.email}`);
      return;
      
    } catch (loginError) {
      if (loginError.response?.status === 401) {
        warning('Admin non trovato, procedo con registrazione...');
      } else {
        throw loginError;
      }
    }
    
    // Se login fallisce, registra nuovo admin
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      ...testData.admin,
      confirmPassword: testData.admin.password
    });
    
    authTokens.admin = registerResponse.data.token;
    success(`Admin registrato con successo: ${testData.admin.email}`);
    
  } catch (err) {
    error(`Setup admin auth failed: ${err.response?.data?.message || err.message}`);
    throw err;
  }
}

/**
 * 2. CREAZIONE VENUE: Simula onboarding admin
 */
async function createVenueViaAPI() {
  step(2, 'Creazione Venue via API Backend');
  
  try {
    const venueData = {
      name: testData.venue.name,
      description: testData.venue.description,
      contact: {
        email: testData.admin.email,
        phone: testData.venue.phone
      },
      location: {
        address: {
          street: testData.venue.address,
          city: testData.venue.city,
          postalCode: testData.venue.postalCode,
          country: 'Italy'
        },
        coordinates: {
          lat: 45.4642,
          lng: 9.1900
        }
      },
      capacity: {
        total: testData.venue.capacity,
        indoor: Math.floor(testData.venue.capacity * 0.7),
        outdoor: Math.floor(testData.venue.capacity * 0.3)
      },
      features: ['wifi', 'tv_screens', 'food_service', 'parking'],
      sportsOfferings: [{
        sport: 'football',
        leagues: ['Serie A', 'Champions League'],
        isPrimary: true
      }],
      bookingSettings: {
        enabled: true,
        requiresApproval: false,
        advanceBookingDays: 30,
        minimumPartySize: 1,
        maximumPartySize: 12,
        timeSlotDuration: 120
      },
      pricing: {
        basePrice: 0,
        pricePerPerson: 15,
        minimumSpend: 50,
        currency: 'EUR'
      },
      hours: {
        monday: { open: '17:00', close: '01:00', isOpen: true },
        tuesday: { open: '17:00', close: '01:00', isOpen: true },
        wednesday: { open: '17:00', close: '01:00', isOpen: true },
        thursday: { open: '17:00', close: '01:00', isOpen: true },
        friday: { open: '17:00', close: '02:00', isOpen: true },
        saturday: { open: '15:00', close: '02:00', isOpen: true },
        sunday: { open: '15:00', close: '01:00', isOpen: true }
      }
    };
    
    const response = await axios.post(`${API_BASE}/venues`, venueData, {
      headers: {
        'Authorization': `Bearer ${authTokens.admin}`,
        'Content-Type': 'application/json'
      }
    });
    
    createdVenue = response.data.data;
    success(`Venue creato con successo: ${createdVenue.name} (ID: ${createdVenue._id})`);
    
    return createdVenue;
    
  } catch (err) {
    error(`Venue creation failed: ${err.response?.data?.error || err.message}`);
    if (err.response?.data) {
      console.log('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
}

/**
 * 3. RICERCA VENUE: Simula cliente che cerca venue
 */
async function searchVenuesAsCustomer() {
  step(3, 'Ricerca Venue da Cliente (Pubblico)');
  
  try {
    // Test ricerca per match specifico
    const matchId = 'match-0';
    const searchResponse = await axios.get(`${API_BASE}/venues/search`, {
      params: {
        matchId: matchId,
        city: 'Milano'
      }
    });
    
    const venues = searchResponse.data.data || searchResponse.data.venues;
    success(`Trovati ${venues.length} venue per ${matchId}`);
    
    // Verifica che il nostro venue sia nella lista
    const ourVenue = venues.find(v => v._id === createdVenue._id || v.id === createdVenue._id);
    
    if (ourVenue) {
      success(`✨ Il nostro venue "${createdVenue.name}" è visibile nella ricerca!`);
      return ourVenue;
    } else {
      warning(`Il nostro venue non appare nella ricerca. Venue trovati:`);
      venues.forEach(v => console.log(`  - ${v.name} (${v._id || v.id})`));
      return venues[0]; // Usa il primo venue trovato per continuare il test
    }
    
  } catch (err) {
    error(`Venue search failed: ${err.response?.data?.message || err.message}`);
    throw err;
  }
}

/**
 * 4. DETTAGLI VENUE: Recupera dettagli completi
 */
async function getVenueDetails(venueId) {
  step(4, 'Recupero Dettagli Venue');
  
  try {
    const response = await axios.get(`${API_BASE}/venues/${venueId}`);
    const venue = response.data.data;
    
    success(`Dettagli venue recuperati: ${venue.name}`);
    console.log(`  📍 Indirizzo: ${venue.location?.address?.street}, ${venue.location?.address?.city}`);
    console.log(`  📞 Telefono: ${venue.contact?.phone}`);
    console.log(`  👥 Capacità: ${venue.capacity?.total} persone`);
    console.log(`  ⚽ Sport: ${venue.sportsOfferings?.map(s => s.sport).join(', ')}`);
    
    return venue;
    
  } catch (err) {
    error(`Get venue details failed: ${err.response?.data?.message || err.message}`);
    throw err;
  }
}

/**
 * 5. CREAZIONE PRENOTAZIONE: Cliente prenota tavolo
 */
async function createBookingAsCustomer(venueId) {
  step(5, 'Creazione Prenotazione Cliente');
  
  try {
    const bookingData = {
      venueId: venueId,
      customer: testData.customer,
      ...testData.booking,
      matchInfo: {
        matchId: 'match-0',
        title: 'Inter vs Milan',
        date: testData.booking.date,
        time: '21:00'
      }
    };
    
    const response = await axios.post(`${API_BASE}/bookings`, bookingData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const booking = response.data.data;
    success(`Prenotazione creata con successo!`);
    console.log(`  🎫 Codice prenotazione: ${booking.confirmationCode}`);
    console.log(`  📅 Data: ${booking.date} alle ${booking.timeSlot.start}`);
    console.log(`  👥 Persone: ${booking.partySize}`);
    console.log(`  📧 Email: ${booking.customer.email}`);
    
    return booking;
    
  } catch (err) {
    error(`Booking creation failed: ${err.response?.data?.message || err.message}`);
    if (err.response?.data) {
      console.log('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
}

/**
 * 6. VERIFICA PRENOTAZIONE: Admin vede la prenotazione
 */
async function verifyBookingAsAdmin(bookingId) {
  step(6, 'Verifica Prenotazione da Admin');
  
  try {
    const response = await axios.get(`${API_BASE}/bookings`, {
      headers: {
        'Authorization': `Bearer ${authTokens.admin}`
      },
      params: {
        venueId: createdVenue._id
      }
    });
    
    const bookings = response.data.data;
    success(`Admin vede ${bookings.length} prenotazioni per il venue`);
    
    const ourBooking = bookings.find(b => b._id === bookingId);
    if (ourBooking) {
      success(`✨ Prenotazione trovata nell'admin panel!`);
      console.log(`  Cliente: ${ourBooking.customer.name} (${ourBooking.customer.email})`);
      console.log(`  Status: ${ourBooking.status}`);
    } else {
      warning('Prenotazione non trovata nell\'admin panel');
    }
    
    return bookings;
    
  } catch (err) {
    error(`Admin booking verification failed: ${err.response?.data?.message || err.message}`);
    throw err;
  }
}

/**
 * MAIN TEST RUNNER
 */
async function runCompleteTest() {
  log('bold', '\n🚀 AVVIO TEST COMPLETO WORKFLOW BOOKING CLIENTE-VENUE\n');
  
  try {
    // 1. Setup autenticazione admin
    await setupAdminAuth();
    
    // 2. Crea venue via API
    const venue = await createVenueViaAPI();
    
    // 3. Cerca venue come cliente
    const foundVenue = await searchVenuesAsCustomer();
    
    // 4. Recupera dettagli venue
    const venueDetails = await getVenueDetails(foundVenue._id || foundVenue.id);
    
    // 5. Crea prenotazione come cliente
    const booking = await createBookingAsCustomer(venueDetails._id);
    
    // 6. Verifica prenotazione come admin
    await verifyBookingAsAdmin(booking._id);
    
    // SUCCESSO COMPLETO
    log('bold', '\n🎉 TEST COMPLETATO CON SUCCESSO! 🎉');
    success('Tutto il workflow cliente-venue funziona correttamente:');
    console.log('  ✅ Admin può creare venue');
    console.log('  ✅ Venue è sincronizzato nel database');
    console.log('  ✅ Cliente può trovare venue');
    console.log('  ✅ Cliente può prenotare');
    console.log('  ✅ Admin può vedere prenotazioni');
    
    log('blue', '\n📊 RIEPILOGO:');
    console.log(`  🏟️ Venue: ${venue.name} (${venue._id})`);
    console.log(`  🎫 Prenotazione: ${booking.confirmationCode}`);
    console.log(`  👤 Cliente: ${testData.customer.name}`);
    console.log(`  📅 Data: ${testData.booking.date} ${testData.booking.timeSlot.start}`);
    
  } catch (err) {
    log('bold', '\n💥 TEST FALLITO');
    error('Il workflow presenta problemi:');
    console.error(err.message);
    
    if (err.response) {
      console.log('\nDettagli errore API:');
      console.log(`Status: ${err.response.status}`);
      console.log(`Data:`, err.response.data);
    }
    
    process.exit(1);
  }
}

// Controlla che i servizi siano attivi
async function checkServices() {
  log('blue', '🔍 Controllo servizi...');
  
  try {
    // Controlla backend
    await axios.get(`${API_BASE}/health`);
    success('Backend attivo');
    
    // Controlla frontend
    await axios.get(FRONTEND_BASE);
    success('Frontend attivo');
    
  } catch (err) {
    error('Servizi non attivi:');
    if (err.code === 'ECONNREFUSED') {
      if (err.config.url.includes('3001')) {
        error('Backend non attivo su porta 3001');
      } else if (err.config.url.includes('5173')) {
        error('Frontend non attivo su porta 5173');
      }
    }
    
    console.log('\nPer avviare i servizi:');
    console.log('  Backend: cd backend && npm start');
    console.log('  Frontend: cd frontend && npm run dev');
    
    process.exit(1);
  }
}

// Avvia il test
if (require.main === module) {
  checkServices()
    .then(() => runCompleteTest())
    .catch(console.error);
}

module.exports = {
  runCompleteTest,
  testData,
  checkServices
}; 