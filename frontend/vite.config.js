import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for better development experience
      fastRefresh: true,
      // Optimize bundle size by removing unnecessary React dev tools in production
      babel: {
        plugins: process.env.NODE_ENV === 'production' ? [
          ['babel-plugin-react-remove-properties', { 'properties': ['data-testid'] }]
        ] : []
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    // Target modern browsers for smaller bundle size
    target: 'esnext',
    // Optimize bundle size
    minify: 'terser',
    sourcemap: false, // Disable sourcemaps in production for smaller build
    // Configure chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-slot', '@radix-ui/react-label', 'lucide-react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils-vendor': ['clsx', 'class-variance-authority', 'tailwind-merge', 'date-fns'],
        },
        // Optimize chunk filenames for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? 
            chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.tsx', '') : 'chunk'
          return `js/${facadeModuleId}-[hash].js`
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        }
      }
    },
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: true,
        drop_debugger: true,
        // Dead code elimination
        dead_code: true,
        // Remove unused function parameters
        unused: true
      },
      mangle: {
        // Mangle variable names for smaller size
        toplevel: true
      }
    },
    // Warn on large chunks
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster development
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ],
    exclude: []
  },
  // Enable CSS optimizations
  css: {
    devSourcemap: false, // Disable CSS sourcemaps in development for faster builds
    preprocessorOptions: {
      // Optimize CSS processing
    }
  },
  // Define environment variables for optimizations
  define: {
    // Remove debugging code in production
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    // Enable performance monitoring
    __PERFORMANCE_MONITORING__: JSON.stringify(process.env.NODE_ENV === 'production')
  },
  // Enable esbuild optimizations
  esbuild: {
    // Remove comments in production
    legalComments: 'none',
    // Optimize for speed and size
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  }
})
