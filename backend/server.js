const app = require('./src/app')
const { connectDB } = require('./src/config/database')
const jobQueue = require('./src/services/jobQueue')
const backgroundScheduler = require('./src/services/backgroundScheduler')

const PORT = process.env.PORT || 3001

// Connect to database
connectDB()

app.listen(PORT, () => {
  console.log(`🚀 SPOrTS API server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`📋 Job queue system initialized`)
  
  // 🤖 Start automatic league management
  console.log(`🤖 Starting automatic league management...`)
  backgroundScheduler.start()
  console.log(`✅ Background scheduler started successfully`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully...')
  backgroundScheduler.stop()
  await jobQueue.shutdown()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('⚠️ SIGINT received, shutting down gracefully...')
  backgroundScheduler.stop()
  await jobQueue.shutdown()
  process.exit(0)
}) 