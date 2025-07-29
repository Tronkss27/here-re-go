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

const GlobalMatch = require('../src/models/GlobalMatch');

  // Funzione per generare ID random
  const generateRandomId = () => Math.floor(Math.random() * 900000) + 100000; // 6 cifre random

  // Dati di partite reali di esempio per i prossimi giorni (simulando chiamata Sportmonks)
  const sampleMatches = [
    {
      providerId: generateRandomId().toString(),
    league: { id: 'serie-a', name: 'Serie A', logo: '🇮🇹' },
    season: { id: '2024-25', name: '2024/25' },
    date: new Date('2025-07-25'),
    time: '20:45',
    status: { name: 'scheduled' },
    participants: {
      home: { id: 'int', name: 'Inter', logo: '⚫🔵' },
      away: { id: 'mil', name: 'Milan', logo: '🔴⚫' }
    },
    venue: { id: 'san-siro', name: 'San Siro', city: 'Milano' }
      },
    {
      providerId: generateRandomId().toString(),
    league: { id: 'premier-league', name: 'Premier League', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    season: { id: '2024-25', name: '2024/25' },
    date: new Date('2025-07-26'),
    time: '15:00',
    status: { name: 'scheduled' },
    participants: {
      home: { id: 'man-utd', name: 'Manchester United', logo: '🔴👹' },
      away: { id: 'liv', name: 'Liverpool', logo: '🔴🐦' }
    },
    venue: { id: 'old-trafford', name: 'Old Trafford', city: 'Manchester' }
      },
    {
      providerId: generateRandomId().toString(),
    league: { id: 'la-liga', name: 'La Liga', logo: '🇪🇸' },
    season: { id: '2024-25', name: '2024/25' },
    date: new Date('2025-07-27'),
    time: '21:00',
    status: { name: 'scheduled' },
    participants: {
      home: { id: 'real', name: 'Real Madrid', logo: '⚪👑' },
      away: { id: 'barca', name: 'Barcelona', logo: '🔵🔴' }
    },
    venue: { id: 'bernabeu', name: 'Santiago Bernabéu', city: 'Madrid' }
      },
    {
      providerId: generateRandomId().toString(),
    league: { id: 'champions-league', name: 'Champions League', logo: '⭐' },
    season: { id: '2024-25', name: '2024/25' },
    date: new Date('2025-07-28'),
    time: '21:00',
    status: { name: 'scheduled' },
    participants: {
      home: { id: 'psg', name: 'Paris Saint-Germain', logo: '🔵🔴' },
      away: { id: 'man-city', name: 'Manchester City', logo: '💙⚡' }
    },
    venue: { id: 'parc-des-princes', name: 'Parc des Princes', city: 'Paris' }
      },
    {
      providerId: generateRandomId().toString(),
    league: { id: 'serie-a', name: 'Serie A', logo: '🇮🇹' },
    season: { id: '2024-25', name: '2024/25' },
    date: new Date('2025-07-29'),
    time: '18:00',
    status: { name: 'scheduled' },
    participants: {
      home: { id: 'juv', name: 'Juventus', logo: '⚪⚫' },
      away: { id: 'nap', name: 'Napoli', logo: '💙🌋' }
    },
    venue: { id: 'allianz-stadium', name: 'Allianz Stadium', city: 'Torino' }
      },
    {
      providerId: generateRandomId().toString(),
    league: { id: 'bundesliga', name: 'Bundesliga', logo: '🇩🇪' },
    season: { id: '2024-25', name: '2024/25' },
    date: new Date('2025-07-30'),
    time: '20:30',
    status: { name: 'scheduled' },
    participants: {
      home: { id: 'bay', name: 'Bayern Munich', logo: '🔴⚪' },
      away: { id: 'dor', name: 'Borussia Dortmund', logo: '💛⚫' }
    },
    venue: { id: 'allianz-arena', name: 'Allianz Arena', city: 'München' }
      },
    {
      providerId: generateRandomId().toString(),
    league: { id: 'serie-a', name: 'Serie A', logo: '🇮🇹' },
    season: { id: '2024-25', name: '2024/25' },
    date: new Date('2025-07-31'),
    time: '20:45',
    status: { name: 'scheduled' },
    participants: {
      home: { id: 'rom', name: 'Roma', logo: '🟡🔴' },
      away: { id: 'laz', name: 'Lazio', logo: '💙🦅' }
    },
    venue: { id: 'olimpico', name: 'Stadio Olimpico', city: 'Roma' }
      },
    {
      providerId: generateRandomId().toString(),
    league: { id: 'ligue-1', name: 'Ligue 1', logo: '🇫🇷' },
    season: { id: '2024-25', name: '2024/25' },
    date: new Date('2025-08-01'),
    time: '21:00',
    status: { name: 'scheduled' },
    participants: {
      home: { id: 'mar', name: 'Marseille', logo: '💙⚪' },
      away: { id: 'lyons', name: 'Lyon', logo: '🔴🔵' }
    },
    venue: { id: 'velodrome', name: 'Stade Vélodrome', city: 'Marseille' }
  }
];

async function seedGlobalMatches() {
  try {
    console.log('🌱 Seeding GlobalMatches per form admin...');
    
    // Rimuovi eventuali GlobalMatch esistenti
    await GlobalMatch.deleteMany({});
    console.log('🗑️ Puliti GlobalMatch esistenti');
    
    // Inserisci nuove partite usando upsert per evitare duplicati
    for (const match of sampleMatches) {
      const result = await GlobalMatch.updateOne(
        { providerId: match.providerId },
        { $set: match },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) {
        console.log(`✅ Creata partita: ${match.participants.home.name} vs ${match.participants.away.name}`);
      } else {
        console.log(`🔄 Aggiornata partita: ${match.participants.home.name} vs ${match.participants.away.name}`);
      }
    }
    
    const totalMatches = await GlobalMatch.countDocuments();
    console.log(`🎯 Totale GlobalMatches nel database: ${totalMatches}`);
    
    // Mostra alcune partite di esempio
    const exampleMatches = await GlobalMatch.find().limit(3).select('participants.home.name participants.away.name date league.name');
    console.log('\n📋 Partite di esempio create:');
    exampleMatches.forEach(match => {
      const dateStr = match.date.toISOString().split('T')[0];
      console.log(`   - ${match.participants.home.name} vs ${match.participants.away.name} (${match.league.name}, ${dateStr})`);
    });
    
    console.log('\n✅ Seed GlobalMatches completato!');
    console.log('💡 Ora gli admin possono selezionare queste partite nel form di creazione annunci');
    
  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
  }
}

// Esegui lo script
connectDB().then(() => {
  seedGlobalMatches().then(() => {
    mongoose.disconnect();
    console.log('👋 Disconnesso da MongoDB');
  });
}); 