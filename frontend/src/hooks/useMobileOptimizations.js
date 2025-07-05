import { useState, useEffect, useCallback, useRef } from 'react'
import { performanceMonitor } from '@/utils/performance'

/**
 * Hook for mobile-specific optimizations
 */
export const useMobileOptimizations = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [orientation, setOrientation] = useState('portrait')
  const [connectionType, setConnectionType] = useState('unknown')
  const [isLowEndDevice, setIsLowEndDevice] = useState(false)
  
  // Track touch events for gesture optimization
  const touchStartRef = useRef(null)
  const lastTapRef = useRef(0)

  // Detect device type based on viewport and user agent
  const detectDeviceType = useCallback(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const userAgent = navigator.userAgent.toLowerCase()
    
    setViewportWidth(width)
    setViewportHeight(height)
    
    // Mobile detection
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isMobileViewport = width <= 768
    setIsMobile(isMobileUA || isMobileViewport)
    
    // Tablet detection
    const isTabletUA = /ipad|android.*tablet|kindle|silk/i.test(userAgent)
    const isTabletViewport = width > 768 && width <= 1024
    setIsTablet(isTabletUA || isTabletViewport)
    
    // Orientation detection
    setOrientation(width > height ? 'landscape' : 'portrait')
    
    // Performance monitoring
    performanceMonitor.recordMetric('DeviceDetection', {
      width,
      height,
      isMobile: isMobileUA || isMobileViewport,
      isTablet: isTabletUA || isTabletViewport,
      orientation: width > height ? 'landscape' : 'portrait',
      timestamp: Date.now()
    })
  }, [])

  // Detect connection type for adaptive loading
  const detectConnectionType = useCallback(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown')
        
        // Detect low-end device based on connection and hardware
        const isSlowConnection = ['slow-2g', '2g'].includes(connection.effectiveType)
        const hasLimitedRAM = navigator.deviceMemory && navigator.deviceMemory <= 2
        setIsLowEndDevice(isSlowConnection || hasLimitedRAM)
        
        performanceMonitor.recordMetric('ConnectionDetection', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          timestamp: Date.now()
        })
      }
    }
  }, [])

  // Handle viewport changes
  useEffect(() => {
    detectDeviceType()
    detectConnectionType()
    
    const handleResize = () => {
      detectDeviceType()
    }
    
    const handleConnectionChange = () => {
      detectConnectionType()
    }
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    if ('connection' in navigator) {
      navigator.connection?.addEventListener('change', handleConnectionChange)
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      navigator.connection?.removeEventListener('change', handleConnectionChange)
    }
  }, [detectDeviceType, detectConnectionType])

  // Touch gesture optimization
  const optimizeTouch = useCallback((element) => {
    if (!element || !isMobile) return
    
    const handleTouchStart = (e) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      }
    }
    
    const handleTouchEnd = (e) => {
      if (!touchStartRef.current) return
      
      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        time: Date.now()
      }
      
      const deltaX = touchEnd.x - touchStartRef.current.x
      const deltaY = touchEnd.y - touchStartRef.current.y
      const deltaTime = touchEnd.time - touchStartRef.current.time
      
      // Detect double tap
      const now = Date.now()
      if (now - lastTapRef.current < 300) {
        // Double tap detected
        performanceMonitor.recordMetric('DoubleTap', {
          timestamp: now
        })
      }
      lastTapRef.current = now
      
      // Detect swipe
      if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
        const direction = Math.abs(deltaX) > Math.abs(deltaY) 
          ? (deltaX > 0 ? 'right' : 'left')
          : (deltaY > 0 ? 'down' : 'up')
        
        performanceMonitor.recordMetric('SwipeGesture', {
          direction,
          distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
          duration: deltaTime,
          timestamp: now
        })
      }
      
      touchStartRef.current = null
    }
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile])

  // Adaptive image quality based on device capabilities
  const getOptimalImageQuality = useCallback(() => {
    if (isLowEndDevice || connectionType === '2g' || connectionType === 'slow-2g') {
      return 60 // Lower quality for slow connections/devices
    }
    if (connectionType === '3g') {
      return 75 // Medium quality for 3G
    }
    return 85 // High quality for fast connections
  }, [isLowEndDevice, connectionType])

  // Adaptive bundle loading strategy
  const shouldPreloadComponents = useCallback(() => {
    return !isLowEndDevice && connectionType !== '2g' && connectionType !== 'slow-2g'
  }, [isLowEndDevice, connectionType])

  // Viewport-specific CSS classes
  const getViewportClasses = useCallback(() => {
    const classes = []
    
    if (isMobile) classes.push('is-mobile')
    if (isTablet) classes.push('is-tablet')
    if (orientation === 'landscape') classes.push('is-landscape')
    if (orientation === 'portrait') classes.push('is-portrait')
    if (isLowEndDevice) classes.push('is-low-end')
    
    return classes.join(' ')
  }, [isMobile, isTablet, orientation, isLowEndDevice])

  // Optimized scroll handler factory
  const createOptimizedScrollHandler = useCallback((callback) => {
    let timeoutRef = null
    
    return (event) => {
      if (timeoutRef) {
        cancelAnimationFrame(timeoutRef)
      }
      
      timeoutRef = requestAnimationFrame(() => {
        callback(event)
      })
    }
  }, [])

  // Memory management for mobile
  const cleanupMemory = useCallback(() => {
    // Force garbage collection if available (Chrome DevTools)
    if (window.gc && typeof window.gc === 'function') {
      window.gc()
    }
    
    // Clear performance entries to free memory
    if (performance.clearResourceTimings) {
      performance.clearResourceTimings()
    }
    
    performanceMonitor.recordMetric('MemoryCleanup', {
      timestamp: Date.now()
    })
  }, [])

  // Adaptive animation settings
  const getAnimationPreference = useCallback(() => {
    // Respect user's motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion || isLowEndDevice) {
      return 'reduced'
    }
    
    return 'full'
  }, [isLowEndDevice])

  return {
    // Device info
    isMobile,
    isTablet,
    viewportWidth,
    viewportHeight,
    orientation,
    connectionType,
    isLowEndDevice,
    
    // Optimization functions
    optimizeTouch,
    getOptimalImageQuality,
    shouldPreloadComponents,
    getViewportClasses,
    createOptimizedScrollHandler,
    cleanupMemory,
    getAnimationPreference,
    
    // Utilities
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isSlowConnection: ['2g', 'slow-2g'].includes(connectionType),
    isFastConnection: ['4g', '5g'].includes(connectionType)
  }
}

