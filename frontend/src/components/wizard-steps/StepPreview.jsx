import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, EyeIcon, CalendarIcon } from '@heroicons/react/24/outline'
import ValidationFeedback from '../ui/ValidationFeedback'
import { offersService } from '../../services/offersService'

const StepPreview = ({ data, onPublish, isSubmitting = false }) => {
  const [finalValidation, setFinalValidation] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [publishStatus, setPublishStatus] = useState('draft')

  // Perform final validation when component mounts or data changes
  useEffect(() => {
    const performFinalValidation = async () => {
      setIsValidating(true)
      try {
        const validation = await offersService.validateOffer(data)
        setFinalValidation(validation)
      } catch (error) {
        console.error('Final validation error:', error)
        setFinalValidation({
          isValid: false,
          errors: ['Errore nella validazione finale'],
          warnings: [],
          severity: 'error'
        })
      } finally {
        setIsValidating(false)
      }
    }

    if (data.title && data.description && data.type && data.discount?.value) {
      performFinalValidation()
    }
  }, [data])

  const handlePublish = (status = 'active') => {
    setPublishStatus(status)
    if (onPublish) {
      onPublish({ ...data, status })
    }
  }
  const formatDate = (dateString) => {
    if (!dateString) return 'Non specificata'
    return new Date(dateString).toLocaleString('it-IT')
  }

  const formatTimeRestrictions = () => {
    if (!data.timeRestrictions) return 'Nessuna restrizione'
    
    let text = ''
    
    if (data.timeRestrictions.daysOfWeek?.length > 0) {
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
      const selectedDays = data.timeRestrictions.daysOfWeek.map(day => dayNames[day])
      text += `Giorni: ${selectedDays.join(', ')}`
    }

    if (data.timeRestrictions.startTime && data.timeRestrictions.endTime) {
      if (text) text += ' | '
      text += `Orario: ${data.timeRestrictions.startTime} - ${data.timeRestrictions.endTime}`
    }

    return text || 'Sempre disponibile'
  }

  const getStatusBadge = () => {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Bozza
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Anteprima Offerta
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Controlla tutti i dettagli della tua offerta prima di pubblicarla. Potrai sempre modificarla in seguito.
        </p>
      </div>

      {/* Offer Card Preview */}
      <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
        {/* Header with background color */}
        <div 
          className="px-6 py-4"
          style={{ 
            backgroundColor: data.display?.backgroundColor || '#ff6b35',
            color: data.display?.textColor || '#ffffff'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{data.title || 'Titolo Offerta'}</h2>
              <p className="text-sm opacity-90 mt-1">
                {offersService.formatDiscount(data.discount, data.type)}
              </p>
            </div>
            <div className="text-right">
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">
            {data.description || 'Descrizione offerta'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Dettagli Sconto</h4>
                <div className="bg-gray-50 rounded-md p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">{data.type || 'Non specificato'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Valore:</span>
                    <span className="font-medium">
                      {offersService.formatDiscount(data.discount, data.type)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Periodo di Validità</h4>
                <div className="bg-gray-50 rounded-md p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Inizio:</span>
                    <span className="font-medium">{formatDate(data.validFrom)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fine:</span>
                    <span className="font-medium">{formatDate(data.validUntil)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Restrizioni</h4>
                <div className="bg-gray-50 rounded-md p-3 space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Orari: </span>
                    <span className="font-medium">{formatTimeRestrictions()}</span>
                  </div>
                  {data.limits?.minimumPartySize > 1 && (
                    <div className="text-sm">
                      <span className="text-gray-600">Min. persone: </span>
                      <span className="font-medium">{data.limits.minimumPartySize}</span>
                    </div>
                  )}
                  {data.limits?.minimumAmount > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-600">Spesa minima: </span>
                      <span className="font-medium">€{data.limits.minimumAmount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Limiti di Utilizzo</h4>
                <div className="bg-gray-50 rounded-md p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Per cliente:</span>
                    <span className="font-medium">{data.limits?.usagePerCustomer || 1}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Totali:</span>
                    <span className="font-medium">
                      {data.limits?.totalUsage || 'Illimitati'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          {data.terms && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Termini e Condizioni</h4>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-sm text-gray-700">{data.terms}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-3">📊 Riepilogo Configurazione</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-blue-900">Tipo</div>
            <div className="text-blue-700">{data.type || 'N/A'}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-blue-900">Sconto</div>
            <div className="text-blue-700">
              {data.discount?.value ? offersService.formatDiscount(data.discount, data.type) : 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-blue-900">Durata</div>
            <div className="text-blue-700">
              {data.validFrom && data.validUntil 
                ? `${Math.ceil((new Date(data.validUntil) - new Date(data.validFrom)) / (1000 * 60 * 60 * 24))} giorni`
                : 'N/A'
              }
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-blue-900">Restrizioni</div>
            <div className="text-blue-700">
              {data.timeRestrictions?.daysOfWeek?.length > 0 || 
               data.timeRestrictions?.startTime || 
               data.limits?.minimumPartySize > 1 || 
               data.limits?.minimumAmount > 0 ? 'Sì' : 'No'}
            </div>
          </div>
        </div>
      </div>

      {/* Final Validation */}
      {isValidating && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
            <span className="text-sm text-gray-600">Validazione finale in corso...</span>
          </div>
        </div>
      )}

      {finalValidation && (
        <div className="space-y-4">
          <ValidationFeedback 
            validation={finalValidation} 
            showOnSuccess={true}
          />
        </div>
      )}

      {/* Event Targeting Summary */}
      {data.eventTargeting?.enabled && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-900 mb-3">🎯 Targeting Eventi</h4>
          <div className="space-y-2 text-sm text-purple-700">
            {data.eventTargeting.fixtures?.length > 0 && (
              <div>Eventi specifici: {data.eventTargeting.fixtures.length} selezionati</div>
            )}
            {data.eventTargeting.leagues?.length > 0 && (
              <div>Leghe: {data.eventTargeting.leagues.join(', ')}</div>
            )}
            {data.eventTargeting.teams?.length > 0 && (
              <div>Squadre: {data.eventTargeting.teams.join(', ')}</div>
            )}
            {data.eventTargeting.autoActivation?.enabled && (
              <div>
                Auto-attivazione: {data.eventTargeting.autoActivation.minutesBefore} min prima, 
                {data.eventTargeting.autoActivation.minutesAfter} min dopo
              </div>
            )}
          </div>
        </div>
      )}

      {/* Publication Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Pubblicazione Offerta</h4>
        
        <div className="space-y-4">
          {/* Publication Status Options */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Stato di Pubblicazione
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="publishStatus"
                  value="draft"
                  checked={publishStatus === 'draft'}
                  onChange={(e) => setPublishStatus(e.target.value)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Salva come bozza (potrai attivarla in seguito)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="publishStatus"
                  value="active"
                  checked={publishStatus === 'active'}
                  onChange={(e) => setPublishStatus(e.target.value)}
                  disabled={!finalValidation?.isValid}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 disabled:opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Pubblica immediatamente (visibile ai clienti)
                </span>
              </label>
            </div>
          </div>

          {/* Publication Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handlePublish('draft')}
              disabled={isSubmitting}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Salvataggio...' : 'Salva come Bozza'}
            </button>

            <button
              type="button"
              onClick={() => handlePublish('active')}
              disabled={isSubmitting || !finalValidation?.isValid}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Pubblicazione...' : 'Pubblica Offerta'}
            </button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Le bozze possono essere modificate e attivate in qualsiasi momento</p>
            <p>• Le offerte pubblicate sono immediatamente visibili ai clienti</p>
            <p>• Puoi sempre modificare o disattivare un'offerta pubblicata</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {finalValidation?.isValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Offerta Pronta per la Pubblicazione!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Tutti i controlli sono stati superati con successo. 
                  La tua offerta è configurata correttamente e pronta per essere pubblicata.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StepPreview 