// Central export file for all API services
export { default as apiClient, withLoading, handleApiError } from './apiClient.js'
export { default as fixturesService } from './fixturesService.js'
import venuesServiceInstance from './venuesService.js';
export { venuesServiceInstance as venuesService };
export { default as bookingsService } from './bookingsService.js'

// Export API configuration
export { default as apiConfig } from '../config/api.js' 
export * from '../config/api.js' 