/**
 * Hook for touch gesture handling
 */
export const useTouchGestures = (elementRef, options = {}) => {
  const {
    onSwipe,
    onTap,
    onDoubleTap,
    onPinch,
    swipeThreshold = 50,
    tapThreshold = 300
  } = options

  const touchStartRef = useRef(null)
  const lastTapRef = useRef(0)
  const pinchStartRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        // Single touch
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        }
      } else if (e.touches.length === 2) {
        // Pinch start
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        
        pinchStartRef.current = {
          distance,
          centerX: (touch1.clientX + touch2.clientX) / 2,
          centerY: (touch1.clientY + touch2.clientY) / 2
        }
      }
    }

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && pinchStartRef.current && onPinch) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        
        const scale = distance / pinchStartRef.current.distance
        const centerX = (touch1.clientX + touch2.clientX) / 2
        const centerY = (touch1.clientY + touch2.clientY) / 2
        
        onPinch({
          scale,
          centerX,
          centerY,
          originalDistance: pinchStartRef.current.distance,
          currentDistance: distance
        })
      }
    }

    const handleTouchEnd = (e) => {
      if (e.touches.length === 0) {
        // All touches ended
        if (touchStartRef.current) {
          const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
            time: Date.now()
          }
          
          const deltaX = touchEnd.x - touchStartRef.current.x
          const deltaY = touchEnd.y - touchStartRef.current.y
          const deltaTime = touchEnd.time - touchStartRef.current.time
          
          // Check for tap
          if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < tapThreshold) {
            const now = Date.now()
            
            if (now - lastTapRef.current < 300 && onDoubleTap) {
              onDoubleTap({ x: touchEnd.x, y: touchEnd.y })
            } else if (onTap) {
              onTap({ x: touchEnd.x, y: touchEnd.y })
            }
            
            lastTapRef.current = now
          }
          // Check for swipe
          else if ((Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) && onSwipe) {
            const direction = Math.abs(deltaX) > Math.abs(deltaY) 
              ? (deltaX > 0 ? 'right' : 'left')
              : (deltaY > 0 ? 'down' : 'up')
            
            onSwipe({
              direction,
              distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
              deltaX,
              deltaY,
              duration: deltaTime
            })
          }
          
          touchStartRef.current = null
        }
        
        pinchStartRef.current = null
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipe, onTap, onDoubleTap, onPinch, swipeThreshold, tapThreshold])
}

/**
 * Hook for viewport-based responsive behavior
 */
export const useResponsiveValue = (values) => {
  const { isMobile, isTablet, viewportWidth } = useMobileOptimizations()
  
  if (typeof values === 'object' && values !== null) {
    if (isMobile && 'mobile' in values) return values.mobile
    if (isTablet && 'tablet' in values) return values.tablet
    if ('desktop' in values) return values.desktop
    
    // Fallback to breakpoint-based selection
    if (viewportWidth <= 768 && 'sm' in values) return values.sm
    if (viewportWidth <= 1024 && 'md' in values) return values.md
    if ('lg' in values) return values.lg
  }
  
  return values
}

export default useMobileOptimizations 