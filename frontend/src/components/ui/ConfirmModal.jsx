import React from 'react'
import Modal from './Modal'
import { ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

/**
 * ConfirmModal - Modal specializzato per conferme e azioni critiche
 */
const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'danger', // danger, warning, info, success
  onConfirm,
  onCancel,
  isLoading = false,
  icon,
  ...props
}) => {
  // Configurazioni per le varianti
  const variantConfig = {
    danger: {
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />,
      iconBg: 'bg-red-100',
      confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      titleColor: 'text-red-900'
    },
    warning: {
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />,
      iconBg: 'bg-yellow-100',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      titleColor: 'text-yellow-900'
    },
    info: {
      icon: <InformationCircleIcon className="h-6 w-6 text-blue-600" />,
      iconBg: 'bg-blue-100',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      titleColor: 'text-blue-900'
    },
    success: {
      icon: <CheckCircleIcon className="h-6 w-6 text-green-600" />,
      iconBg: 'bg-green-100',
      confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      titleColor: 'text-green-900'
    }
  }

  const config = variantConfig[variant] || variantConfig.danger

  const handleConfirm = () => {
    if (!isLoading && onConfirm) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (!isLoading && onCancel) {
      onCancel()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size="small"
      showCloseButton={false}
      closeOnEscape={!isLoading}
      closeOnOverlayClick={!isLoading}
      {...props}
    >
      <Modal.Body>
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${config.iconBg}`}>
            {icon || config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={`text-lg font-medium mb-2 ${config.titleColor}`}>
                {title}
              </h3>
            )}
            
            {message && (
              <div className="text-sm text-gray-600">
                {typeof message === 'string' ? (
                  <p>{message}</p>
                ) : (
                  message
                )}
              </div>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex justify-end space-x-3 w-full">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {cancelText}
          </button>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`
              px-4 py-2 text-sm font-medium text-white rounded-md 
              focus:outline-none focus:ring-2 focus:ring-offset-2 
              disabled:opacity-50 disabled:cursor-not-allowed 
              transition-colors duration-200
              ${config.confirmButton}
            `}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg 
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Attendere...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}

export default ConfirmModal 