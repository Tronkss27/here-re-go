import React from 'react'
import { Link } from 'react-router-dom'

const AuthContainer = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center mb-6">
              <div className="text-4xl font-bold text-orange-600">🏆</div>
              <h1 className="text-3xl font-bold text-orange-600 ml-2">SPOrTS</h1>
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center">
          <Link 
            to="/" 
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Torna alla homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AuthContainer 