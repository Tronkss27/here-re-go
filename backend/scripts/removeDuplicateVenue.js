const mongoose = require('mongoose');
const Venue = require('../src/models/Venue');

async function removeDuplicateVenue() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sports');
    console.log('🔍 Cerco duplicati venue...');
    
    // Trova venue duplicati con stesso nome
    const venues = await Venue.find({ name: 'banana12' }).lean();
    console.log('📋 Venue trovati:', venues.map(v => ({
      id: v._id,
      name: v.name,
      imagesCount: v.images ? v.images.length : 0,
      hasImages: v.images && v.images.length > 0
    })));
    
    if (venues.length > 1) {
      // Trova quello senza immagini
      const venueWithoutImages = venues.find(v => !v.images || v.images.length === 0);
      const venueWithImages = venues.find(v => v.images && v.images.length > 0);
      
      if (venueWithoutImages && venueWithImages) {
        console.log('🗑️ Rimuovo duplicato senza immagini:', venueWithoutImages._id);
        await Venue.deleteOne({ _id: venueWithoutImages._id });
        console.log('✅ Duplicato rimosso!');
        console.log('✅ Venue mantenuto (con immagini):', venueWithImages._id);
      } else {
        console.log('⚠️ Non ho trovato duplicati chiari da rimuovere');
      }
    } else {
      console.log('ℹ️ Nessun duplicato trovato');
    }
    
    // Verifica finale
    const finalVenues = await Venue.find({ name: 'banana12' }).lean();
    console.log('🎯 Venue finali:', finalVenues.map(v => ({
      id: v._id,
      name: v.name,
      imagesCount: v.images ? v.images.length : 0
    })));
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnesso da MongoDB');
  }
}

removeDuplicateVenue(); 