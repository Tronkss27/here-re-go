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

async function restoreAnnouncements() {
  try {
    console.log('🔄 Ripristino MatchAnnouncement dai PopularMatch...');
    
    const popularMatches = await PopularMatch.find({});
    console.log(`📊 Trovati ${popularMatches.length} PopularMatch`);
    
    for (const popular of popularMatches) {
      console.log(`📝 Creando annuncio per: ${popular.homeTeam} vs ${popular.awayTeam}`);
      
      // Crea un MatchAnnouncement per ogni venue nel PopularMatch
      for (const venue of popular.venues) {
        const announcement = new MatchAnnouncement({
          venueId: venue.venueId,
          match: {
            id: popular.matchId,
            homeTeam: popular.homeTeam,
            awayTeam: popular.awayTeam,
            competition: popular.competition,
            date: popular.date,
            time: popular.time,
            venue: 'Stadium',
            source: 'manual'
          },
          eventDetails: {
            startDate: popular.date,
            startTime: '19:30',
            endTime: '23:00',
            description: 'Annuncio ripristinato automaticamente',
            selectedOffers: [{
              id: 'default_1',
              title: 'Aperitivo Match',
              description: 'Spritz + stuzzichini',
              price: '12€'
            }]
          },
          status: 'published',
          searchTags: [
            popular.homeTeam.toLowerCase(),
            popular.awayTeam.toLowerCase(),
            popular.competition?.name?.toLowerCase() || 'serie a'
          ],
          isActive: true
        });
        
        await announcement.save();
        console.log(`   ✅ Salvato annuncio ID: ${announcement._id}`);
      }
    }
    
    const totalAnnouncements = await MatchAnnouncement.countDocuments({});
    console.log(`✅ Ripristino completato! Totale annunci: ${totalAnnouncements}`);
    
  } catch (error) {
    console.error('❌ Errore durante il ripristino:', error);
  }
}

connectDB().then(() => {
  restoreAnnouncements().then(() => {
    mongoose.disconnect();
    console.log('👋 Disconnesso da MongoDB');
  });
}); 