import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { FilterIcon, XIcon } from 'lucide-react'
import BookingStatusBadge from './BookingStatusBadge'
import type { BookingStatus } from '../types'

interface BookingStatusFilterProps {
  selectedStatuses: BookingStatus[]
  onStatusChange: (statuses: BookingStatus[]) => void
  showClearButton?: boolean
  className?: string
}

const BookingStatusFilter: React.FC<BookingStatusFilterProps> = ({
  selectedStatuses,
  onStatusChange,
  showClearButton = true,
  className = ''
}) => {
  const allStatuses: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']

  const handleStatusToggle = (status: BookingStatus) => {
    if (selectedStatuses.includes(status)) {
      // Remove status
      onStatusChange(selectedStatuses.filter(s => s !== status))
    } else {
      // Add status
      onStatusChange([...selectedStatuses, status])
    }
  }

  const handleClearAll = () => {
    onStatusChange([])
  }

  const handleSelectAll = () => {
    onStatusChange(allStatuses)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtra per stato</span>
        </div>
        
        {showClearButton && selectedStatuses.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            <XIcon className="h-3 w-3 mr-1" />
            Cancella
          </Button>
        )}
      </div>

      {/* Status Selection */}
      <div className="space-y-2">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            Tutti
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            Nessuno
          </Button>
        </div>

        {/* Status Checkboxes */}
        <div className="grid grid-cols-2 gap-2">
          {allStatuses.map((status) => {
            const isSelected = selectedStatuses.includes(status)
            
            return (
              <button
                key={status}
                onClick={() => handleStatusToggle(status)}
                className={`
                  flex items-center gap-2 p-2 rounded-lg border transition-all
                  ${isSelected 
                    ? 'border-orange-200 bg-orange-50' 
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                  }
                `}
              >
                <div className={`
                  w-4 h-4 rounded border-2 flex items-center justify-center
                  ${isSelected 
                    ? 'border-orange-500 bg-orange-500' 
                    : 'border-gray-300'
                  }
                `}>
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <BookingStatusBadge 
                  status={status} 
                  size="sm" 
                  showIcon={false}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Status Summary */}
      {selectedStatuses.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-1">
            {selectedStatuses.map((status) => (
              <BookingStatusBadge
                key={status}
                status={status}
                size="sm"
                showIcon={false}
                className="cursor-pointer hover:opacity-80"
                onClick={() => handleStatusToggle(status)}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {selectedStatuses.length} stato{selectedStatuses.length !== 1 ? 'i' : ''} selezionat{selectedStatuses.length !== 1 ? 'i' : 'o'}
          </p>
        </div>
      )}
    </div>
  )
}

export default BookingStatusFilter 