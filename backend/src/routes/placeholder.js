const express = require('express')
const router = express.Router()

// Ritorna una semplice immagine SVG rettangolare grigia di dimensioni richieste
router.get('/:width/:height', (req, res) => {
  const { width, height } = req.params
  const w = parseInt(width, 10) || 40
  const h = parseInt(height, 10) || 40

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <rect width="100%" height="100%" fill="#E5E7EB" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="${Math.floor(w/4)}" fill="#9CA3AF">${w}x${h}</text>
  </svg>`

  res.setHeader('Content-Type', 'image/svg+xml')
  res.send(svg)
})

module.exports = router 