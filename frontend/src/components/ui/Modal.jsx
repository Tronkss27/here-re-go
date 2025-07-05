import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Design System Modal Component
const Modal = ({ 
  children, 
  isOpen = false, 
  onClose, 
  size = 'medium',
  className = '',
  overlayClassName = '',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  title,
  ...props 
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Size styles
  const sizes = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full'
  }

  // Base styles
  const overlayStyles = `
    fixed inset-0 z-50 flex items-center justify-center p-4 
    bg-black bg-opacity-50 backdrop-blur-sm
    ${overlayClassName}
  `.trim()

  const modalStyles = `
    relative bg-white rounded-lg shadow-xl 
    max-h-[90vh] overflow-hidden
    w-full ${sizes[size]}
    transform transition-all duration-200
    ${className}
  `.trim()

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.()
    }
  }

  const modalContent = (
    <div className={overlayStyles} onClick={handleOverlayClick}>
      <div 
        className={modalStyles}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        {...props}
      >
        {/* Header with title and close button */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h2 
                id="modal-title"
                className="text-xl font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Close modal"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  )

  // Render in portal to ensure it appears above everything
  return createPortal(modalContent, document.body)
}

// Modal Body Component
const ModalBody = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Modal Footer Component
const ModalFooter = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Export compound component
Modal.Body = ModalBody
Modal.Footer = ModalFooter

export default Modal 