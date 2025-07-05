const { validationResult } = require('express-validator')

/**
 * Middleware to handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }))
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages,
      message: errorMessages.map(e => e.message).join(', ')
    })
  }
  
  next()
}

module.exports = {
  handleValidationErrors
} 