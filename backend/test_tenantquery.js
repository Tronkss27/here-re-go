const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const TenantQuery = require('./src/utils/tenantQuery');

// Connessione al database
mongoose.connect('mongodb://localhost:27017/sports', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testTenantQuery() {
  try {
    console.log('🧪 === TEST TENANTQUERY ===\n');

    const testTenantId = '687d45182d2acfd80e82dd05';
    const testVenueId = '687d45342d2acfd80e82dd19';

    // Test 1: Query diretta (quella che funzionava)
    console.log('1️⃣ TEST QUERY DIRETTA:');
    const directQuery = await Booking.find({ tenantId: testTenantId });
    console.log(`   Risultati query diretta: ${directQuery.length}`);

    // Test 2: Query diretta con ObjectId
    console.log('\n2️⃣ TEST QUERY CON OBJECTID:');
    const objectIdQuery = await Booking.find({ tenantId: new mongoose.Types.ObjectId(testTenantId) });
    console.log(`   Risultati query ObjectId: ${objectIdQuery.length}`);

    // Test 3: TenantQuery.find() (quella che non funziona)
    console.log('\n3️⃣ TEST TENANTQUERY.FIND():');
    const tenantQueryResult = await TenantQuery.find(Booking, testTenantId, {});
    console.log(`   Risultati TenantQuery: ${tenantQueryResult.length}`);

    // Test 4: TenantQuery.find() con filtro venue (come nel controller)
    console.log('\n4️⃣ TEST TENANTQUERY CON FILTRO VENUE:');
    const filter = {
      venue: {
        '$in': [
          new mongoose.Types.ObjectId('687d45182d2acfd80e82dd07'),
          new mongoose.Types.ObjectId(testVenueId)
        ]
      }
    };
    console.log('   Filter usato:', JSON.stringify(filter, null, 2));
    
    const tenantQueryWithFilter = await TenantQuery.find(Booking, testTenantId, filter);
    console.log(`   Risultati TenantQuery con filtro: ${tenantQueryWithFilter.length}`);

    // Test 5: Query diretta con lo stesso filtro
    console.log('\n5️⃣ TEST QUERY DIRETTA CON STESSO FILTRO:');
    const directQueryWithFilter = await Booking.find({
      tenantId: new mongoose.Types.ObjectId(testTenantId),
      ...filter
    });
    console.log(`   Risultati query diretta con filtro: ${directQueryWithFilter.length}`);

    // Test 6: Verifica cosa restituisce addTenantFilter
    console.log('\n6️⃣ TEST ADDTENANTFILTER:');
    const tenantFilter = TenantQuery.addTenantFilter(filter, testTenantId);
    console.log('   Filtro generato da addTenantFilter:');
    console.log(JSON.stringify(tenantFilter, null, 2));

    // Test 7: Query manuale con il filtro generato
    console.log('\n7️⃣ TEST QUERY MANUALE CON FILTRO GENERATO:');
    const manualQuery = await Booking.find(tenantFilter);
    console.log(`   Risultati query manuale: ${manualQuery.length}`);

  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  } finally {
    mongoose.connection.close();
  }
}

testTenantQuery(); 