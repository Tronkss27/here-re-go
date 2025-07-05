// Performance monitoring utilities for SPOrTS/BarMatch application

/**
 * Web Vitals tracking
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.isProduction = import.meta.env.PROD
    this.initializeWebVitals()
  }

  /**
   * Initialize Web Vitals tracking
   */
  initializeWebVitals() {
    if (!this.isProduction) return

    // Track Largest Contentful Paint (LCP)
    this.observeLCP()
    
    // Track First Input Delay (FID)
    this.observeFID()
    
    // Track Cumulative Layout Shift (CLS)
    this.observeCLS()
    
    // Track Time to First Byte (TTFB)
    this.observeTTFB()
  }

  /**
   * Observe Largest Contentful Paint
   */
  observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        
        this.recordMetric('LCP', {
          value: lastEntry.startTime,
          element: lastEntry.element?.tagName,
          url: lastEntry.url,
          timestamp: Date.now()
        })
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (error) {
      console.warn('LCP observation not supported:', error)
    }
  }

  /**
   * Observe First Input Delay
   */
  observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.recordMetric('FID', {
            value: entry.processingStart - entry.startTime,
            eventType: entry.name,
            timestamp: Date.now()
          })
        })
      })
      
      observer.observe({ entryTypes: ['first-input'] })
    } catch (error) {
      console.warn('FID observation not supported:', error)
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  observeCLS() {
    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        
        this.recordMetric('CLS', {
          value: clsValue,
          timestamp: Date.now()
        })
      })
      
      observer.observe({ entryTypes: ['layout-shift'] })
    } catch (error) {
      console.warn('CLS observation not supported:', error)
    }
  }

  /**
   * Observe Time to First Byte
   */
  observeTTFB() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0]
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart
        
        this.recordMetric('TTFB', {
          value: ttfb,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.warn('TTFB measurement failed:', error)
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, data) {
    this.metrics.set(name, data)
    
    if (this.isProduction) {
      // Send to analytics service
      this.sendToAnalytics(name, data)
    } else {
      console.log(`[Performance] ${name}:`, data)
    }
  }

  /**
   * Send metrics to analytics service
   */
  async sendToAnalytics(metricName, data) {
    try {
      // This would be replaced with actual analytics service
      // For now, we'll use a placeholder
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: metricName,
          value: Math.round(data.value),
          custom_map: {
            metric_name: metricName,
            ...data
          }
        })
      }
    } catch (error) {
      console.warn('Failed to send analytics:', error)
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  /**
   * Track route changes for performance monitoring
   */
  trackRouteChange(routeName, startTime = performance.now()) {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    this.recordMetric('RouteChange', {
      routeName,
      duration,
      timestamp: Date.now()
    })
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName, renderTime) {
    this.recordMetric('ComponentRender', {
      componentName,
      renderTime,
      timestamp: Date.now()
    })
  }
}

/**
 * Lazy loading utilities
 */
export class LazyLoadManager {
  constructor() {
    this.intersectionObserver = this.createIntersectionObserver()
    this.loadedElements = new Set()
  }

  /**
   * Create intersection observer for lazy loading
   */
  createIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      return null
    }

    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadElement(entry.target)
            this.intersectionObserver?.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    )
  }

  /**
   * Load element when it becomes visible
   */
  loadElement(element) {
    if (this.loadedElements.has(element)) return

    // Load images
    if (element.tagName === 'IMG' && element.dataset.src) {
      element.src = element.dataset.src
      element.classList.remove('lazy')
      element.classList.add('loaded')
    }

    // Load other content
    if (element.dataset.content) {
      element.innerHTML = element.dataset.content
    }

    this.loadedElements.add(element)
  }

  /**
   * Observe element for lazy loading
   */
  observe(element) {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element)
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadElement(element)
    }
  }

  /**
   * Stop observing element
   */
  unobserve(element) {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element)
    }
  }
}

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  /**
   * Generate responsive image sources
   */
  static generateResponsiveSrc(baseUrl, sizes = [320, 640, 1024, 1920]) {
    return sizes.map(size => ({
      size,
      url: `${baseUrl}?w=${size}&q=75&fm=webp`,
      webp: `${baseUrl}?w=${size}&q=75&fm=webp`,
      fallback: `${baseUrl}?w=${size}&q=80&fm=jpg`
    }))
  }

  /**
   * Get optimal image format based on browser support
   */
  static getOptimalFormat() {
    // Check WebP support
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp')
    
    // Check AVIF support (newer format)
    const avifSupport = new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
    })

    return {
      webp: webpSupport,
      avif: avifSupport
    }
  }

  /**
   * Preload critical images
   */
  static preloadCriticalImages(imageUrls) {
    imageUrls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
    })
  }
}

/**
 * Bundle size analyzer
 */
export class BundleAnalyzer {
  /**
   * Analyze current bundle size and report metrics
   */
  static async analyzeBundleSize() {
    if (!import.meta.env.PROD) return

    try {
      const navigation = performance.getEntriesByType('navigation')[0]
      const resources = performance.getEntriesByType('resource')
      
      const jsSize = resources
        .filter(r => r.name.includes('.js'))
        .reduce((total, r) => total + (r.transferSize || 0), 0)
      
      const cssSize = resources
        .filter(r => r.name.includes('.css'))
        .reduce((total, r) => total + (r.transferSize || 0), 0)
      
      const imageSize = resources
        .filter(r => /\.(jpg|jpeg|png|webp|svg|gif)/.test(r.name))
        .reduce((total, r) => total + (r.transferSize || 0), 0)

      return {
        total: navigation.transferSize || 0,
        javascript: jsSize,
        css: cssSize,
        images: imageSize,
        loadTime: navigation.loadEventEnd - navigation.navigationStart
      }
    } catch (error) {
      console.warn('Bundle analysis failed:', error)
      return null
    }
  }
}

// Create singleton instances
export const performanceMonitor = new PerformanceMonitor()
export const lazyLoadManager = new LazyLoadManager()

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Track initial page load
  window.addEventListener('load', () => {
    performanceMonitor.recordMetric('PageLoad', {
      value: performance.now(),
      timestamp: Date.now()
    })
  })

  // Track route changes in React Router
  let lastUrl = location.href
  new MutationObserver(() => {
    const url = location.href
    if (url !== lastUrl) {
      performanceMonitor.trackRouteChange(url)
      lastUrl = url
    }
  }).observe(document, { subtree: true, childList: true })
} 