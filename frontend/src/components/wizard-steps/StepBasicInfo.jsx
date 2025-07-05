import React from 'react'

const StepBasicInfo = ({ data, onChange, errors }) => {
  const handleChange = (field, value) => {
    onChange({ [field]: value })
  }

  const offerTypes = [
    { value: 'percentage', label: 'Sconto Percentuale', description: 'Sconto calcolato come percentuale del totale' },
    { value: 'fixed_amount', label: 'Sconto Fisso', description: 'Importo fisso di sconto in euro' },
    { value: 'buy_one_get_one', label: 'Prendi 2 Paghi 1', description: 'Offerta buy-one-get-one' },
    { value: 'happy_hour', label: 'Happy Hour', description: 'Sconto su bevande in fascia oraria' },
    { value: 'group_discount', label: 'Sconto Gruppo', description: 'Sconto per gruppi numerosi' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Informazioni Base dell'Offerta
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Iniziamo con le informazioni fondamentali della tua offerta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Titolo */}
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Titolo Offerta *
          </label>
          <input
            type="text"
            id="title"
            value={data.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Es. Happy Hour del Venerdì"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Descrizione */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descrizione *
          </label>
          <textarea
            id="description"
            value={data.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descrivi i dettagli della tua offerta..."
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Tipo di Offerta */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo di Offerta *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {offerTypes.map((type) => (
              <div
                key={type.value}
                onClick={() => handleChange('type', type.value)}
                className={`relative cursor-pointer rounded-lg border p-4 hover:bg-gray-50 transition-colors ${
                  data.type === type.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="offerType"
                    value={type.value}
                    checked={data.type === type.value}
                    onChange={() => handleChange('type', type.value)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <label className="block text-sm font-medium text-gray-900">
                      {type.label}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.type && (
            <p className="mt-2 text-sm text-red-600">{errors.type}</p>
          )}
        </div>
      </div>

      {/* Anteprima del tipo selezionato */}
      {data.type && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            💡 Tipo selezionato: {offerTypes.find(t => t.value === data.type)?.label}
          </h4>
          <p className="text-sm text-blue-700">
            {offerTypes.find(t => t.value === data.type)?.description}
          </p>
          
          {data.type === 'percentage' && (
            <p className="text-xs text-blue-600 mt-1">
              Configurazione: Potrai impostare la percentuale di sconto nel prossimo step.
            </p>
          )}
          {data.type === 'fixed_amount' && (
            <p className="text-xs text-blue-600 mt-1">
              Configurazione: Potrai impostare l'importo fisso di sconto nel prossimo step.
            </p>
          )}
          {data.type === 'buy_one_get_one' && (
            <p className="text-xs text-blue-600 mt-1">
              Configurazione: Potrai specificare i prodotti inclusi nell'offerta nel prossimo step.
            </p>
          )}
          {data.type === 'happy_hour' && (
            <p className="text-xs text-blue-600 mt-1">
              Configurazione: Potrai impostare gli orari e i giorni dell'happy hour nel prossimo step.
            </p>
          )}
          {data.type === 'group_discount' && (
            <p className="text-xs text-blue-600 mt-1">
              Configurazione: Potrai impostare il numero minimo di persone per il gruppo nel prossimo step.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default StepBasicInfo 