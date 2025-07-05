import React, { useState, useEffect } from 'react'
import ValidationFeedback from '../ui/ValidationFeedback'
import { offersService } from '../../services/offersService'

const StepConfiguration = ({ data, onChange, errors }) => {
  const [validationFeedback, setValidationFeedback] = useState(null)
  const [fieldValidations, setFieldValidations] = useState({})
  const [isValidating, setIsValidating] = useState(false)
  // Real-time validation for dates
  useEffect(() => {
    if (data.validFrom && data.validUntil) {
      const dateValidation = offersService.validateDateRange(data.validFrom, data.validUntil)
      setFieldValidations(prev => ({
        ...prev,
        dateRange: dateValidation
      }))
    }
  }, [data.validFrom, data.validUntil])

  // Real-time validation for time restrictions
  useEffect(() => {
    if (data.timeRestrictions?.startTime && data.timeRestrictions?.endTime) {
      const timeValidation = offersService.validateTimeRange(
        data.timeRestrictions.startTime, 
        data.timeRestrictions.endTime
      )
      setFieldValidations(prev => ({
        ...prev,
        timeRange: timeValidation
      }))
    }
  }, [data.timeRestrictions?.startTime, data.timeRestrictions?.endTime])

  // Real-time validation for discount
  useEffect(() => {
    if (data.type && data.discount?.value) {
      const discountValidation = offersService.validateDiscount(data.type, data.discount.value)
      setFieldValidations(prev => ({
        ...prev,
        discount: discountValidation
      }))
    }
  }, [data.type, data.discount?.value])

  // Comprehensive validation check
  useEffect(() => {
    const validateFullOffer = async () => {
      if (data.title && data.description && data.type && data.discount?.value && 
          data.validFrom && data.validUntil) {
        setIsValidating(true)
        try {
          const fullValidation = await offersService.validateOffer(data)
          setValidationFeedback(fullValidation)
        } catch (error) {
          console.error('Validation error:', error)
        } finally {
          setIsValidating(false)
        }
      }
    }

    const timeoutId = setTimeout(validateFullOffer, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [data])

  const handleChange = (field, value) => {
    onChange({ [field]: value })
  }

  const handleNestedChange = (parentField, childField, value) => {
    onChange({
      [parentField]: {
        ...data[parentField],
        [childField]: value
      }
    })
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

  const toggleDay = (dayIndex) => {
    const currentDays = data.timeRestrictions?.daysOfWeek || []
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter(day => day !== dayIndex)
      : [...currentDays, dayIndex].sort()
    
    handleNestedChange('timeRestrictions', 'daysOfWeek', newDays)
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Configurazione Dettagliata
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configura i dettagli specifici della tua offerta, inclusi sconto, validità e restrizioni.
        </p>
      </div>

      {/* Discount Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Configurazione Sconto</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valore Sconto *
            </label>
            <div className="relative">
              <input
                type="number"
                value={data.discount?.value || ''}
                onChange={(e) => handleNestedChange('discount', 'value', Number(e.target.value))}
                placeholder="0"
                min="0"
                step={data.type === 'percentage' ? '1' : '0.01'}
                max={data.type === 'percentage' ? '100' : undefined}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.discount ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">
                  {data.type === 'percentage' ? '%' : '€'}
                </span>
              </div>
            </div>
            {errors.discount && (
              <p className="mt-1 text-sm text-red-600">{errors.discount}</p>
            )}
            {fieldValidations.discount && (
              <ValidationFeedback 
                validation={fieldValidations.discount} 
                className="mt-2" 
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unità
            </label>
            <select
              value={data.discount?.unit || 'percentage'}
              onChange={(e) => handleNestedChange('discount', 'unit', e.target.value)}
              disabled={data.type === 'percentage' || data.type === 'fixed_amount'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
            >
              <option value="percentage">Percentuale (%)</option>
              <option value="euro">Euro (€)</option>
              <option value="item">Articolo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Validity Period */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Periodo di Validità</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Inizio *
            </label>
            <input
              type="datetime-local"
              value={data.validFrom || ''}
              onChange={(e) => handleChange('validFrom', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.validFrom ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.validFrom && (
              <p className="mt-1 text-sm text-red-600">{errors.validFrom}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fine *
            </label>
            <input
              type="datetime-local"
              value={data.validUntil || ''}
              onChange={(e) => handleChange('validUntil', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.validUntil ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.validUntil && (
              <p className="mt-1 text-sm text-red-600">{errors.validUntil}</p>
            )}
          </div>
        </div>
        
        {/* Date Range Validation Feedback */}
        {fieldValidations.dateRange && (
          <ValidationFeedback 
            validation={fieldValidations.dateRange} 
            className="mt-4" 
          />
        )}
      </div>

      {/* Time Restrictions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Restrizioni Orarie (Opzionale)</h4>
        
        <div className="space-y-4">
          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Giorni della Settimana
            </label>
            <div className="flex flex-wrap gap-2">
              {dayNames.map((dayName, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    data.timeRestrictions?.daysOfWeek?.includes(index)
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {dayName}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Lascia vuoto per applicare l'offerta tutti i giorni
            </p>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orario Inizio
              </label>
              <input
                type="time"
                value={data.timeRestrictions?.startTime || ''}
                onChange={(e) => handleNestedChange('timeRestrictions', 'startTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orario Fine
              </label>
              <input
                type="time"
                value={data.timeRestrictions?.endTime || ''}
                onChange={(e) => handleNestedChange('timeRestrictions', 'endTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          
          {errors.timeRestrictions && (
            <p className="text-sm text-red-600">{errors.timeRestrictions}</p>
          )}
          
          {/* Time Range Validation Feedback */}
          {fieldValidations.timeRange && (
            <ValidationFeedback 
              validation={fieldValidations.timeRange} 
              className="mt-4" 
            />
          )}
        </div>
      </div>

      {/* Usage Limits */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Limiti di Utilizzo</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numero Minimo Persone
            </label>
            <input
              type="number"
              value={data.limits?.minimumPartySize || 1}
              onChange={(e) => handleNestedChange('limits', 'minimumPartySize', Number(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spesa Minima (€)
            </label>
            <input
              type="number"
              value={data.limits?.minimumAmount || 0}
              onChange={(e) => handleNestedChange('limits', 'minimumAmount', Number(e.target.value))}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Utilizzi per Cliente
            </label>
            <input
              type="number"
              value={data.limits?.usagePerCustomer || 1}
              onChange={(e) => handleNestedChange('limits', 'usagePerCustomer', Number(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Utilizzi Totali
            </label>
            <input
              type="number"
              value={data.limits?.totalUsage || ''}
              onChange={(e) => handleNestedChange('limits', 'totalUsage', e.target.value ? Number(e.target.value) : null)}
              min="1"
              placeholder="Illimitato"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Termini e Condizioni</h4>
        
        <textarea
          value={data.terms || ''}
          onChange={(e) => handleChange('terms', e.target.value)}
          placeholder="Inserisci eventuali termini e condizioni specifici per questa offerta..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {/* Overall Validation Feedback */}
      {validationFeedback && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Stato Validazione</h4>
            {isValidating && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                <span className="text-sm text-gray-500">Validazione in corso...</span>
              </div>
            )}
          </div>
          
          <ValidationFeedback 
            validation={validationFeedback} 
            showOnSuccess={true}
          />
        </div>
      )}
    </div>
  )
}

export default StepConfiguration 