import apiClient from './apiClient.js'
import { API_ENDPOINTS } from '@/config/api.js'

class ReviewsService {
  async getSummary(venueId) {
    return apiClient.get(`/venues/${venueId}/reviews/summary`)
  }

  async getList(venueId, params = {}) {
    return apiClient.get(`/venues/${venueId}/reviews`, { params })
  }

  async postReply(reviewId, text) {
    return apiClient.post(`/reviews/${reviewId}/reply`, { text })
  }
}

const reviewsService = new ReviewsService()
export default reviewsService

if (window.Cypress || import.meta.env.DEV) {
  window.reviewsService = reviewsService
}



