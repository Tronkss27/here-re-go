const mongoose = require('mongoose')
const User = require('../models/User')
const Venue = require('../models/Venue')
const Fixture = require('../models/Fixture')
const Booking = require('../models/Booking')
const Offer = require('../models/Offer')
const Review = require('../models/Review')

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...')

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Venue.deleteMany({}),
      Fixture.deleteMany({}),
      Booking.deleteMany({}),
      Offer.deleteMany({}),
      Review.deleteMany({})
    ])
    console.log('🧹 Cleared existing data')

    // Create demo users
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@sports.it',
      password: 'demo123',
      role: 'venue_owner'
    })

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@sports.it',
      password: 'admin123',
      role: 'admin'
    })

    console.log('👥 Created demo users')

    // Create demo venues
    const venues = await Venue.create([
      {
        name: 'Sports Bar Milano',
        description: 'Il miglior sports bar di Milano con maxischermo per tutte le partite!',
        owner: demoUser._id,
        contact: {
          email: 'info@sportsbar.milano.it',
          phone: '+39 02 1234567',
          website: 'https://sportsbar.milano.it'
        },
        location: {
          address: {
            street: 'Via Torino 45',
            city: 'Milano',
            state: 'Lombardia',
            postalCode: '20123',
            country: 'Italy'
          },
          coordinates: {
            latitude: 45.4642,
            longitude: 9.1900
          }
        },
        hours: {
          monday: { open: '18:00', close: '02:00', closed: false },
          tuesday: { open: '18:00', close: '02:00', closed: false },
          wednesday: { open: '18:00', close: '02:00', closed: false },
          thursday: { open: '18:00', close: '02:00', closed: false },
          friday: { open: '18:00', close: '03:00', closed: false },
          saturday: { open: '16:00', close: '03:00', closed: false },
          sunday: { open: '16:00', close: '02:00', closed: false }
        },
        capacity: {
          total: 80,
          tables: 60,
          bar: 20,
          outdoor: 0
        },
        features: ['live_sports', 'multiple_screens', 'full_bar', 'food_service', 'wifi', 'air_conditioning'],
        sportsOfferings: [
          { sport: 'calcio', leagues: ['Serie A', 'Champions League', 'Europa League'], isPrimary: true },
          { sport: 'basket', leagues: ['NBA', 'Euroleague'], isPrimary: false }
        ],
        status: 'approved',
        isVerified: true,
        analytics: {
          totalBookings: 145,
          totalReviews: 23,
          averageRating: 4.2,
          viewCount: 1250
        }
      },
      {
        name: 'Goal Pub Roma',
        description: 'Pub sportivo nel cuore di Roma con atmosfera fantastica!',
        owner: demoUser._id,
        contact: {
          email: 'info@goalpub.roma.it',
          phone: '+39 06 9876543',
          website: 'https://goalpub.roma.it'
        },
        location: {
          address: {
            street: 'Via del Corso 123',
            city: 'Roma',
            state: 'Lazio',
            postalCode: '00186',
            country: 'Italy'
          },
          coordinates: {
            latitude: 41.9028,
            longitude: 12.4964
          }
        },
        hours: {
          monday: { open: '17:00', close: '01:00', closed: false },
          tuesday: { open: '17:00', close: '01:00', closed: false },
          wednesday: { open: '17:00', close: '01:00', closed: false },
          thursday: { open: '17:00', close: '01:00', closed: false },
          friday: { open: '17:00', close: '02:00', closed: false },
          saturday: { open: '15:00', close: '02:00', closed: false },
          sunday: { open: '15:00', close: '01:00', closed: false }
        },
        capacity: {
          total: 60,
          tables: 45,
          bar: 15,
          outdoor: 20
        },
        features: ['live_sports', 'multiple_screens', 'outdoor_seating', 'full_bar', 'craft_beer', 'wifi'],
        sportsOfferings: [
          { sport: 'calcio', leagues: ['Serie A', 'Premier League'], isPrimary: true },
          { sport: 'tennis', leagues: ['ATP', 'WTA'], isPrimary: false }
        ],
        status: 'approved',
        isVerified: true,
        analytics: {
          totalBookings: 89,
          totalReviews: 15,
          averageRating: 4.5,
          viewCount: 890
        }
      }
    ])

    console.log('🏟️ Created demo venues')

    // Create demo fixtures (upcoming matches)
    const fixtures = await Fixture.create([
      {
        fixtureId: 'fix_001',
        homeTeam: {
          id: 'team_001',
          name: 'Inter',
          logo: 'https://example.com/inter.png'
        },
        awayTeam: {
          id: 'team_002',
          name: 'Milan',
          logo: 'https://example.com/milan.png'
        },
        league: {
          id: 'serie_a',
          name: 'Serie A',
          country: 'Italy',
          season: '2024/25'
        },
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'scheduled',
        popularity: 9
      },
      {
        fixtureId: 'fix_002',
        homeTeam: {
          id: 'team_003',
          name: 'Juventus',
          logo: 'https://example.com/juventus.png'
        },
        awayTeam: {
          id: 'team_004',
          name: 'Napoli',
          logo: 'https://example.com/napoli.png'
        },
        league: {
          id: 'serie_a',
          name: 'Serie A',
          country: 'Italy',
          season: '2024/25'
        },
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        status: 'scheduled',
        popularity: 8
      }
    ])

    console.log('⚽ Created demo fixtures')

    // Create demo bookings
    const bookings = await Booking.create([
      {
        bookingNumber: 'BM20250603001',
        confirmationCode: 'SPT123ABC',
        venueId: venues[0]._id,
        customerInfo: {
          firstName: 'Mario',
          lastName: 'Rossi',
          email: 'mario.rossi@email.it',
          phone: '+39 333 1234567',
          notes: 'Tavolo per la partita Inter-Milan'
        },
        bookingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        bookingTime: '20:00',
        guests: 4,
        duration: 180,
        status: 'confirmed',
        bookingMode: 'contact_only'
      },
      {
        bookingNumber: 'BM20250603002',
        confirmationCode: 'SPT456DEF',
        venueId: venues[1]._id,
        customerInfo: {
          firstName: 'Luigi',
          lastName: 'Bianchi',
          email: 'luigi.bianchi@email.it',
          phone: '+39 333 7654321',
          notes: 'Cena prima della partita'
        },
        bookingDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        bookingTime: '19:30',
        guests: 2,
        duration: 150,
        status: 'pending',
        bookingMode: 'contact_only'
      }
    ])

    console.log('📅 Created demo bookings')

    // Create demo offers
    const offers = await Offer.create([
      {
        title: 'Happy Hour Weekend',
        description: 'Sconto 30% su tutte le bevande durante i weekend!',
        venue: venues[0]._id,
        type: 'percentage',
        discount: { value: 30, unit: 'percentage' },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        timeRestrictions: {
          daysOfWeek: [5, 6], // Friday, Saturday
          startTime: '18:00',
          endTime: '21:00'
        },
        status: 'active',
        analytics: {
          totalRedemptions: 15,
          totalSavings: 450
        }
      },
      {
        title: 'Prendi 2 Paghi 1',
        description: 'Compra una birra e la seconda è gratis!',
        venue: venues[1]._id,
        type: 'buy_one_get_one',
        discount: { value: 1, unit: 'item' },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        limits: {
          usagePerCustomer: 1,
          minimumPartySize: 2
        },
        status: 'active',
        analytics: {
          totalRedemptions: 8,
          totalSavings: 120
        }
      }
    ])

    console.log('🎯 Created demo offers')

    // Create demo reviews
    const reviews = await Review.create([
      {
        venue: venues[0]._id,
        customer: {
          name: 'Giuseppe Verdi',
          email: 'giuseppe.verdi@email.it',
          isVerified: true
        },
        rating: {
          overall: 5,
          food: 4,
          service: 5,
          atmosphere: 5,
          value: 4
        },
        title: 'Fantastico per vedere le partite!',
        content: 'Locale fantastico con maxischermo gigante. Atmosfera incredibile durante Inter-Milan. Servizio veloce e birra sempre fresca. Tornerò sicuramente!',
        visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        partySize: 3,
        status: 'approved'
      },
      {
        venue: venues[1]._id,
        customer: {
          name: 'Anna Bianchi',
          email: 'anna.bianchi@email.it',
          isVerified: true
        },
        rating: {
          overall: 4,
          food: 4,
          service: 4,
          atmosphere: 5,
          value: 4
        },
        title: 'Ottimo pub sportivo',
        content: 'Bel posto nel centro di Roma. Staff gentile e prezzi giusti. Unico neo: un po\' rumoroso durante le partite importanti, ma fa parte del gioco!',
        visitDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        partySize: 2,
        status: 'approved'
      }
    ])

    console.log('⭐ Created demo reviews')

    console.log('✅ Database seeding completed successfully!')
    
    return {
      users: [demoUser, adminUser],
      venues,
      fixtures,
      bookings,
      offers,
      reviews
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

module.exports = { seedData } 