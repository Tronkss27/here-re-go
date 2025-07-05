import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

const ValidationFeedback = ({ 
  validation, 
  showOnSuccess = false, 
  className = "" 
}) => {
  if (!validation) return null

  const { isValid, errors = [], warnings = [], severity } = validation

  // Don't show anything if valid and showOnSuccess is false
  if (isValid && warnings.length === 0 && !showOnSuccess) {
    return null
  }

  const getSeverityConfig = () => {
    switch (severity) {
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          icon: XCircleIcon,
          iconColor: 'text-red-400'
        }
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          icon: ExclamationTriangleIcon,
          iconColor: 'text-yellow-400'
        }
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          icon: CheckCircleIcon,
          iconColor: 'text-green-400'
        }
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          icon: ExclamationTriangleIcon,
          iconColor: 'text-gray-400'
        }
    }
  }

  const config = getSeverityConfig()
  const Icon = config.icon

  return (
    <div className={`rounded-md ${config.bgColor} ${config.borderColor} border p-4 ${className}`}>
      <div className="flex">
        <Icon className={`h-5 w-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
        <div className="ml-3 flex-1">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-2">
              <h4 className={`text-sm font-medium ${config.textColor}`}>
                {errors.length === 1 ? 'Errore:' : 'Errori:'}
              </h4>
              <ul className={`mt-1 text-sm ${config.textColor} list-disc list-inside space-y-1`}>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className={errors.length > 0 ? 'mt-3' : ''}>
              <h4 className={`text-sm font-medium ${config.textColor}`}>
                {warnings.length === 1 ? 'Avviso:' : 'Avvisi:'}
              </h4>
              <ul className={`mt-1 text-sm ${config.textColor} list-disc list-inside space-y-1`}>
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success message */}
          {isValid && warnings.length === 0 && showOnSuccess && (
            <p className={`text-sm ${config.textColor}`}>
              Tutti i campi sono validi
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ValidationFeedback 