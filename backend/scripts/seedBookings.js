const mongoose = require('mongoose')
const Venue = require('../src/models/Venue')
const Booking = require('../src/models/Booking')
const Fixture = require('../src/models/Fixture')
const User = require('../src/models/User')

// Configurazione connessione database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_bar')
    console.log('✅ MongoDB Connected for booking seeding')
  } catch (error) {
    console.error('❌ Database connection error:', error)
    process.exit(1)
  }
}

// User owner di esempio
const sampleOwner = {
  name: 'Giovanni Venueowner',
  email: 'owner@sportsbar.it',
  password: '$2a$10$rQyM6Y.ZfE3X7K1P9n7g5eH5Y.ZfE3X7K1P9n7g5e', // "password123"
  role: 'venue_owner',
  isVerified: true
}

// Funzione per creare venues con struttura corretta
const createSampleVenues = (ownerId) => [
  {
    name: 'The Sports Lounge',
    description: 'Premium sports bar with multiple screens',
    owner: ownerId,
    contact: {
      email: 'info@sportslounge.it',
      phone: '+39 02 12345678',
      website: 'https://sportslounge.it'
    },
    location: {
      address: {
        street: 'Via Roma 123',
        city: 'Milano',
        postalCode: '20121',
        country: 'Italy'
      },
      coordinates: {
        latitude: 45.4642,
        longitude: 9.1900
      }
    },
    hours: {
      monday: { open: '17:00', close: '02:00' },
      tuesday: { open: '17:00', close: '02:00' },
      wednesday: { open: '17:00', close: '02:00' },
      thursday: { open: '17:00', close: '02:00' },
      friday: { open: '17:00', close: '03:00' },
      saturday: { open: '15:00', close: '03:00' },
      sunday: { open: '15:00', close: '02:00' }
    },
    capacity: {
      total: 50,
      tables: 12,
      bar: 15,
      outdoor: 10
    },
    features: ['live_sports', 'multiple_screens', 'outdoor_seating', 'full_bar', 'food_service'],
    sportsOfferings: [
      { sport: 'football', leagues: ['Serie A', 'Champions League', 'Premier League'], isPrimary: true },
      { sport: 'basketball', leagues: ['NBA', 'Euroleague'], isPrimary: false }
    ],
    bookingSettings: {
      enabled: true,
      requiresApproval: false,
      advanceBookingDays: 30,
      minimumPartySize: 2,
      maximumPartySize: 12,
      timeSlotDuration: 120
    },
    pricing: {
      basePrice: 25,
      pricePerPerson: 5,
      minimumSpend: 50,
      currency: 'EUR'
    },
    status: 'approved',
    isVerified: true,
    isActive: true,
    slug: 'the-sports-lounge-milano'
  },
  {
    name: 'Champions Bar',
    description: 'Classic sports bar for football fans',
    owner: ownerId,
    contact: {
      email: 'contact@championsbar.it',
      phone: '+39 02 87654321',
      website: 'https://championsbar.it'
    },
    location: {
      address: {
        street: 'Corso Buenos Aires 456',
        city: 'Milano',
        postalCode: '20124',
        country: 'Italy'
      },
      coordinates: {
        latitude: 45.4773,
        longitude: 9.2058
      }
    },
    hours: {
      monday: { open: '18:00', close: '01:00' },
      tuesday: { open: '18:00', close: '01:00' },
      wednesday: { open: '18:00', close: '01:00' },
      thursday: { open: '18:00', close: '01:00' },
      friday: { open: '18:00', close: '02:00' },
      saturday: { open: '16:00', close: '02:00' },
      sunday: { open: '16:00', close: '01:00' }
    },
    capacity: {
      total: 80,
      tables: 20,
      bar: 25,
      outdoor: 0
    },
    features: ['live_sports', 'multiple_screens', 'pool_table', 'darts', 'full_bar'],
    sportsOfferings: [
      { sport: 'football', leagues: ['Serie A', 'Premier League', 'La Liga'], isPrimary: true }
    ],
    bookingSettings: {
      enabled: true,
      requiresApproval: true,
      advanceBookingDays: 21,
      minimumPartySize: 4,
      maximumPartySize: 15,
      timeSlotDuration: 150
    },
    pricing: {
      basePrice: 20,
      pricePerPerson: 3,
      minimumSpend: 40,
      currency: 'EUR'
    },
    status: 'approved',
    isVerified: true,
    isActive: true,
    slug: 'champions-bar-milano'
  }
]

