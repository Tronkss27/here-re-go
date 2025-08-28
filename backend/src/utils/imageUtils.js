/**
 * Utility functions for handling image URLs
 */

/**
 * Gets the base URL from the request object
 * @param {Object} req - Express request object
 * @returns {string} - Base URL for the current request
 */
function getBaseUrlFromRequest(req) {
  if (!req) return 'http://localhost:3001';
  
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:3001';
  
  return `${protocol}://${host}`;
}

/**
 * Fixes HTML encoded image URLs and converts them to full URLs
 * @param {string} imageUrl - The potentially encoded image URL
 * @param {string} baseUrl - Base URL for the server (default: localhost:3001)
 * @returns {string} - Clean, full image URL
 */
function fixImageUrl(imageUrl, baseUrl = 'http://localhost:3001') {
  if (!imageUrl) return null;
  
  // Decode HTML entities
  let cleanUrl = imageUrl
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  
  // If it's already a full URL, return as is
  if (cleanUrl.startsWith('http')) {
    return cleanUrl;
  }
  
  // If it starts with /, prepend base URL
  if (cleanUrl.startsWith('/')) {
    return `${baseUrl}${cleanUrl}`;
  }
  
  // Otherwise, assume it's a relative path and add /
  return `${baseUrl}/${cleanUrl}`;
}

/**
 * Processes venue images array to fix URLs
 * @param {Array} images - Array of image objects
 * @param {string} baseUrl - Base URL for the server
 * @returns {Array} - Array with fixed image URLs
 */
function processVenueImages(images, baseUrl = 'http://localhost:3001') {
  if (!Array.isArray(images)) return [];
  
  return images.map(img => ({
    ...img,
    url: fixImageUrl(img.url, baseUrl)
  }));
}

/**
 * Processes venue object to fix image URLs
 * @param {Object} venue - Venue object
 * @param {string|Object} baseUrlOrReq - Base URL string or Express request object
 * @returns {Object} - Venue with fixed image URLs
 */
function processVenueWithImages(venue, baseUrlOrReq = 'http://localhost:3001') {
  if (!venue) return venue;
  
  // Determine base URL
  let baseUrl;
  if (typeof baseUrlOrReq === 'string') {
    baseUrl = baseUrlOrReq;
  } else {
    baseUrl = getBaseUrlFromRequest(baseUrlOrReq);
  }
  
  return {
    ...venue,
    images: processVenueImages(venue.images, baseUrl),
    // 🗺️ CRITICAL: Copy location.coordinates to root for frontend maps
    coordinates: venue.coordinates || venue.location?.coordinates
  };
}

module.exports = {
  getBaseUrlFromRequest,
  fixImageUrl,
  processVenueImages,
  processVenueWithImages
}; 