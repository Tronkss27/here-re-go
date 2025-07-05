#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5174';
const VENUE_ID = '685ac7b0d6ca2887feec3d75';

console.log('🚀 TESTING WORKFLOW COMPLETO SPOrTS\n');

async function testAPI() {
  try {
    // Test 1: Verifica Backend
    console.log('1. 🔍 Testing Backend Health...');
    const healthCheck = await axios.get(`${BASE_URL}/api/health`).catch(() => null);
    console.log(healthCheck ? '✅ Backend: ONLINE' : '❌ Backend: OFFLINE');

    // Test 2: Verifica Frontend
    console.log('\n2. 🔍 Testing Frontend Health...');
    const frontendCheck = await axios.get(FRONTEND_URL).catch(() => null);
    console.log(frontendCheck ? '✅ Frontend: ONLINE' : '❌ Frontend: OFFLINE');

    // Test 3: Verifica Venue Pubblico
    console.log('\n3. 🔍 Testing Venue API...');
    const venueResponse = await axios.get(`${BASE_URL}/api/venues/public/${VENUE_ID}`);
    const venue = venueResponse.data.data;
    console.log('✅ Venue Data:', {
      id: venue._id,
      name: venue.name,
      status: venue.status,
      isActive: venue.isActive
    });

    // Test 4: Verifica Availability
    console.log('\n4. 🔍 Testing Availability API...');
    const availabilityResponse = await axios.get(`${BASE_URL}/api/bookings/availability/${VENUE_ID}?date=2025-06-25`);
    const slots = availabilityResponse.data.data.slots;
    console.log(`✅ Slots Disponibili: ${slots.length}`);
    console.log('📅 Primo slot:', slots[0]);

    // Test 5: Verifica Lista Venues
    console.log('\n5. 🔍 Testing Venues List...');
    const venuesResponse = await axios.get(`${BASE_URL}/api/venues/search`);
    const venues = venuesResponse.data.data;
    console.log(`✅ Venues trovati: ${venues.length}`);

    // Test 6: Test Prenotazione (Mock)
    console.log('\n6. 🔍 Testing Booking Creation...');
    const testBooking = {
      venueId: VENUE_ID,
      date: '2025-06-25',
      timeSlot: '19:00-21:00',
      guests: 4,
      customerInfo: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+39 123 456 7890'
      }
    };

    const bookingResponse = await axios.post(`${BASE_URL}/api/bookings`, testBooking);
    console.log('✅ Prenotazione Test creata:', bookingResponse.data.data._id);

    // Test 7: URLs Frontend da testare
    console.log('\n7. 📋 URLs Frontend da testare manualmente:');
    console.log(`🔗 Homepage: ${FRONTEND_URL}/`);
    console.log(`🔗 Lista Locali: ${FRONTEND_URL}/locali`);
    console.log(`🔗 Venue Pubblico: ${FRONTEND_URL}/venue/${VENUE_ID}`);
    console.log(`🔗 Admin Login: ${FRONTEND_URL}/admin/login`);

    console.log('\n✅ TUTTI I TEST API COMPLETATI CON SUCCESSO!');

  } catch (error) {
    console.error('\n❌ ERRORE NEL TESTING:', error.message);
    if (error.response) {
      console.error('📄 Dettagli errore:', error.response.data);
    }
  }
}

// Funzione per testing manuale guidato
function printManualTestGuide() {
  console.log('\n🎯 GUIDA TESTING MANUALE:');
  console.log('\n📝 CHECKLIST WORKFLOW COMPLETO:');
  
  console.log('\n🔸 FASE 1: Homepage e Navigazione');
  console.log('   □ Aprire http://localhost:5174/');
  console.log('   □ Verificare caricamento homepage');
  console.log('   □ Click su "Trova Locali"');
  
  console.log('\n🔸 FASE 2: Lista Venues');
  console.log('   □ Verificare presenza "Sports Arena Milano"');
  console.log('   □ Click su "Visualizza"');
  
  console.log('\n🔸 FASE 3: Pagina Venue');
  console.log('   □ Verificare caricamento info venue');
  console.log('   □ Compilare form prenotazione');
  console.log('   □ Click "Conferma Definitiva"');
  
  console.log('\n🔸 FASE 4: Admin Dashboard');
  console.log('   □ Aprire http://localhost:5174/admin/login');
  console.log('   □ Login con credenziali admin');
  console.log('   □ Verificare "Mostra profilo pubblico"');
  
  console.log('\n🔸 FASE 5: Propagazione Dati');
  console.log('   □ Creare evento da admin');
  console.log('   □ Verificare in homepage');
  console.log('   □ Verificare prenotabilità');
}

// Esegui i test
testAPI().then(() => {
  printManualTestGuide();
}); 