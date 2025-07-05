const express = require('express')
require('dotenv').config()

const app = express()

console.log('🚀 Starting app initialization...')

// Test 1: Basic JSON middleware
app.use(express.json())
console.log('✅ JSON middleware loaded')

// Test 2: Basic route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SPOrTS API is running (simple)',
    timestamp: new Date().toISOString()
  })
})
console.log('✅ Health route loaded')

// Test 3: Basic error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Something went wrong!' })
})
console.log('✅ Error handler loaded')

console.log('🎯 App initialization complete')

module.exports = app 