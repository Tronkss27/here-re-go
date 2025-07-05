const app = require('./src/app-simple')

const PORT = process.env.PORT || 3001

console.log('🚀 Starting simple server...')

app.listen(PORT, () => {
  console.log(`✅ Simple server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
}) 