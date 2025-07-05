import React, { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline'
import { offersService } from '../services/offersService'
import { useModal } from '../contexts/ModalContext'

// Import step components
import StepBasicInfo from './wizard-steps/StepBasicInfo'
import StepTemplate from './wizard-steps/StepTemplate'
import StepConfiguration from './wizard-steps/StepConfiguration'
import StepPreview from './wizard-steps/StepPreview'

const OfferWizard = ({ isOpen, onClose, onOfferCreated, editOffer = null }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [offerData, setOfferData] = useState({
    title: '',
    description: '',
    type: '',
    discount: { value: 0, unit: 'percentage' },
    validFrom: '',
    validUntil: '',
    timeRestrictions: {
      daysOfWeek: [],
      startTime: '',
      endTime: ''
    },
    limits: {
      totalUsage: null,
      usagePerCustomer: 1,
      minimumPartySize: 1,
      minimumAmount: 0
    },
    applicableItems: [],
    terms: '',
    display: {
      isPublic: true,
      isFeatured: false,
      backgroundColor: '#ff6b35',
      textColor: '#ffffff'
    }
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState([])
  const { showConfirmModal } = useModal()

  const steps = [
    { id: 1, name: 'Informazioni Base', component: StepBasicInfo },
    { id: 2, name: 'Template', component: StepTemplate },
    { id: 3, name: 'Configurazione', component: StepConfiguration },
    { id: 4, name: 'Anteprima', component: StepPreview }
  ]

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])

  // Load offer data for editing
  useEffect(() => {
    if (editOffer) {
      setOfferData(editOffer)
    }
  }, [editOffer])

  const loadTemplates = async () => {
    try {
      const response = await offersService.getPredefinedTemplates()
      if (response.success) {
        setTemplates(response.data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const updateOfferData = (stepData) => {
    setOfferData(prev => ({
      ...prev,
      ...stepData
    }))
    setValidationErrors({})
  }

  const validateCurrentStep = () => {
    const errors = {}

    switch (currentStep) {
      case 1: // Basic Info
        if (!offerData.title?.trim()) {
          errors.title = 'Il titolo è obbligatorio'
        }
        if (!offerData.description?.trim()) {
          errors.description = 'La descrizione è obbligatoria'
        }
        if (!offerData.type) {
          errors.type = 'Il tipo di offerta è obbligatorio'
        }
        break

      case 2: // Template (optional step, no validation needed)
        break

      case 3: // Configuration
        if (!offerData.discount?.value || offerData.discount.value <= 0) {
          errors.discount = 'Il valore dello sconto deve essere maggiore di 0'
        }
        if (!offerData.validFrom) {
          errors.validFrom = 'La data di inizio è obbligatoria'
        }
        if (!offerData.validUntil) {
          errors.validUntil = 'La data di fine è obbligatoria'
        }
        
        // Date validation
        if (offerData.validFrom && offerData.validUntil) {
          const startDate = new Date(offerData.validFrom)
          const endDate = new Date(offerData.validUntil)
          const now = new Date()

          if (startDate >= endDate) {
            errors.validUntil = 'La data di fine deve essere successiva alla data di inizio'
          }
          if (endDate <= now) {
            errors.validUntil = 'La data di fine deve essere futura'
          }
        }

        // Time validation
        if (offerData.timeRestrictions?.startTime && offerData.timeRestrictions?.endTime) {
          if (offerData.timeRestrictions.startTime >= offerData.timeRestrictions.endTime) {
            errors.timeRestrictions = 'L\'orario di fine deve essere successivo all\'orario di inizio'
          }
        }

        // Discount validation
        if (offerData.type === 'percentage' && offerData.discount?.value > 100) {
          errors.discount = 'La percentuale di sconto non può essere superiore al 100%'
        }
        break

      case 4: // Preview (final validation)
        const validation = offersService.validateOfferData(offerData)
        if (!validation.isValid) {
          validation.errors.forEach(error => {
            errors.general = errors.general ? `${errors.general}, ${error}` : error
          })
        }
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setValidationErrors({})
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    setIsLoading(true)
    try {
      let response
      if (editOffer) {
        response = await offersService.updateOffer(editOffer._id, offerData)
      } else {
        response = await offersService.createOffer(offerData)
      }

      if (response.success) {
        onOfferCreated(response.data)
        onClose()
        // Reset form
        setCurrentStep(1)
        setOfferData({
          title: '',
          description: '',
          type: '',
          discount: { value: 0, unit: 'percentage' },
          validFrom: '',
          validUntil: '',
          timeRestrictions: { daysOfWeek: [], startTime: '', endTime: '' },
          limits: { totalUsage: null, usagePerCustomer: 1, minimumPartySize: 1, minimumAmount: 0 },
          applicableItems: [],
          terms: '',
          display: { isPublic: true, isFeatured: false, backgroundColor: '#ff6b35', textColor: '#ffffff' }
        })
      }
    } catch (error) {
      console.error('Error saving offer:', error)
      setValidationErrors({ general: 'Errore nel salvataggio dell\'offerta' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (offerData.title || offerData.description) {
      showConfirmModal({
        title: 'Conferma chiusura',
        message: 'Sei sicuro di voler chiudere? Le modifiche non salvate andranno perse.',
        onConfirm: () => {
          onClose()
          setCurrentStep(1)
          setOfferData({
            title: '',
            description: '',
            type: '',
            discount: { value: 0, unit: 'percentage' },
            validFrom: '',
            validUntil: '',
            timeRestrictions: { daysOfWeek: [], startTime: '', endTime: '' },
            limits: { totalUsage: null, usagePerCustomer: 1, minimumPartySize: 1, minimumAmount: 0 },
            applicableItems: [],
            terms: '',
            display: { isPublic: true, isFeatured: false, backgroundColor: '#ff6b35', textColor: '#ffffff' }
          })
        }
      })
    } else {
      onClose()
    }
  }

  const isStepCompleted = (stepId) => {
    return stepId < currentStep
  }

  const isStepActive = (stepId) => {
    return stepId === currentStep
  }

  const handlePublish = async (offerDataWithStatus) => {
    setIsLoading(true)
    setValidationErrors({})

    try {
      let result
      if (editOffer) {
        result = await offersService.updateOffer(editOffer._id, offerDataWithStatus)
      } else {
        result = await offersService.createOffer(offerDataWithStatus)
      }

      if (result.success) {
        onOfferCreated?.(result.data)
        onClose()
        
        // Reset form
        setCurrentStep(1)
        setOfferData({
          title: '',
          description: '',
          type: '',
          discount: { value: 0, unit: 'percentage' },
          validFrom: '',
          validUntil: '',
          timeRestrictions: { daysOfWeek: [], startTime: '', endTime: '' },
          limits: { totalUsage: null, usagePerCustomer: 1, minimumPartySize: 1, minimumAmount: 0 },
          applicableItems: [],
          terms: '',
          display: { isPublic: true, isFeatured: false, backgroundColor: '#ff6b35', textColor: '#ffffff' }
        })
      } else {
        setValidationErrors({ general: result.message || 'Errore nel salvataggio dell\'offerta' })
      }
    } catch (error) {
      console.error('Error publishing offer:', error)
      setValidationErrors({ general: 'Errore nel salvataggio dell\'offerta' })
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentStepComponent = () => {
    const StepComponent = steps[currentStep - 1].component
    const props = {
      data: offerData,
      onChange: updateOfferData,
      errors: validationErrors,
      templates: templates
    }

    // Add special props for the preview step
    if (currentStep === 4) {
      props.onPublish = handlePublish
      props.isSubmitting = isLoading
    }

    return <StepComponent {...props} />
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editOffer ? 'Modifica Offerta' : 'Crea Nuova Offerta'}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Chiudi</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="mt-4">
              <div className="flex items-center">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        isStepCompleted(step.id)
                          ? 'bg-green-600 text-white'
                          : isStepActive(step.id)
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isStepCompleted(step.id) ? (
                        <CheckIcon className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium ${
                        isStepActive(step.id) ? 'text-orange-600' : 'text-gray-500'
                      }`}
                    >
                      {step.name}
                    </span>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="px-6 py-6 min-h-[400px]">
            {validationErrors.general && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{validationErrors.general}</p>
              </div>
            )}
            
            {getCurrentStepComponent()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Indietro
            </button>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Annulla
              </button>
              
              {currentStep < steps.length && (
                <button
                  onClick={nextStep}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
                >
                  Avanti
                  <ChevronRightIcon className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfferWizard 