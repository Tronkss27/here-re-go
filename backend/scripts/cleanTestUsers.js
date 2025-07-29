const mongoose = require('mongoose');
const User = require('../src/models/User');
const Venue = require('../src/models/Venue');

// Connessione al database
mongoose.connect('mongodb://localhost:27017/sports', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function cleanTestUsers() {
  try {
    console.log('🧹 Pulizia utenti di test...');
    
    // Lista di email di test da rimuovere
    const testEmails = [
      'test@example.com',
      'testnew@example.com',
      'boxing@aba.it',
      'barbaba@gmail.com'
    ];
    
    for (const email of testEmails) {
      console.log(`🔍 Cercando utente: ${email}`);
      
      // Trova l'utente
      const user = await User.findOne({ email });
      if (user) {
        console.log(`👤 Trovato utente: ${user.name} (${user.email})`);
        
        // Se è un venue owner, rimuovi anche il venue
        if (user.role === 'venue_owner' && user.venueId) {
          console.log(`🏪 Rimuovendo venue associato: ${user.venueId}`);
          await Venue.findByIdAndDelete(user.venueId);
        }
        
        // Rimuovi l'utente
        await User.findByIdAndDelete(user._id);
        console.log(`✅ Utente ${email} rimosso`);
      } else {
        console.log(`ℹ️ Utente ${email} non trovato`);
      }
    }
    
    console.log('🎉 Pulizia completata!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
    process.exit(1);
  }
}

cleanTestUsers(); 