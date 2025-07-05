import React from 'react'

// Design System Loading Component
const Loading = ({ 
  variant = 'spinner', 
  size = 'medium',
  color = 'orange',
  text,
  overlay = false,
  className = '',
  ...props 
}) => {
  // Size styles
  const sizes = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xl: 'h-16 w-16'
  }
  
  // Color styles
  const colors = {
    orange: 'text-orange-500',
    gray: 'text-gray-500',
    white: 'text-white',
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500'
  }
  
  // Text size based on loading size
  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xl: 'text-xl'
  }
  
  const colorClass = colors[color]
  const sizeClass = sizes[size]
  const textSizeClass = textSizes[size]
  
  // Spinner variant
  const SpinnerLoader = () => (
    <svg 
      className={`animate-spin ${sizeClass} ${colorClass}`}
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
  )
  
  // Pulse variant
  const PulseLoader = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClass} ${colorClass.replace('text-', 'bg-')} rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
  
  // Dots variant
  const DotsLoader = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClass} ${colorClass.replace('text-', 'bg-')} rounded-full animate-bounce`}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  )
  
  // Progress bar variant
  const ProgressLoader = () => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 ${colorClass.replace('text-', 'bg-')} rounded-full animate-pulse`}
        style={{
          width: '45%',
          animation: 'progress 2s ease-in-out infinite'
        }}
      />
      <style jsx>{`
        @keyframes progress {
          0% { width: 0% }
          50% { width: 45% }
          100% { width: 0% }
        }
      `}</style>
    </div>
  )
  
  // Ring variant
  const RingLoader = () => (
    <div className={`${sizeClass} relative`}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`absolute inset-0 rounded-full border-2 ${colorClass.replace('text-', 'border-')} opacity-25 animate-ping`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.5s'
          }}
        />
      ))}
    </div>
  )
  
  // Get loading component based on variant
  const getLoadingComponent = () => {
    switch (variant) {
      case 'pulse':
        return <PulseLoader />
      case 'dots':
        return <DotsLoader />
      case 'progress':
        return <ProgressLoader />
      case 'ring':
        return <RingLoader />
      case 'spinner':
      default:
        return <SpinnerLoader />
    }
  }
  
  // Container styles
  const containerClassName = `
    flex flex-col items-center justify-center space-y-2
    ${overlay ? 'fixed inset-0 bg-white bg-opacity-90 z-50' : ''}
    ${className}
  `.trim()
  
  return (
    <div className={containerClassName} {...props}>
      {getLoadingComponent()}
      {text && (
        <p className={`${textSizeClass} ${colorClass} font-medium animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  )
}

// Skeleton loader for content placeholders
const Skeleton = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '', 
  ...props 
}) => {
  return (
    <div 
      className={`${width} ${height} bg-gray-200 rounded animate-pulse ${className}`}
      {...props}
    />
  )
}

// Card skeleton
const CardSkeleton = ({ className = '', ...props }) => {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${className}`} {...props}>
      <div className="space-y-3">
        <Skeleton height="h-6" width="w-3/4" />
        <Skeleton height="h-4" width="w-full" />
        <Skeleton height="h-4" width="w-2/3" />
        <div className="flex space-x-2 mt-4">
          <Skeleton height="h-8" width="w-20" />
          <Skeleton height="h-8" width="w-20" />
        </div>
      </div>
    </div>
  )
}

// Page loader for route transitions
const PageLoader = ({ message = "Caricamento..." }) => {
  return (
    <Loading 
      variant="spinner" 
      size="large" 
      text={message} 
      overlay 
      className="bg-gradient-to-br from-orange-50 to-amber-50"
    />
  )
}

// Export compound component
Loading.Skeleton = Skeleton
Loading.CardSkeleton = CardSkeleton
Loading.PageLoader = PageLoader

export default Loading
export { Loading, Skeleton, CardSkeleton, PageLoader } 