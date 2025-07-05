const app = require('./src/app')
const { connectDB } = require('./src/config/database')

const PORT = process.env.PORT || 3001

// Connect to database
connectDB()

app.listen(PORT, () => {
  console.log(`🚀 SPOrTS API server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
}) 