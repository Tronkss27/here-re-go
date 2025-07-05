#!/usr/bin/env node

const mongoose = require('mongoose')
const { connectDB } = require('../src/config/database')
const { seedData } = require('../src/utils/seedData')

const runSeeding = async () => {
  try {
    console.log('🚀 Starting database seeding process...')
    
    // Connect to database
    await connectDB()
    
    // Run seeding
    const result = await seedData()
    
    console.log('\n📊 Seeding Summary:')
    console.log(`👥 Users created: ${result.users.length}`)
    console.log(`🏟️ Venues created: ${result.venues.length}`)
    console.log(`⚽ Fixtures created: ${result.fixtures.length}`)
    console.log(`📅 Bookings created: ${result.bookings.length}`)
    console.log(`🎯 Offers created: ${result.offers.length}`)
    console.log(`⭐ Reviews created: ${result.reviews.length}`)
    
    console.log('\n✅ Database seeding completed successfully!')
    console.log('\n🔗 Demo Login Credentials:')
    console.log('Email: demo@sports.it')
    console.log('Password: demo123')
    console.log('\n🔗 Admin Login Credentials:')
    console.log('Email: admin@sports.it')
    console.log('Password: admin123')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    process.exit(1)
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🌱 SPOrTS Database Seeding Script

Usage:
  npm run seed              # Run seeding with demo data
  npm run seed -- --help    # Show this help message

This script will:
1. Connect to MongoDB
2. Clear existing data
3. Insert demo data (users, venues, fixtures, bookings, offers, reviews)
4. Display summary of created records

Demo accounts created:
- demo@sports.it / demo123 (venue owner)
- admin@sports.it / admin123 (admin)
`)
  process.exit(0)
}

runSeeding() 