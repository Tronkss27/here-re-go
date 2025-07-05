import React, { useState, useEffect, useRef } from 'react'
import { lazyLoadManager } from '@/utils/performance'

/**
 * Optimized Image component with lazy loading, responsive images, and performance optimizations
 */
const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  width,
  height,
  sizes = '100vw',
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  style = {},
  ...props
}) => {
  const [imageState, setImageState] = useState('loading')
  const [currentSrc, setCurrentSrc] = useState('')
  const imgRef = useRef(null)
  const placeholderRef = useRef(null)

  // Generate responsive image sources
  const generateSrcSet = (baseSrc) => {
    const sizes = [320, 640, 768, 1024, 1280, 1920]
    return sizes.map(size => {
      const optimizedSrc = `${baseSrc}?w=${size}&q=${quality}&auto=format`
      return `${optimizedSrc} ${size}w`
    }).join(', ')
  }

  // Handle image loading
  const handleImageLoad = (event) => {
    setImageState('loaded')
    if (onLoad) onLoad(event)
    
    // Fade in effect
    if (imgRef.current) {
      imgRef.current.style.opacity = '1'
    }
    
    // Hide placeholder
    if (placeholderRef.current) {
      placeholderRef.current.style.opacity = '0'
    }
  }

  // Handle image error
  const handleImageError = (event) => {
    setImageState('error')
    if (onError) onError(event)
    
    // Show fallback
    if (imgRef.current) {
      imgRef.current.src = '/placeholder.svg'
    }
  }

  // Setup lazy loading
  useEffect(() => {
    if (!priority && imgRef.current) {
      // Use intersection observer for lazy loading
      lazyLoadManager.observe(imgRef.current)
      
      return () => {
        if (imgRef.current) {
          lazyLoadManager.unobserve(imgRef.current)
        }
      }
    }
  }, [priority])

  // Set image source
  useEffect(() => {
    if (priority) {
      // Load immediately for priority images
      setCurrentSrc(src)
    } else {
      // Set data-src for lazy loading
      if (imgRef.current) {
        imgRef.current.dataset.src = src
      }
    }
  }, [src, priority])

  // Placeholder component
  const Placeholder = () => {
    if (placeholder === 'blur' && blurDataURL) {
      return (
        <div
          ref={placeholderRef}
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
            transform: 'scale(1.1)', // Prevent blur edge artifacts
          }}
        />
      )
    }

    if (placeholder === 'skeleton') {
      return (
        <div
          ref={placeholderRef}
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"
        />
      )
    }

    if (placeholder === 'color') {
      return (
        <div
          ref={placeholderRef}
          className="absolute inset-0 bg-gray-200"
        />
      )
    }

    return null
  }

  // Error fallback component
  const ErrorFallback = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm">Immagine non disponibile</p>
      </div>
    </div>
  )

  // Container styles
  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    ...style
  }

  // Image styles
  const imageStyle = {
    transition: 'opacity 0.3s ease-in-out',
    opacity: imageState === 'loaded' ? 1 : 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }

  return (
    <div
      className={`relative ${className}`}
      style={containerStyle}
    >
      {/* Placeholder */}
      {imageState === 'loading' && <Placeholder />}
      
      {/* Error fallback */}
      {imageState === 'error' && <ErrorFallback />}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={priority ? currentSrc : undefined}
        srcSet={priority ? generateSrcSet(src) : undefined}
        data-src={!priority ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        style={imageStyle}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
    </div>
  )
}

/**
 * Optimized Image Gallery component
 */
export const ImageGallery = ({ images, className = '', onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main image */}
      <OptimizedImage
        src={images[currentIndex]?.src || images[currentIndex]}
        alt={images[currentIndex]?.alt || `Image ${currentIndex + 1}`}
        className="w-full aspect-video"
        priority={currentIndex === 0}
        quality={85}
        placeholder="blur"
        onClick={() => onImageClick?.(currentIndex)}
      />

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Optimized Avatar component
 */
export const OptimizedAvatar = ({ 
  src, 
  alt, 
  size = 'md', 
  className = '',
  fallback 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const [hasError, setHasError] = useState(false)

  if (hasError || !src) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-medium`}>
        {fallback || alt?.charAt(0)?.toUpperCase() || '?'}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} ${className} rounded-full`}
      priority={true}
      quality={90}
      placeholder="color"
      onError={() => setHasError(true)}
    />
  )
}

export default OptimizedImage 