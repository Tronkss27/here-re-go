const mongoose = require('mongoose');
require('dotenv').config();

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

const MatchAnnouncement = require('../src/models/MatchAnnouncement');
const PopularMatch = require('../src/models/PopularMatch');
const Venue = require('../src/models/Venue');

async function cleanAllMockData() {
  try {
    console.log('🧹 Pulizia COMPLETA dati mock/demo...');
    
    // 1. Rimuovi tutti gli annunci che contengono "Demo Sports Bar" o dati chiaramente mock
    const mockVenueNames = [
      'Demo Sports Bar',
      'Test Venue',
      'Mock Bar',
      'Sample Bar'
    ];
    
    console.log('🗑️ Rimuovendo annunci da venues mock...');
    for (const venueName of mockVenueNames) {
      const mockVenues = await Venue.find({ name: { $regex: venueName, $options: 'i' } });
      const mockVenueIds = mockVenues.map(v => v._id.toString());
      
      if (mockVenueIds.length > 0) {
        const deletedAnnouncements = await MatchAnnouncement.deleteMany({
          venueId: { $in: mockVenueIds }
        });
        console.log(`   ✅ Rimossi ${deletedAnnouncements.deletedCount} annunci da ${venueName}`);
      }
    }
    
    // 2. Rimuovi annunci con matchId chiaramente mock/test
    const mockMatchIds = [
      'mock_',
      'test-',
      'frontend-test',
      'demo_',
      'sample_',
      '_test',
      '_mock',
      '_demo'
    ];
    
    console.log('🗑️ Rimuovendo annunci con matchId mock...');
    for (const pattern of mockMatchIds) {
      const deletedAnnouncements = await MatchAnnouncement.deleteMany({
        'match.id': { $regex: pattern, $options: 'i' }
      });
      console.log(`   ✅ Rimossi ${deletedAnnouncements.deletedCount} annunci con pattern "${pattern}"`);
    }
    
    // 3. Rimuovi PopularMatch corrispondenti
    console.log('🗑️ Rimuovendo PopularMatch mock...');
    for (const pattern of mockMatchIds) {
      const deletedPopular = await PopularMatch.deleteMany({
        matchId: { $regex: pattern, $options: 'i' }
      });
      console.log(`   ✅ Rimossi ${deletedPopular.deletedCount} PopularMatch con pattern "${pattern}"`);
    }
    
    // 4. Rimuovi PopularMatch orfani (senza annunci corrispondenti)
    console.log('🗑️ Rimuovendo PopularMatch orfani...');
    const allPopularMatches = await PopularMatch.find({});
    let orphanCount = 0;
    
    for (const popular of allPopularMatches) {
      const hasAnnouncements = await MatchAnnouncement.countDocuments({
        'match.id': popular.matchId
      });
      
      if (hasAnnouncements === 0) {
        await PopularMatch.deleteOne({ _id: popular._id });
        orphanCount++;
        console.log(`   🗑️ Rimosso PopularMatch orfano: ${popular.matchId}`);
      }
    }
    console.log(`   ✅ Rimossi ${orphanCount} PopularMatch orfani`);
    
    // 5. Report finale
    const remainingAnnouncements = await MatchAnnouncement.countDocuments({});
    const remainingPopular = await PopularMatch.countDocuments({});
    
    console.log('\n📊 REPORT FINALE:');
    console.log(`   📋 MatchAnnouncement rimasti: ${remainingAnnouncements}`);
    console.log(`   🔥 PopularMatch rimasti: ${remainingPopular}`);
    
    if (remainingAnnouncements > 0) {
      console.log('\n📋 Annunci rimasti (solo da admin reali):');
      const realAnnouncements = await MatchAnnouncement.find({})
        .populate('venueId', 'name')
        .select('match.homeTeam match.awayTeam match.id venueId');
      
      realAnnouncements.forEach(ann => {
        const venueName = ann.venueId?.name || 'Venue sconosciuto';
        console.log(`   - ${ann.match.homeTeam} vs ${ann.match.awayTeam} (${ann.match.id}) @ ${venueName}`);
      });
    }
    
    console.log('\n✅ Pulizia completata! Ora solo dati da admin reali.');
    
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
  }
}

// Esegui lo script
connectDB().then(() => {
  cleanAllMockData().then(() => {
    mongoose.disconnect();
    console.log('👋 Disconnesso da MongoDB');
  });
}); 