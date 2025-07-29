const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');

// Connessione al database
mongoose.connect('mongodb://localhost:27017/sports', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testBookingCreation() {
  try {
    console.log('🧪 === TEST CREAZIONE PRENOTAZIONE ===\n');

    const testTenantId = '687d45182d2acfd80e82dd05';
    const testVenueId = '687d45342d2acfd80e82dd19';

    // Crea prenotazione di test
    const bookingData = {
      venue: testVenueId,
      user: new mongoose.Types.ObjectId('684977d5050e0ac38958a99e'),
      bookingDate: new Date('2025-07-25'),
      startTime: '20:00',
      endTime: '22:00',
      partySize: 2,
      customerName: 'Test Debug User',
      customerEmail: 'test@debug.com',
      customerPhone: '+39123456789',
      specialRequests: 'Debug test booking',
      totalPrice: 0,
      bookingType: 'general_dining',
      source: 'website',
      tenantId: new mongoose.Types.ObjectId(testTenantId) // Esplicitamente come ObjectId
    };

    console.log('📝 Dati prenotazione da salvare:');
    console.log(JSON.stringify(bookingData, null, 2));

    // Salva nel database
    const booking = new Booking(bookingData);
    const savedBooking = await booking.save();

    console.log('\n✅ Prenotazione salvata con ID:', savedBooking._id);
    console.log('📋 Dati salvati nel database:');
    console.log(JSON.stringify(savedBooking.toObject(), null, 2));

    // Rileggi dal database per verificare
    const foundBooking = await Booking.findById(savedBooking._id);
    console.log('\n🔍 Prenotazione riletta dal database:');
    console.log('tenantId type:', typeof foundBooking.tenantId);
    console.log('tenantId value:', foundBooking.tenantId);
    console.log('tenantId toString():', foundBooking.tenantId?.toString());

    // Test query con tenantId
    console.log('\n🔍 Test query con tenantId:');
    const queryResult = await Booking.find({ tenantId: testTenantId });
    console.log(`Query result count: ${queryResult.length}`);
    
    if (queryResult.length > 0) {
      console.log('✅ Query con tenantId funziona!');
    } else {
      console.log('❌ Query con tenantId NON funziona!');
      
      // Prova query con ObjectId
      const objectIdQuery = await Booking.find({ tenantId: new mongoose.Types.ObjectId(testTenantId) });
      console.log(`Query con ObjectId result count: ${objectIdQuery.length}`);
      
      if (objectIdQuery.length > 0) {
        console.log('✅ Query con ObjectId funziona!');
      } else {
        console.log('❌ Anche query con ObjectId NON funziona!');
      }
    }

    // Cleanup - rimuovi prenotazione di test
    await Booking.findByIdAndDelete(savedBooking._id);
    console.log('\n🗑️ Prenotazione di test rimossa');

  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  } finally {
    mongoose.connection.close();
  }
}

testBookingCreation(); 