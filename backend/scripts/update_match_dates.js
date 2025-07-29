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
const PopularMatch = require('../src/models/PopularMatch');
const MatchAnnouncement = require('../src/models/MatchAnnouncement');

async function updateMatchDates() {
  try {
    console.log('🗓️ Aggiornamento date partite...');
    
    // Date per i prossimi giorni
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);
    const thirdDay = new Date(today);
    thirdDay.setDate(today.getDate() + 3);
    
    const newDates = [
      today.toISOString().split('T')[0],      // Oggi
      tomorrow.toISOString().split('T')[0],   // Domani
      dayAfter.toISOString().split('T')[0],   // Dopodomani
      thirdDay.toISOString().split('T')[0]    // Fra 3 giorni
    ];
    
    // Aggiorna PopularMatch
    const popularMatches = await PopularMatch.find({});
    for (let i = 0; i < popularMatches.length; i++) {
      const match = popularMatches[i];
      const newDate = newDates[i % newDates.length];
      
      console.log(`📝 Aggiornando ${match.homeTeam} vs ${match.awayTeam}: ${match.date} → ${newDate}`);
      
      match.date = newDate;
      await match.save();
    }
    
    // Aggiorna MatchAnnouncement
    const announcements = await MatchAnnouncement.find({});
    for (let i = 0; i < announcements.length; i++) {
      const announcement = announcements[i];
      const newDate = newDates[i % newDates.length];
      
      console.log(`📢 Aggiornando annuncio ${announcement.match.homeTeam} vs ${announcement.match.awayTeam}: ${announcement.match.date} → ${newDate}`);
      
      announcement.match.date = newDate;
      announcement.eventDetails.startDate = newDate;
      await announcement.save();
    }
    
    console.log('✅ Date aggiornate con successo!');
    
  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento:', error);
  }
}

// Esegui lo script
connectDB().then(() => {
  updateMatchDates().then(() => {
    mongoose.disconnect();
    console.log('👋 Disconnesso da MongoDB');
  });
}); 