// Funzione per generare bookings casuali
const generateRandomBookings = (venueId, fixtureIds, count = 10) => {
  const bookings = []
  const customers = [
    { name: 'Marco Rossi', email: 'marco.rossi@email.it', phone: '+39 333 1234567' },
    { name: 'Giulia Bianchi', email: 'giulia.bianchi@email.it', phone: '+39 334 2345678' },
    { name: 'Andrea Verdi', email: 'andrea.verdi@email.it', phone: '+39 335 3456789' },
    { name: 'Sofia Neri', email: 'sofia.neri@email.it', phone: '+39 336 4567890' },
    { name: 'Lorenzo Ferrari', email: 'lorenzo.ferrari@email.it', phone: '+39 337 5678901' }
  ]

  const timeSlots = [
    { start: '19:00', end: '21:00' },
    { start: '19:30', end: '21:30' },
    { start: '20:00', end: '22:00' },
    { start: '20:30', end: '22:30' },
    { start: '21:00', end: '23:00' }
  ]

  const tablePreferences = ['any', 'near_screen', 'quiet_area', 'bar_area']
  const statuses = ['pending', 'confirmed', 'confirmed', 'confirmed', 'cancelled'] // Più confirmed
  
  for (let i = 0; i < count; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
    const fixture = fixtureIds.length > 0 && Math.random() > 0.3 
      ? fixtureIds[Math.floor(Math.random() * fixtureIds.length)] 
      : null
    
    // Date casuali nei prossimi 30 giorni
    const date = new Date()
    date.setDate(date.getDate() + Math.floor(Math.random() * 30))
    
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    const booking = {
      customer,
      venue: venueId,
      fixture,
      date,
      timeSlot,
      partySize: Math.floor(Math.random() * 8) + 2, // 2-10 persone
      tablePreference: tablePreferences[Math.floor(Math.random() * tablePreferences.length)],
      status,
      specialRequests: Math.random() > 0.7 ? 'Tavolo per disabili necessario' : '',
      pricing: {
        basePrice: 25 + Math.floor(Math.random() * 25), // 25-50 EUR
        discount: Math.random() > 0.8 ? 10 : 0,
        finalPrice: 0 // Calcolato dopo
      },
      paymentStatus: status === 'confirmed' ? 'paid' : 'none'
    }

    // Calcola prezzo finale
    booking.pricing.finalPrice = booking.pricing.basePrice - booking.pricing.discount

    // Genera confirmation code se confermato
    if (status === 'confirmed') {
      booking.confirmationCode = `SPT${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      booking.confirmedAt = new Date(date.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Confermato nei 7 giorni precedenti
    }

    if (status === 'cancelled') {
      booking.cancelledAt = new Date()
      booking.cancellationReason = 'Customer request'
    }

    bookings.push(booking)
  }

  return bookings
}

// Funzione principale di seeding
const seedBookings = async () => {
  try {
    console.log('🌱 Seeding venues and bookings...')

    // Pulisce collections esistenti
    await User.deleteMany({ role: 'venue_owner' })
    await Venue.deleteMany({})
    await Booking.deleteMany({})
    console.log('🧹 Cleared existing venues, bookings and venue owners')

    // Crea owner
    const owner = await User.create(sampleOwner)
    console.log(`✅ Created venue owner: ${owner.email}`)

    // Crea venues
    const sampleVenues = createSampleVenues(owner._id)
    const createdVenues = await Venue.insertMany(sampleVenues)
    console.log(`✅ Created ${createdVenues.length} venues`)

    // Ottiene fixtures esistenti
    const fixtures = await Fixture.find({}).limit(5)
    const fixtureIds = fixtures.map(f => f._id)
    console.log(`📋 Found ${fixtureIds.length} fixtures for bookings`)

    // Genera bookings per ogni venue
    const allBookings = []
    for (const venue of createdVenues) {
      const venueBookings = generateRandomBookings(venue._id, fixtureIds, 15)
      allBookings.push(...venueBookings)
    }

    // Inserisce bookings
    const createdBookings = await Booking.insertMany(allBookings)
    console.log(`✅ Created ${createdBookings.length} bookings`)

    // Mostra statistiche
    const stats = {
      venues: createdVenues.length,
      bookings: createdBookings.length,
      pending: createdBookings.filter(b => b.status === 'pending').length,
      confirmed: createdBookings.filter(b => b.status === 'confirmed').length,
      cancelled: createdBookings.filter(b => b.status === 'cancelled').length,
      withFixture: createdBookings.filter(b => b.fixture).length,
      totalRevenue: createdBookings.reduce((sum, b) => sum + b.pricing.finalPrice, 0)
    }

    console.log('📊 Seeding stats:', stats)

    return { success: true, stats, venues: createdVenues, bookings: createdBookings }

  } catch (error) {
    console.error('❌ Error seeding bookings:', error)
    throw error
  }
}

// Esegue se chiamato direttamente
if (require.main === module) {
  connectDB()
    .then(() => seedBookings())
    .then(() => {
      console.log('🎉 Booking seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedBookings, createSampleVenues, sampleOwner } 