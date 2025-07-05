import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'

const AuthTest = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Inline styles as fallback for guaranteed rendering
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    padding: '2rem 1rem',
    fontFamily: 'Kanit, sans-serif'
  }

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '2rem'
  }

  const titleStyle = {
    fontFamily: 'Racing Sans One, cursive',
    fontSize: '2.5rem',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '1rem'
  }

  const cardStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 10px 40px rgba(249, 115, 22, 0.15)',
    border: '2px solid #f97316'
  }

  const welcomeStyle = {
    backgroundColor: '#f97316',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '0.75rem',
    textAlign: 'center',
    margin: '1rem 0',
    fontWeight: '600'
  }

  const infoStyle = {
    backgroundColor: '#fff7ed',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    border: '1px solid #fed7aa'
  }

  const buttonContainerStyle = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '2rem'
  }

  if (!user) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>SPOrTS - Auth Test</h1>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            Devi effettuare il login per accedere a questa pagina
          </p>
        </div>
        
        <div style={cardStyle}>
          <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Reindirizzamento alla pagina di login...
          </p>
          <div style={buttonContainerStyle}>
            <Button 
              variant="primary" 
              onClick={() => navigate('/login')}
              style={{
                padding: '0.75rem 2rem',
                fontSize: '1.1rem',
                backgroundColor: '#f97316',
                color: 'white'
              }}
            >
              Vai al Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>SPOrTS - Auth Test</h1>
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          height: '4px',
          width: '100px',
          margin: '0 auto',
          borderRadius: '2px'
        }}></div>
      </div>

      <div style={cardStyle}>
        <div style={welcomeStyle}>
          <div style={{
            fontSize: '1.5rem',
            fontFamily: 'Racing Sans One, cursive',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            🏆 SPOrTS
          </div>
          Dashboard
        </div>

        <div style={welcomeStyle}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Benvenuto, {user.name}!
          </h2>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            fontSize: '1rem',
            opacity: 0.9
          }}>
            Sei collegato come {user.role} nel sistema SPOrTS.
          </p>
        </div>

        <div style={infoStyle}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '1rem',
            color: '#f97316',
            fontWeight: '600'
          }}>
            Informazioni Utente:
          </h3>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div><strong>Nome:</strong> {user.name}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Ruolo:</strong> {user.role}</div>
            <div><strong>ID:</strong> {user.id}</div>
          </div>
        </div>

        <div style={buttonContainerStyle}>
          <Button 
            variant="primary" 
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem'
            }}
          >
            Vai alla Dashboard
          </Button>
          
          <Button 
            variant="outline" 
            onClick={logout}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem'
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AuthTest 