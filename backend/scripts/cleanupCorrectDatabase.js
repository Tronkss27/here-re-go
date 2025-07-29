const mongoose = require('mongoose');
const PopularMatch = require('../src/models/PopularMatch');
const MatchAnnouncement = require('../src/models/MatchAnnouncement');
const Venue = require('../src/models/Venue');
const GlobalMatch = require('../src/models/GlobalMatch');

async function cleanupCorrectDatabase() {
  try {
    // CONNETTI AL DATABASE CORRETTO (quello che usa il server)
    await mongoose.connect('mongodb://localhost:27017/sports');
    console.log('✅ Connesso al database CORRETTO: sports');

    // 1. RIMUOVI TUTTI I POPULAR MATCH
    const popularResult = await PopularMatch.deleteMany({});
    console.log(`🗑️ Rimossi ${popularResult.deletedCount} PopularMatch`);

    // 2. RIMUOVI TUTTI I MATCH ANNOUNCEMENT
    const announcementResult = await MatchAnnouncement.deleteMany({});
    console.log(`🗑️ Rimossi ${announcementResult.deletedCount} MatchAnnouncement`);

    // 3. RIMUOVI SOLO Demo Sports Bar e venue di test
    const demoVenueResult = await Venue.deleteMany({
      $or: [
        { name: /Demo Sports Bar/i },
        { name: /Demo\s/i },
        { name: /Test\s/i },
        { _id: new mongoose.Types.ObjectId('6882a495935909940e4fd2b0') } // ID specifico Demo Sports Bar
      ]
    });
    console.log(`🗑️ Rimossi ${demoVenueResult.deletedCount} Venue demo`);

    // 4. RIMUOVI TUTTI I GLOBAL MATCH (per rigenerarli)
    const globalResult = await GlobalMatch.deleteMany({});
    console.log(`🗑️ Rimossi ${globalResult.deletedCount} GlobalMatch`);

    console.log('🧹 PULIZIA DATABASE CORRETTO COMPLETATA');
    
    // Verifica venues rimanenti
    const remainingVenues = await Venue.countDocuments();
    console.log(`✅ Venue rimanenti: ${remainingVenues}`);
    
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connessione database chiusa');
  }
}

if (require.main === module) {
  cleanupCorrectDatabase().then(() => process.exit(0));
}

module.exports = cleanupCorrectDatabase; 