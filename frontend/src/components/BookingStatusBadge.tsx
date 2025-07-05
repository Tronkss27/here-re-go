import React from 'react'
import { Badge } from './ui/badge'
import { CheckCircleIcon, ClockIcon, XCircleIcon, CalendarCheckIcon, UserXIcon } from 'lucide-react'
import type { BookingStatus } from '../types'

interface BookingStatusBadgeProps {
  status: BookingStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'In Attesa',
          variant: 'secondary' as const,
          icon: ClockIcon,
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        }
      case 'confirmed':
        return {
          label: 'Confermata',
          variant: 'default' as const,
          icon: CheckCircleIcon,
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'cancelled':
        return {
          label: 'Cancellata',
          variant: 'destructive' as const,
          icon: XCircleIcon,
          className: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'completed':
        return {
          label: 'Completata',
          variant: 'outline' as const,
          icon: CalendarCheckIcon,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        }
      case 'no_show':
        return {
          label: 'Non Presentato',
          variant: 'secondary' as const,
          icon: UserXIcon,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
      default:
        return {
          label: 'Sconosciuto',
          variant: 'outline' as const,
          icon: ClockIcon,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <Badge
      variant={config.variant}
      className={`
        ${config.className}
        ${sizeClasses[size]}
        ${className}
        inline-flex items-center gap-1.5 font-medium
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  )
}

export default BookingStatusBadge 