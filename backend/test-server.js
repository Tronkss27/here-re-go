const express = require('express')

const app = express()
const PORT = 3001

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`)
}) 