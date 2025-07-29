const mongoose = require('mongoose');
const Venue = require('../src/models/Venue');

// Script per rimuovere tutti i venue demo/mock dal database
async function cleanupDemoVenues() {
  try {
    // Connetti al database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports-bar');
    console.log('✅ Connesso al database');

    // Trova e rimuovi tutti i venue demo
    const demoVenuePatterns = [
      { name: /Demo Sports Bar/i },
      { name: /Demo\s/i },
      { name: /Test\s/i },
      { name: /Mock\s/i },
      { name: /Default\s/i }
    ];

    for (const pattern of demoVenuePatterns) {
      const result = await Venue.deleteMany(pattern);
      if (result.deletedCount > 0) {
        console.log(`🗑️ Rimossi ${result.deletedCount} venue con pattern:`, pattern);
      }
    }

    // Verifica venue rimanenti
    const remainingVenues = await Venue.find({}).select('name owner').lean();
    console.log(`✅ Venue rimanenti nel database: ${remainingVenues.length}`);
    remainingVenues.forEach(v => {
      console.log(`- ${v.name} (${v._id})`);
    });

    console.log('✅ Pulizia completata');
    
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connessione database chiusa');
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  cleanupDemoVenues().then(() => process.exit(0));
}

module.exports = cleanupDemoVenues; 