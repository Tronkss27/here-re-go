const mongoose = require('mongoose');
const PopularMatch = require('../src/models/PopularMatch');
const MatchAnnouncement = require('../src/models/MatchAnnouncement');
const GlobalMatch = require('../src/models/GlobalMatch');

// Script per rimuovere tutti i dati demo/mock
async function cleanupDemoData() {
  try {
    // Connetti al database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports-bar');
    console.log('✅ Connesso al database');

    // Pulisci PopularMatch
    const popularResult = await PopularMatch.deleteMany({});
    console.log(`🗑️ Rimossi ${popularResult.deletedCount} PopularMatch`);

    // Pulisci MatchAnnouncement
    const announcementResult = await MatchAnnouncement.deleteMany({});
    console.log(`🗑️ Rimossi ${announcementResult.deletedCount} MatchAnnouncement`);

    // Pulisci GlobalMatch esistenti per rigenerarli
    const globalResult = await GlobalMatch.deleteMany({});
    console.log(`🗑️ Rimossi ${globalResult.deletedCount} GlobalMatch`);

    console.log('✅ Pulizia completata - database pronto per fresh start');
    
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connessione database chiusa');
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  cleanupDemoData().then(() => process.exit(0));
}

module.exports = cleanupDemoData; 