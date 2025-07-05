import React, { useState } from 'react'
import { Button, Card, Input, Modal, Loading } from '../components/ui'
import { useModal } from '../contexts/ModalContext'

const ComponentDemo = () => {
  const { showConfirmModal, showFormModal, showBookingDetailsModal, openModal } = useModal()
  const [showModal, setShowModal] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
    alert('Form submitted!')
  }

  // SPOrTS inline styles for guaranteed rendering
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

  const scoreStyle = {
    fontFamily: 'Racing Sans One, cursive',
    fontSize: '2rem',
    color: '#f97316',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
    animation: 'bounce 2s ease-in-out infinite'
  }

  return (
    <div style={containerStyle} className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div style={headerStyle} className="text-center mb-8">
          <h1 style={titleStyle} className="text-4xl font-display text-gradient-orange mb-4">
            SPOrTS Design System
          </h1>
          <p className="text-lg text-gray-600 font-body" style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            Componenti UI con colore arancione #F97316 e tipografia sportiva
          </p>
          <div className="mt-4">
            <span style={scoreStyle} className="score-display animate-ball-bounce">⚽ 3-1 🏀</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          
          {/* Buttons Section */}
          <Card style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(249, 115, 22, 0.1)' }}>
            <Card.Header>
              <Card.Title style={{ color: '#f97316', fontWeight: '600' }}>Buttons</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700" style={{ fontWeight: '500', color: '#374151' }}>Variants</h4>
                  <div className="flex flex-wrap gap-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700" style={{ fontWeight: '500', color: '#374151' }}>Sizes</h4>
                  <div className="flex flex-wrap gap-2 items-center" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <Button size="small">Small</Button>
                    <Button size="medium">Medium</Button>
                    <Button size="large">Large</Button>
                    <Button size="xl">Extra Large</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700" style={{ fontWeight: '500', color: '#374151' }}>States</h4>
                  <div className="flex flex-wrap gap-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <Button loading>Loading</Button>
                    <Button disabled>Disabled</Button>
                    <Button variant="danger">Danger</Button>
                    <Button variant="success">Success</Button>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Cards Section */}
          <Card style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(249, 115, 22, 0.1)' }}>
            <Card.Header>
              <Card.Title style={{ color: '#f97316', fontWeight: '600' }}>Cards</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Card variant="featured" padding="small" hover style={{ padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem' }}>
                  <h5 className="font-medium" style={{ fontWeight: '500', margin: '0 0 0.25rem 0' }}>Featured Card</h5>
                  <p className="text-sm text-gray-600 mt-1" style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>With hover effect</p>
                </Card>
                
                <Card variant="highlighted" padding="medium" style={{ padding: '1.25rem', backgroundColor: 'white', border: '2px solid #f97316', borderRadius: '0.5rem' }}>
                  <h5 className="font-medium" style={{ fontWeight: '500', margin: '0 0 0.25rem 0' }}>Highlighted Card</h5>
                  <p className="text-sm text-gray-600 mt-1" style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>With orange border</p>
                </Card>
                
                <Card variant="success" padding="small" style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem' }}>
                  <h5 className="font-medium" style={{ fontWeight: '500', margin: '0 0 0.25rem 0' }}>Success Card</h5>
                  <p className="text-sm text-gray-600 mt-1" style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Success state</p>
                </Card>
              </div>
            </Card.Content>
          </Card>

          {/* Inputs Section */}
          <Card>
            <Card.Header>
              <Card.Title>Inputs</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <Input 
                  label="Nome"
                  placeholder="Inserisci il tuo nome"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  required
                />
                
                <Input 
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  helperText="Inserisci un indirizzo email valido"
                />
                
                <Input 
                  label="Password"
                  type="password"
                  placeholder="********"
                  showPasswordToggle
                />
                
                <Input 
                  label="Campo con errore"
                  placeholder="Questo campo ha un errore"
                  error="Questo campo è obbligatorio"
                />
                
                <Input 
                  label="Campo disabilitato"
                  placeholder="Campo disabilitato"
                  disabled
                  value="Valore fisso"
                />
              </div>
            </Card.Content>
          </Card>

          {/* Loading Section */}
          <Card>
            <Card.Header>
              <Card.Title>Loading States</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Variants</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <Loading variant="spinner" size="medium" />
                      <p className="text-sm text-gray-500 mt-2">Spinner</p>
                    </div>
                    <div className="text-center">
                      <Loading variant="dots" size="medium" />
                      <p className="text-sm text-gray-500 mt-2">Dots</p>
                    </div>
                    <div className="text-center">
                      <Loading variant="pulse" size="medium" />
                      <p className="text-sm text-gray-500 mt-2">Pulse</p>
                    </div>
                    <div className="text-center">
                      <Loading variant="ring" size="medium" />
                      <p className="text-sm text-gray-500 mt-2">Ring</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">With Text</h4>
                  <Loading variant="spinner" text="Caricamento..." />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Skeleton</h4>
                  <Loading.CardSkeleton />
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Sports Theme Examples */}
          <Card 
            className="lg:col-span-2 bg-gradient-orange-soft" 
            style={{ 
              gridColumn: '1 / -1',
              background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
              borderRadius: '1rem',
              padding: '2rem',
              border: '2px solid #f97316'
            }}
          >
            <Card.Header>
              <Card.Title 
                className="font-display text-gradient-orange" 
                style={{ 
                  fontFamily: 'Racing Sans One, cursive',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: '1.5rem'
                }}
              >
                🏆 Stili Tema Sportivo
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}
              >
                <div className="text-center" style={{ textAlign: 'center' }}>
                  <div 
                    className="score-display mb-2" 
                    style={{
                      fontFamily: 'Racing Sans One, cursive',
                      fontSize: '2rem',
                      color: '#f97316',
                      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
                      marginBottom: '0.5rem'
                    }}
                  >
                    2-1
                  </div>
                  <p className="font-body text-sm text-gray-600" style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Score Display</p>
                </div>
                <div className="text-center" style={{ textAlign: 'center' }}>
                  <div 
                    className="animate-ball-bounce text-4xl mb-2" 
                    style={{
                      fontSize: '2.5rem',
                      marginBottom: '0.5rem',
                      animation: 'bounce 2s ease-in-out infinite'
                    }}
                  >
                    ⚽
                  </div>
                  <p className="font-body text-sm text-gray-600" style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Ball Animation</p>
                </div>
                <div className="text-center" style={{ textAlign: 'center' }}>
                  <div 
                    className="text-2xl font-display text-gradient-orange mb-2" 
                    style={{
                      fontSize: '1.5rem',
                      fontFamily: 'Racing Sans One, cursive',
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '0.5rem'
                    }}
                  >
                    SPOrTS
                  </div>
                  <p className="font-body text-sm text-gray-600" style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Gradient Text</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Interactive Demo */}
          <Card 
            variant="highlighted" 
            className="lg:col-span-2 glass-effect hover-lift"
            style={{ 
              gridColumn: '1 / -1',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '2px solid #f97316',
              borderRadius: '1rem',
              padding: '2rem'
            }}
          >
            <Card.Header>
              <Card.Title 
                className="font-heading" 
                style={{ fontFamily: 'Kanit, sans-serif', fontWeight: '600', color: '#f97316' }}
              >
                Demo Interattiva
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p className="text-gray-600 font-body" style={{ color: '#6b7280', margin: 0 }}>
                  Testa i componenti con interazioni reali:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {/* Modal Classico */}
                  <Button 
                    variant="primary"
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-orange hover-lift"
                  >
                    Modal Classico
                  </Button>
                  
                  {/* Confirm Modal */}
                  <Button 
                    variant="outline"
                    onClick={() => showConfirmModal({
                      title: 'Conferma Azione',
                      message: 'Sei sicuro di voler procedere con questa azione?',
                      variant: 'danger',
                      onConfirm: () => alert('Confermato!'),
                      onCancel: () => alert('Annullato!')
                    })}
                  >
                    Confirm Modal
                  </Button>
                  
                  {/* Form Modal */}
                  <Button 
                    variant="secondary"
                    onClick={() => showFormModal({
                      title: 'Form di Test',
                      content: (
                        <div className="space-y-4">
                          <Input label="Nome" name="name" placeholder="Inserisci nome" required />
                          <Input label="Email" name="email" type="email" placeholder="email@example.com" required />
                        </div>
                      ),
                      onSubmit: (data) => {
                        alert(`Form inviato: ${JSON.stringify(data)}`)
                      }
                    })}
                  >
                    Form Modal
                  </Button>
                  
                  {/* Booking Details Modal */}
                  <Button 
                    variant="success"
                    onClick={() => showBookingDetailsModal({
                      _id: 'demo-123',
                      confirmationCode: 'DEMO123',
                      customerName: 'Mario Rossi',
                      customerEmail: 'mario.rossi@email.com',
                      customerPhone: '+39 123 456 7890',
                      venue: { name: 'The Queen\'s Head', address: 'Via Roma 123, Milano' },
                      bookingDate: new Date().toISOString(),
                      date: new Date().toISOString(),
                      startTime: '18:30',
                      endTime: '20:30',
                      time: '18:30',
                      partySize: 4,
                      guests: 4,
                      status: 'confirmed',
                      specialRequests: 'Tavolo vicino alla finestra',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    })}
                  >
                    Booking Details
                  </Button>
                  
                  {/* Custom Modal */}
                  <Button 
                    variant="ghost"
                    onClick={() => openModal({
                      title: 'Modal Personalizzato',
                      size: 'large',
                      content: (
                        <div className="p-6 text-center">
                          <div className="text-6xl mb-4">🎉</div>
                          <h3 className="text-xl font-bold mb-2">Congratulazioni!</h3>
                          <p className="text-gray-600">Hai testato con successo il sistema modal!</p>
                        </div>
                      )
                    })}
                  >
                    Modal Custom
                  </Button>
                  
                  {/* Loading Test */}
                  <Button 
                    variant="outline"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    className="shadow-sports"
                  >
                    {loading ? 'Invio...' : 'Test Loading'}
                  </Button>
                </div>
                
                {loading && (
                  <div className="mt-4">
                    <Loading variant="progress" />
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

        </div>
        
        {/* Modal Demo */}
        <Modal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Demo Modal"
          size="medium"
        >
          <Modal.Body>
            <p className="text-gray-600 mb-4" style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Questo è un esempio di modal del design system SPOrTS.
            </p>
            <Input 
              label="Campo nel modal"
              placeholder="Scrivi qualcosa..."
            />
          </Modal.Body>
          
          <Modal.Footer>
            <Button 
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Annulla
            </Button>
            <Button 
              variant="primary"
              onClick={() => {
                setShowModal(false)
                alert('Confermato!')
              }}
            >
              Conferma
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}

export default ComponentDemo 