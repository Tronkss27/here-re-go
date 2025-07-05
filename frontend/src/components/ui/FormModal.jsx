import React, { useState, useCallback } from 'react'
import Modal from './Modal'

/**
 * FormModal - Modal specializzato per form con gestione submit
 */
const FormModal = ({
  isOpen,
  title,
  children,
  onClose,
  onSubmit,
  submitText = 'Salva',
  cancelText = 'Annulla',
  submitDisabled = false,
  validationErrors = {},
  size = 'medium',
  showFooter = true,
  customActions,
  ...props
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (isSubmitting || submitDisabled || !onSubmit) {
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      
      // Crea FormData dall'evento
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      
      await onSubmit(data, e)
    } catch (error) {
      console.error('Errore submit form:', error)
      setSubmitError(error.message || 'Errore durante il salvataggio')
    } finally {
      setIsSubmitting(false)
    }
  }, [onSubmit, isSubmitting, submitDisabled])

  const handleCancel = useCallback(() => {
    if (!isSubmitting && onClose) {
      setSubmitError(null)
      onClose()
    }
  }, [onClose, isSubmitting])

  const hasValidationErrors = Object.keys(validationErrors).length > 0

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      size={size}
      onClose={handleCancel}
      closeOnEscape={!isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      {...props}
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <Modal.Body className="flex-1">
          {/* Errori di validazione globali */}
          {hasValidationErrors && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-5 w-5 text-red-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Errori di validazione
                  </h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Errore di submit */}
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-5 w-5 text-red-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contenuto del form */}
          <div className="space-y-4">
            {children}
          </div>
        </Modal.Body>

        {showFooter && (
          <Modal.Footer>
            <div className="flex justify-end space-x-3 w-full">
              {/* Azioni personalizzate */}
              {customActions && (
                <div className="flex space-x-3 mr-auto">
                  {customActions}
                </div>
              )}

              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {cancelText}
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || submitDisabled || hasValidationErrors}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? (
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
                    Salvando...
                  </div>
                ) : (
                  submitText
                )}
              </button>
            </div>
          </Modal.Footer>
        )}
      </form>
    </Modal>
  )
}

export default FormModal 