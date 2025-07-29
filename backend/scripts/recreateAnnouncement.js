const mongoose = require('mongoose');
const Venue = require('../src/models/Venue');
const MatchAnnouncement = require('../src/models/MatchAnnouncement');
const PopularMatch = require('../src/models/PopularMatch');

async function recreateAnnouncement() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sports');
    console.log('🔍 Ricreo annuncio per banana12...');
    
    // Trova il venue banana12 rimasto
    const venue = await Venue.findOne({ name: 'banana12' }).lean();
    if (!venue) {
      console.log('❌ Venue banana12 non trovato!');
      return;
    }
    
    console.log('✅ Venue trovato:', {
      id: venue._id,
      name: venue.name,
      imagesCount: venue.images ? venue.images.length : 0
    });
    
    // Verifica se esiste già un annuncio attivo
    const existingAnnouncement = await MatchAnnouncement.findOne({
      venueId: venue._id,
      status: 'published',
      isActive: true
    }).lean();
    
    if (existingAnnouncement) {
      console.log('ℹ️ Annuncio già esistente:', existingAnnouncement._id);
    } else {
      // Crea nuovo annuncio per la partita PSG vs Man City
      const newAnnouncement = new MatchAnnouncement({
        venueId: venue._id,
        match: {
          id: '139711',
          homeTeam: 'Paris Saint-Germain',
          awayTeam: 'Manchester City',
          date: '2025-07-28T21:00:00.000Z',
          time: '21:00',
          competition: {
            id: 'champions-league',
            name: 'Champions League',
            logo: '/img/leagues/champions.png'
          },
          source: 'manual'
        },
        eventDetails: {
          startDate: '2025-07-28',
          startTime: '21:00',
          endTime: '23:00',
          specialOffers: ['Birra 5€', 'Panini Gourmet'],
          atmosphere: 'Grande schermo HD + Tifosi'
        },
        status: 'published',
        isActive: true,
        views: 0,
        clicks: 0
      });
      
      await newAnnouncement.save();
      console.log('✅ Nuovo annuncio creato:', newAnnouncement._id);
      
      // Aggiorna PopularMatch
      await PopularMatch.findOneAndUpdate(
        { matchId: '139711' },
        {
          $addToSet: {
            venues: {
              venueId: venue._id,
              announcementId: newAnnouncement._id,
              addedAt: new Date()
            }
          }
        },
        { upsert: true }
      );
      
      console.log('✅ PopularMatch aggiornato');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnesso da MongoDB');
  }
}

recreateAnnouncement(); 