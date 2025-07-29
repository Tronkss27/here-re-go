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

// Importa il modello
const PopularMatch = require('../src/models/PopularMatch');

async function updateAllPopularMatches() {
  try {
    console.log('🔄 Aggiornamento popolarità per tutti i PopularMatch...');
    
    const matches = await PopularMatch.find({});
    console.log(`📊 Trovati ${matches.length} PopularMatch`);
    
    for (const match of matches) {
      console.log(`📝 Aggiornando: ${match.homeTeam} vs ${match.awayTeam}`);
      console.log(`   - Venues prima: ${match.venueCount}, Score prima: ${match.popularityScore}, Hot prima: ${match.isHot}`);
      
      await match.updatePopularity();
      
      console.log(`   - Venues dopo: ${match.venueCount}, Score dopo: ${match.popularityScore}, Hot dopo: ${match.isHot}`);
    }
    
    console.log('✅ Aggiornamento completato!');
    console.log('\n🔥 Match HOT:');
    const hotMatches = await PopularMatch.find({ isHot: true });
    hotMatches.forEach(match => {
      console.log(`   - ${match.homeTeam} vs ${match.awayTeam} (score: ${match.popularityScore}, venues: ${match.venueCount})`);
    });
    
  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento:', error);
  }
}

// Esegui lo script
connectDB().then(() => {
  updateAllPopularMatches().then(() => {
    mongoose.disconnect();
    console.log('👋 Disconnesso da MongoDB');
  });
}); 