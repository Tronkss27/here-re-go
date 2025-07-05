const mongoose = require('mongoose')
const User = require('../src/models/User')
const Venue = require('../src/models/Venue')
const Booking = require('../src/models/Booking')
const Fixture = require('../src/models/Fixture')
const Offer = require('../src/models/Offer')
const Review = require('../src/models/Review')

// Configura la connessione al database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_bar')
    console.log('✅ MongoDB Connected for migration')
  } catch (error) {
    console.error('❌ Database connection error:', error)
    process.exit(1)
  }
}

// Funzione per creare indici ottimizzati
const createOptimizedIndexes = async () => {
  console.log('🔄 Creazione indici ottimizzati...')
  
  try {
    // Indici User
    console.log('📊 Creazione indici User...')
    try {
      await User.createIndexes()
    } catch (err) {
      if (err.code === 86) { // IndexKeySpecsConflict
        console.log('⚠️  Alcuni indici User già esistono, saltando...')
      } else {
        throw err
      }
    }
    
    // Indici Venue
    console.log('📊 Creazione indici Venue...')
    try {
      await Venue.createIndexes()
    } catch (err) {
      if (err.code === 86) {
        console.log('⚠️  Alcuni indici Venue già esistono, saltando...')
      } else {
        throw err
      }
    }
    
    // Indici Booking
    console.log('📊 Creazione indici Booking...')
    try {
      await Booking.createIndexes()
    } catch (err) {
      if (err.code === 86) {
        console.log('⚠️  Alcuni indici Booking già esistono, saltando...')
      } else {
        throw err
      }
    }
    
    // Indici Fixture
    console.log('📊 Creazione indici Fixture...')
    try {
      await Fixture.createIndexes()
    } catch (err) {
      if (err.code === 86) {
        console.log('⚠️  Alcuni indici Fixture già esistono, saltando...')
      } else {
        throw err
      }
    }
    
    // Indici Offer
    console.log('📊 Creazione indici Offer...')
    try {
      await Offer.createIndexes()
    } catch (err) {
      if (err.code === 86) {
        console.log('⚠️  Alcuni indici Offer già esistono, saltando...')
      } else {
        throw err
      }
    }
    
    // Indici Review
    console.log('📊 Creazione indici Review...')
    try {
      await Review.createIndexes()
    } catch (err) {
      if (err.code === 86) {
        console.log('⚠️  Alcuni indici Review già esistono, saltando...')
      } else {
        throw err
      }
    }
    
    console.log('✅ Tutti gli indici sono stati processati con successo!')
    
  } catch (error) {
    console.error('❌ Errore durante la creazione degli indici:', error)
    throw error
  }
}

// Funzione per verificare le performance degli indici
const verifyIndexPerformance = async () => {
  console.log('🔍 Verifica performance indici...')
  
  try {
    // Test query performance per User
    console.log('📈 Test performance User queries...')
    const userStart = Date.now()
    await User.find({ isActive: true, role: 'venue_owner' }).limit(10)
    console.log(`⏱️  User query: ${Date.now() - userStart}ms`)
    
    // Test query performance per Venue
    console.log('📈 Test performance Venue queries...')
    const venueStart = Date.now()
    await Venue.find({ isActive: true, status: 'approved' }).limit(10)
    console.log(`⏱️  Venue query: ${Date.now() - venueStart}ms`)
    
    // Test query performance per Booking
    console.log('📈 Test performance Booking queries...')
    if (await Booking.countDocuments() > 0) {
      const bookingStart = Date.now()
      await Booking.find({ status: 'confirmed' }).limit(10)
      console.log(`⏱️  Booking query: ${Date.now() - bookingStart}ms`)
    }
    
    // Test query performance per Fixture
    console.log('📈 Test performance Fixture queries...')
    const fixtureStart = Date.now()
    await Fixture.findUpcoming(5)
    console.log(`⏱️  Fixture query: ${Date.now() - fixtureStart}ms`)
    
    // Test query performance per Offer
    console.log('📈 Test performance Offer queries...')
    if (await Offer.countDocuments() > 0) {
      const offerStart = Date.now()
      await Offer.findActiveOffers()
      console.log(`⏱️  Offer query: ${Date.now() - offerStart}ms`)
    }
    
    console.log('✅ Test di performance completati!')
    
  } catch (error) {
    console.error('❌ Errore durante i test di performance:', error)
    throw error
  }
}

// Funzione per verificare l'integrità dei dati
const verifyDataIntegrity = async () => {
  console.log('🔍 Verifica integrità dati...')
  
  try {
    // Conta documenti per ogni collezione
    const userCount = await User.countDocuments()
    const venueCount = await Venue.countDocuments()
    const bookingCount = await Booking.countDocuments()
    const fixtureCount = await Fixture.countDocuments()
    const offerCount = await Offer.countDocuments()
    const reviewCount = await Review.countDocuments()
    
    console.log('📊 Statistiche database:')
    console.log(`👥 Users: ${userCount}`)
    console.log(`🏢 Venues: ${venueCount}`)
    console.log(`📅 Bookings: ${bookingCount}`)
    console.log(`⚽ Fixtures: ${fixtureCount}`)
    console.log(`💰 Offers: ${offerCount}`)
    console.log(`⭐ Reviews: ${reviewCount}`)
    
    // Verifica relazioni
    console.log('🔗 Verifica relazioni...')
    const usersWithVenues = await User.countDocuments({ venueId: { $ne: null } })
    const activeVenues = await Venue.countDocuments({ isActive: true })
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' })
    
    console.log(`🏢 Users con venue: ${usersWithVenues}`)
    console.log(`✅ Venues attivi: ${activeVenues}`)
    console.log(`📅 Booking confermati: ${confirmedBookings}`)
    
    console.log('✅ Verifica integrità completata!')
    
  } catch (error) {
    console.error('❌ Errore durante la verifica di integrità:', error)
    throw error
  }
}

// Funzione principale di migrazione
const runMigration = async () => {
  console.log('🚀 Avvio migrazione database SPOrTS...')
  
  try {
    await connectDB()
    
    // Step 1: Creazione indici ottimizzati
    await createOptimizedIndexes()
    
    // Step 2: Verifica performance
    await verifyIndexPerformance()
    
    // Step 3: Verifica integrità dati
    await verifyDataIntegrity()
    
    console.log('🎉 Migrazione completata con successo!')
    
  } catch (error) {
    console.error('💥 Errore durante la migrazione:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Connessione database chiusa')
  }
}

// Avvia la migrazione se eseguito direttamente
if (require.main === module) {
  runMigration()
}

module.exports = {
  runMigration,
  createOptimizedIndexes,
  verifyIndexPerformance,
  verifyDataIntegrity
} 