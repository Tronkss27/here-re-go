const mongoose = require('mongoose')
const Fixture = require('../src/models/Fixture')

// Configurazione connessione database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_bar')
    console.log('✅ MongoDB Connected for fixture seeding')
  } catch (error) {
    console.error('❌ Database connection error:', error)
    process.exit(1)
  }
}

// Dati di example fixtures per il testing
const sampleFixtures = [
  {
    fixtureId: '1001',
    homeTeam: {
      id: '101',
      name: 'Manchester United',
      logo: 'https://example.com/man-utd.png'
    },
    awayTeam: {
      id: '102',
      name: 'Liverpool',
      logo: 'https://example.com/liverpool.png'
    },
    league: {
      id: '39',
      name: 'Premier League',
      country: 'England',
      logo: 'https://example.com/premier-league.png',
      season: '2023'
    },
    date: new Date('2023-12-20T15:00:00Z'),
    status: 'scheduled',
    score: { home: null, away: null },
    popularity: 9,
    totalBookings: 25,
    isActive: true
  },
  {
    fixtureId: '1002',
    homeTeam: {
      id: '103',
      name: 'Juventus',
      logo: 'https://example.com/juventus.png'
    },
    awayTeam: {
      id: '104',
      name: 'AC Milan',
      logo: 'https://example.com/milan.png'
    },
    league: {
      id: '135',
      name: 'Serie A',
      country: 'Italy',
      logo: 'https://example.com/serie-a.png',
      season: '2023'
    },
    date: new Date('2023-12-21T20:45:00Z'),
    status: 'scheduled',
    score: { home: null, away: null },
    popularity: 8,
    totalBookings: 18,
    isActive: true
  },
  {
    fixtureId: '1003',
    homeTeam: {
      id: '105',
      name: 'Real Madrid',
      logo: 'https://example.com/real-madrid.png'
    },
    awayTeam: {
      id: '106',
      name: 'Barcelona',
      logo: 'https://example.com/barcelona.png'
    },
    league: {
      id: '140',
      name: 'La Liga',
      country: 'Spain',
      logo: 'https://example.com/la-liga.png',
      season: '2023'
    },
    date: new Date('2023-12-22T21:00:00Z'),
    status: 'scheduled',
    score: { home: null, away: null },
    popularity: 10,
    totalBookings: 45,
    isActive: true
  },
  {
    fixtureId: '1004',
    homeTeam: {
      id: '107',
      name: 'Bayern Munich',
      logo: 'https://example.com/bayern.png'
    },
    awayTeam: {
      id: '108',
      name: 'Borussia Dortmund',
      logo: 'https://example.com/dortmund.png'
    },
    league: {
      id: '78',
      name: 'Bundesliga',
      country: 'Germany',
      logo: 'https://example.com/bundesliga.png',
      season: '2023'
    },
    date: new Date('2023-12-23T18:30:00Z'),
    status: 'scheduled',
    score: { home: null, away: null },
    popularity: 7,
    totalBookings: 12,
    isActive: true
  },
  {
    fixtureId: '1005',
    homeTeam: {
      id: '109',
      name: 'PSG',
      logo: 'https://example.com/psg.png'
    },
    awayTeam: {
      id: '110',
      name: 'Olympique Marseille',
      logo: 'https://example.com/marseille.png'
    },
    league: {
      id: '61',
      name: 'Ligue 1',
      country: 'France',
      logo: 'https://example.com/ligue1.png',
      season: '2023'
    },
    date: new Date('2023-12-24T17:00:00Z'),
    status: 'scheduled',
    score: { home: null, away: null },
    popularity: 6,
    totalBookings: 8,
    isActive: true
  },
  {
    fixtureId: '1006',
    homeTeam: {
      id: '111',
      name: 'Chelsea',
      logo: 'https://example.com/chelsea.png'
    },
    awayTeam: {
      id: '112',
      name: 'Arsenal',
      logo: 'https://example.com/arsenal.png'
    },
    league: {
      id: '2',
      name: 'UEFA Champions League',
      country: 'Europe',
      logo: 'https://example.com/ucl.png',
      season: '2023'
    },
    date: new Date('2023-12-19T21:00:00Z'),
    status: 'live',
    score: { home: 1, away: 2 },
    popularity: 9,
    totalBookings: 35,
    isActive: true
  },
  {
    fixtureId: '1007',
    homeTeam: {
      id: '113',
      name: 'Inter Milan',
      logo: 'https://example.com/inter.png'
    },
    awayTeam: {
      id: '114',
      name: 'AS Roma',
      logo: 'https://example.com/roma.png'
    },
    league: {
      id: '135',
      name: 'Serie A',
      country: 'Italy',
      logo: 'https://example.com/serie-a.png',
      season: '2023'
    },
    date: new Date('2023-12-18T19:00:00Z'),
    status: 'finished',
    score: { home: 3, away: 1 },
    popularity: 7,
    totalBookings: 22,
    isActive: true
  }
]

// Funzione per eseguire il seeding
const seedFixtures = async () => {
  try {
    console.log('🌱 Seeding fixtures...')

    // Pulisce collection esistente
    await Fixture.deleteMany({})
    console.log('🧹 Cleared existing fixtures')

    // Inserisce fixtures di esempio
    const createdFixtures = await Fixture.insertMany(sampleFixtures)
    console.log(`✅ Created ${createdFixtures.length} fixtures`)

    // Mostra statistiche
    const stats = {
      total: createdFixtures.length,
      scheduled: createdFixtures.filter(f => f.status === 'scheduled').length,
      live: createdFixtures.filter(f => f.status === 'live').length,
      finished: createdFixtures.filter(f => f.status === 'finished').length,
      leagues: [...new Set(createdFixtures.map(f => f.league.name))].length
    }

    console.log('📊 Fixtures stats:', stats)

    return { success: true, stats, fixtures: createdFixtures }

  } catch (error) {
    console.error('❌ Error seeding fixtures:', error)
    throw error
  }
}

// Esegue se chiamato direttamente
if (require.main === module) {
  connectDB()
    .then(() => seedFixtures())
    .then(() => {
      console.log('🎉 Fixture seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedFixtures, sampleFixtures } 