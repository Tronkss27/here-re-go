const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports-bar'
    
    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 15000, // Increased timeout
      socketTimeoutMS: 0, // Disable socket timeout (no auto-disconnect)
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    })

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    
    // Handle connection events with more info
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected - attempting reconnection...')
    })

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully')
    })

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected')
    })

    // Graceful close on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('🔌 MongoDB connection closed through app termination')
      process.exit(0)
    })

    return conn
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
}

// Database health check
const checkDBHealth = async () => {
  try {
    const state = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
    
    return {
      status: states[state],
      state,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    }
  }
}

module.exports = {
  connectDB,
  checkDBHealth
} 