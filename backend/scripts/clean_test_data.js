const mongoose = require('mongoose');
require('dotenv').config();

// Connetti al database
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_db';
    await mongoose.connect(mongoURI);
    console.log('✅ Connesso a MongoDB');
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error);
    process.exit(1);
  }
};

// Importa i modelli
const MatchAnnouncement = require('../src/models/MatchAnnouncement');
const PopularMatch = require('../src/models/PopularMatch');

async function cleanTestData() {
  try {
    console.log('🧹 Pulizia dati di test...');
    
    // ID di test da rimuovere
    const testMatchIds = [
      'mock_2',
      'test-123', 
      'frontend-test-1',
      '104',
      'milan_inter_test',
      'roma_lazio_derby',
      'juventus_napoli_big',
      'atalanta_fiorentina'
    ];
    
    console.log(`🎯 Rimuovendo annunci con matchId: ${testMatchIds.join(', ')}`);
    
    // Rimuovi MatchAnnouncement di test
    const deletedAnnouncements = await MatchAnnouncement.deleteMany({
      'match.id': { $in: testMatchIds }
    });
    
    console.log(`🗑️ Rimossi ${deletedAnnouncements.deletedCount} MatchAnnouncement di test`);
    
    // Rimuovi PopularMatch di test
    const deletedPopular = await PopularMatch.deleteMany({
      'matchId': { $in: testMatchIds }
    });
    
    console.log(`🗑️ Rimossi ${deletedPopular.deletedCount} PopularMatch di test`);
    
    // Mostra annunci rimasti
    const remainingAnnouncements = await MatchAnnouncement.find({}).select('match.id match.homeTeam match.awayTeam');
    console.log(`\n📋 Annunci rimasti (${remainingAnnouncements.length}):`);
    remainingAnnouncements.forEach(a => {
      console.log(`   - ${a.match.homeTeam} vs ${a.match.awayTeam} (ID: ${a.match.id})`);
    });
    
    // Mostra PopularMatch rimasti  
    const remainingPopular = await PopularMatch.find({}).select('matchId homeTeam awayTeam');
    console.log(`\n🔥 PopularMatch rimasti (${remainingPopular.length}):`);
    remainingPopular.forEach(p => {
      console.log(`   - ${p.homeTeam} vs ${p.awayTeam} (ID: ${p.matchId})`);
    });
    
    console.log('✅ Pulizia completata!');
    
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
  }
}

// Esegui lo script
connectDB().then(() => {
  cleanTestData().then(() => {
    mongoose.disconnect();
    console.log('👋 Disconnesso da MongoDB');
  });
}); 