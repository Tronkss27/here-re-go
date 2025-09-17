const mongoose = require('mongoose')
const Review = require('../models/Review')

function toStarsDistribution(rows = []) {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of rows) {
    const v = Math.round(r.rating?.overall || r.rating || 0)
    if (v >= 1 && v <= 5) dist[v] += 1
  }
  return dist
}

exports.getSummary = async (req, res) => {
  try {
    const { venueId } = req.params
    const venueObjId = new mongoose.Types.ObjectId(venueId)
    const rows = await Review.find({ venue: venueObjId, status: 'approved' }).select('rating.overall')
    const total = rows.length
    const avg = total > 0 ? Math.round((rows.reduce((a, r) => a + (r.rating.overall || 0), 0) / total) * 10) / 10 : 0
    const stars = toStarsDistribution(rows)
    return res.json({ success: true, data: { total, avg, stars } })
  } catch (err) {
    console.error('getSummary error', err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.getList = async (req, res) => {
  try {
    const { venueId } = req.params
    const { rating, limit = 20, skip = 0 } = req.query
    const query = { venue: new mongoose.Types.ObjectId(venueId), status: 'approved' }
    if (rating) {
      const v = parseInt(rating, 10)
      if (v >= 1 && v <= 5) query['rating.overall'] = v
    }
    const items = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 50))
      .select('customer.name rating.overall content createdAt response')

    return res.json({ success: true, data: { items } })
  } catch (err) {
    console.error('getList error', err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

exports.postReply = async (req, res) => {
  try {
    const { id } = req.params
    const { text } = req.body
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Reply text required' })
    const review = await Review.findById(id)
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' })
    await review.respond(text.trim(), req.user?._id)
    return res.json({ success: true })
  } catch (err) {
    console.error('postReply error', err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}




