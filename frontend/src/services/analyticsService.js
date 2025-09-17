import apiClient from './apiClient.js'

class AnalyticsService {
  async getOverview(venueId, { from, to } = {}) {
    const params = { t: Date.now() }
    if (from) params.from = from
    if (to) params.to = to
    return apiClient.get(`/venues/${venueId}/analytics/overview`, { params })
  }

  async getTop(venueId, { metric = 'views', limit = 10, from, to } = {}) {
    const params = { metric, limit, t: Date.now() }
    if (from) params.from = from
    if (to) params.to = to
    return apiClient.get(`/venues/${venueId}/analytics/top`, { params })
  }

  async getTimeseries(venueId, { metric = 'views', from, to } = {}) {
    const params = { metric, t: Date.now() }
    if (from) params.from = from
    if (to) params.to = to
    return apiClient.get(`/venues/${venueId}/analytics/timeseries`, { params })
  }

  // Top matches globali (admin panoramica globale)
  async getTopMatchesGlobal({ limit = 10, from, to, global = false } = {}) {
    const params = { limit, global: global ? 'true' : undefined, t: Date.now() }
    if (from) params.from = from
    if (to) params.to = to
    return apiClient.get(`/analytics/matches/top`, { params })
  }

  // Traffico match per un locale specifico (match-traffic per venue)
  async getVenueMatchTraffic(venueId, { from, to } = {}) {
    const params = { t: Date.now() }
    if (from) params.from = from
    if (to) params.to = to
    return apiClient.get(`/venues/${venueId}/analytics/match-traffic`, { params })
  }
}

const analyticsService = new AnalyticsService()
export default analyticsService

// Dev helper: esponi in console per test manuali senza import
if (typeof window !== 'undefined' && import.meta && import.meta.env && import.meta.env.DEV) {
  window.analyticsService = analyticsService
}


