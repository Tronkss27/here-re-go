import React from 'react'
import { offersService } from '../../services/offersService'

const StepTemplate = ({ data, onChange, templates }) => {
  const handleTemplateSelect = (template) => {
    const templateData = offersService.applyTemplate(template.id, {
      title: data.title,
      description: data.description,
      type: data.type
    })
    onChange(templateData)
  }

  const handleSkipTemplate = () => {
    // Just proceed without applying any template
    // The user will configure manually in the next step
  }

  const getTemplateIcon = (templateId) => {
    const icons = {
      happy_hour: '🍻',
      derby_special: '⚽',
      group_discount: '👥',
      early_bird: '🐦'
    }
    return icons[templateId] || '🎁'
  }

  const getCompatibleTemplates = () => {
    if (!data.type) return templates
    
    // Filter templates compatible with selected offer type
    return templates.filter(template => {
      if (data.type === 'happy_hour') {
        return template.id === 'happy_hour'
      }
      if (data.type === 'buy_one_get_one') {
        return template.id === 'derby_special'
      }
      if (data.type === 'percentage') {
        return ['happy_hour', 'group_discount'].includes(template.id)
      }
      if (data.type === 'fixed_amount') {
        return template.id === 'early_bird'
      }
      return true
    })
  }

  const compatibleTemplates = getCompatibleTemplates()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Scegli un Template (Opzionale)
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Seleziona un template predefinito per velocizzare la configurazione, oppure continua per impostare tutto manualmente.
        </p>
      </div>

      {compatibleTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {compatibleTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="cursor-pointer rounded-lg border-2 border-gray-200 p-6 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                <div 
                  className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ 
                    backgroundColor: template.display.backgroundColor,
                    color: template.display.textColor 
                  }}
                >
                  {getTemplateIcon(template.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>
                  
                  {/* Template Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Sconto:</span>
                      <span className="font-medium text-gray-700">
                        {offersService.formatDiscount(template.discount, template.type)}
                      </span>
                    </div>
                    
                    {template.timeRestrictions && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Orari:</span>
                        <span className="font-medium text-gray-700">
                          {template.timeRestrictions.startTime && template.timeRestrictions.endTime
                            ? `${template.timeRestrictions.startTime} - ${template.timeRestrictions.endTime}`
                            : 'Sempre'
                          }
                        </span>
                      </div>
                    )}
                    
                    {template.limits?.minimumPartySize > 1 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Min. persone:</span>
                        <span className="font-medium text-gray-700">
                          {template.limits.minimumPartySize}
                        </span>
                      </div>
                    )}
                    
                    {template.limits?.minimumAmount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Spesa min.:</span>
                        <span className="font-medium text-gray-700">
                          €{template.limits.minimumAmount}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <button
                      type="button"
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
                    >
                      Usa questo Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun template compatibile
          </h3>
          <p className="text-sm text-gray-600">
            Non ci sono template predefiniti compatibili con il tipo di offerta selezionato.
            Procedi al prossimo step per configurare manualmente la tua offerta.
          </p>
        </div>
      )}

      {/* Skip Template Option */}
      <div className="border-t border-gray-200 pt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                Configurazione Personalizzata
              </h4>
              <p className="text-xs text-gray-600">
                Preferisci configurare tutto manualmente? Salta questo step e procedi alla configurazione dettagliata.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSkipTemplate}
              className="ml-4 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Configura Manualmente
            </button>
          </div>
        </div>
      </div>

      {/* Current Selection Info */}
      {data.title && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            📋 Riepilogo Attuale
          </h4>
          <div className="space-y-1 text-sm text-blue-700">
            <p><strong>Titolo:</strong> {data.title}</p>
            <p><strong>Tipo:</strong> {data.type}</p>
            {data.discount?.value > 0 && (
              <p><strong>Sconto:</strong> {offersService.formatDiscount(data.discount, data.type)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StepTemplate 