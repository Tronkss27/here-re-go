const app = require('./src/app-debug')

const PORT = process.env.PORT || 3001

console.log('🔍 Starting debug server...')

app.listen(PORT, () => {
  console.log(`✅ Debug server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
}) 