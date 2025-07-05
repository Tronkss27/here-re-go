const express = require('express')
require('dotenv').config()

const app = express()

console.log('🔍 Starting debug app initialization...')

try {
  // Test CORS
  const cors = require('cors')
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }))
  console.log('✅ CORS middleware loaded')

  // Test Helmet
  const helmet = require('helmet')
  app.use(helmet())
  console.log('✅ Helmet middleware loaded')

  // Test Rate limiting
  const rateLimit = require('express-rate-limit')
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  })
  app.use(limiter)
  console.log('✅ Rate limit middleware loaded')

  // Test Body parsing
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))
  console.log('✅ Body parsing middleware loaded')

  // Test Morgan
  const morgan = require('morgan')
  app.use(morgan('combined'))
  console.log('✅ Morgan middleware loaded')

  // Test adding a single route
  try {
    console.log('🔍 Testing route imports...')
    app.use('/api/venues', require('./routes/venues'))
    console.log('✅ Venues route loaded')
    
    app.use('/api/auth', require('./routes/auth'))
    console.log('✅ Auth route loaded')
    
    app.use('/api/bookings', require('./routes/bookings'))
    console.log('✅ Bookings route loaded')
    
    app.use('/api/offers', require('./routes/offers'))
    console.log('✅ Offers route loaded')
    
    app.use('/api/reviews', require('./routes/reviews'))
    console.log('✅ Reviews route loaded')
    
    app.use('/api/fixtures', require('./routes/fixtures'))
    console.log('✅ Fixtures route loaded')
  } catch (error) {
    console.error('❌ Error loading routes:', error)
  }

} catch (error) {
  console.error('❌ Error loading middleware:', error)
  process.exit(1)
}

// Health route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SPOrTS API is running (debug)',
    timestamp: new Date().toISOString()
  })
})
console.log('✅ Health route loaded')

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Something went wrong!' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  })
})
console.log('✅ 404 handler loaded')

console.log('🎯 Debug app initialization complete')

module.exports = app 