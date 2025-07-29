const mongoose = require('mongoose');

// Connessione al database
mongoose.connect('mongodb://localhost:27017/sports', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schema delle prenotazioni (semplificato per il test)
const BookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model('Booking', BookingSchema);

// Schema dei venue (semplificato per il test)  
const VenueSchema = new mongoose.Schema({}, { strict: false });
const Venue = mongoose.model('Venue', VenueSchema);

// Schema dei tenant (semplificato per il test)
const TenantSchema = new mongoose.Schema({}, { strict: false });
const Tenant = mongoose.model('Tenant', TenantSchema);

async function investigateDatabase() {
  try {
    console.log('🔍 === INVESTIGAZIONE DATABASE COMPLETA ===\n');

    // 1. Verifica tutti i tenant
    console.log('1️⃣ TENANT NEL DATABASE:');
    const tenants = await Tenant.find({});
    tenants.forEach(tenant => {
      console.log(`   - ${tenant._id}: ${tenant.name} (${tenant.subdomain})`);
    });
    console.log(`   TOTALE TENANT: ${tenants.length}\n`);

    // 2. Verifica tutti i venue
    console.log('2️⃣ VENUE NEL DATABASE:');
    const venues = await Venue.find({});
    venues.forEach(venue => {
      console.log(`   - ${venue._id}: ${venue.name} (tenant: ${venue.tenantId})`);
    });
    console.log(`   TOTALE VENUE: ${venues.length}\n`);

    // 3. Verifica TUTTE le prenotazioni (senza filtri)
    console.log('3️⃣ PRENOTAZIONI NEL DATABASE (TUTTE):');
    const allBookings = await Booking.find({});
    console.log(`   TOTALE PRENOTAZIONI: ${allBookings.length}`);
    
    if (allBookings.length > 0) {
      allBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ID: ${booking._id}`);
        console.log(`      Venue: ${booking.venue}`);
        console.log(`      Tenant: ${booking.tenantId || 'NESSUNO!'}`);
        console.log(`      Cliente: ${booking.customerName}`);
        console.log(`      Data: ${booking.bookingDate}`);
        console.log(`      Status: ${booking.status}`);
        console.log(`      Creato: ${booking.createdAt}\n`);
      });
    } else {
      console.log('   ❌ NESSUNA PRENOTAZIONE TROVATA!\n');
    }

    // 4. Verifica prenotazioni per tenant specifico
    const targetTenantId = '687d45182d2acfd80e82dd05';
    console.log(`4️⃣ PRENOTAZIONI PER TENANT ${targetTenantId}:`);
    const tenantBookings = await Booking.find({ tenantId: targetTenantId });
    console.log(`   PRENOTAZIONI CON TENANT ID: ${tenantBookings.length}`);
    
    // 5. Verifica prenotazioni per venue specifico
    const targetVenueId = '687d45342d2acfd80e82dd19';
    console.log(`5️⃣ PRENOTAZIONI PER VENUE ${targetVenueId}:`);
    const venueBookings = await Booking.find({ venue: targetVenueId });
    console.log(`   PRENOTAZIONI CON VENUE ID: ${venueBookings.length}`);
    
    // 6. Verifica prenotazioni senza tenantId
    console.log(`6️⃣ PRENOTAZIONI SENZA TENANT ID:`);
    const orphanBookings = await Booking.find({ tenantId: { $exists: false } });
    console.log(`   PRENOTAZIONI ORFANE: ${orphanBookings.length}`);
    
    if (orphanBookings.length > 0) {
      orphanBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ID: ${booking._id} - Venue: ${booking.venue} - Cliente: ${booking.customerName}`);
      });
    }

    // 7. Verifica prenotazioni con tenantId null o vuoto
    console.log(`7️⃣ PRENOTAZIONI CON TENANT NULL/VUOTO:`);
    const nullTenantBookings = await Booking.find({ 
      $or: [
        { tenantId: null },
        { tenantId: '' },
        { tenantId: undefined }
      ]
    });
    console.log(`   PRENOTAZIONI CON TENANT NULL: ${nullTenantBookings.length}`);

    console.log('\n🎯 === FINE INVESTIGAZIONE ===');

  } catch (error) {
    console.error('❌ Errore durante l\'investigazione:', error);
  } finally {
    mongoose.connection.close();
  }
}

investigateDatabase(); 