const mongoose = require('mongoose');

// Connessione al database
mongoose.connect('mongodb://localhost:27017/sports', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schema delle prenotazioni (semplificato per il test)
const BookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model('Booking', BookingSchema);

async function checkVenueFormat() {
  try {
    console.log('🔍 === VERIFICA FORMATO VENUE ===\n');

    const targetVenueId = '687d45342d2acfd80e82dd19';
    const targetTenantId = '687d45182d2acfd80e82dd05';

    // Trova le prenotazioni per questo tenant
    console.log('1️⃣ PRENOTAZIONI PER TENANT:');
    const tenantBookings = await Booking.find({ tenantId: new mongoose.Types.ObjectId(targetTenantId) });
    console.log(`   Prenotazioni trovate: ${tenantBookings.length}`);
    
    if (tenantBookings.length > 0) {
      console.log('\n2️⃣ FORMATO VENUE NELLE PRENOTAZIONI:');
      tenantBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ID: ${booking._id}`);
        console.log(`      venue: "${booking.venue}" (type: ${typeof booking.venue})`);
        console.log(`      venue === targetVenueId: ${booking.venue === targetVenueId}`);
        console.log(`      venue toString() === targetVenueId: ${booking.venue.toString() === targetVenueId}`);
        console.log('');
      });

      // Test query con venue come stringa
      console.log('3️⃣ TEST QUERY VENUE COME STRINGA:');
      const stringQuery = await Booking.find({ 
        tenantId: new mongoose.Types.ObjectId(targetTenantId),
        venue: targetVenueId  // Come stringa
      });
      console.log(`   Risultati con venue stringa: ${stringQuery.length}`);

      // Test query con venue come ObjectId
      console.log('\n4️⃣ TEST QUERY VENUE COME OBJECTID:');
      const objectIdQuery = await Booking.find({ 
        tenantId: new mongoose.Types.ObjectId(targetTenantId),
        venue: new mongoose.Types.ObjectId(targetVenueId)  // Come ObjectId
      });
      console.log(`   Risultati con venue ObjectId: ${objectIdQuery.length}`);

      // Test query con $in array misto
      console.log('\n5️⃣ TEST QUERY $IN MISTO:');
      const mixedQuery = await Booking.find({ 
        tenantId: new mongoose.Types.ObjectId(targetTenantId),
        venue: { 
          $in: [
            targetVenueId,  // Come stringa
            new mongoose.Types.ObjectId(targetVenueId)  // Come ObjectId
          ] 
        }
      });
      console.log(`   Risultati con $in misto: ${mixedQuery.length}`);
    }

  } catch (error) {
    console.error('❌ Errore durante la verifica:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkVenueFormat(); 