import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ClockIcon,
  CalendarIcon,
  TagIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import OfferWizard from '../../components/OfferWizard'
import { useModal } from '../../contexts/ModalContext'
import { useToast } from '../../hooks/use-toast'
import { offersService, statisticsService } from '../../services/venueService'
import { useAuth } from '../../contexts/AuthContext'

const OffersManagement = () => {
  const { user } = useAuth()
  const [offers, setOffers] = useState([])
  const [filteredOffers, setFilteredOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showWizard, setShowWizard] = useState(false)
  const [editingOffer, setEditingOffer] = useState(null)
  const [selectedOffers, setSelectedOffers] = useState([])
  const [error, setError] = useState(null)
  const [statistics, setStatistics] = useState(null)
  
  const { showConfirmModal, showSuccessModal, showErrorModal } = useModal()

  useEffect(() => {
    const initializeData = async () => {
      await loadOffers()
      await loadStatistics()
    }
    initializeData()
  }, [])

  const loadStatistics = async () => {
    if (user?.id) {
      try {
        const stats = await statisticsService.calculateStatistics(user.id)
      setStatistics(stats)
      } catch (error) {
        console.error('Errore caricamento statistiche:', error)
        // Imposta statistiche di fallback per evitare errori di rendering
        setStatistics({
          bookings: { total: 0, confirmed: 0, pending: 0, cancelled: 0 },
          views: 0
        })
      }
    }
  }

  useEffect(() => {
    filterAndSortOffers()
  }, [offers, searchTerm, statusFilter, typeFilter, sortBy, sortOrder])

  const loadOffers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!user?.id) {
        setError('Utente non autenticato')
        return
      }
      
      // Usa il servizio tenant-based
      const allOffers = offersService.getOffers(user.id)
      
      // Applica filtri localmente
      let filtered = allOffers
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(offer => offer.status === statusFilter)
      }
      
      if (searchTerm) {
        filtered = filtered.filter(offer => 
          offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offer.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      setOffers(filtered)
    } catch (error) {
      console.error('Errore nel caricamento delle offerte:', error)
      setError('Errore nel caricamento delle offerte: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortOffers = () => {
    let filtered = [...offers]

    if (searchTerm) {
      filtered = filtered.filter(offer =>
        offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(offer => offer.type === typeFilter)
    }

    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === 'createdAt' || sortBy === 'validFrom' || sortBy === 'validUntil') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredOffers(filtered)
  }

  const handleCreateOffer = () => {
    setEditingOffer(null)
    setShowWizard(true)
  }

  const handleEditOffer = (offer) => {
    setEditingOffer(offer)
    setShowWizard(true)
  }

  const handleDeleteOffer = (offer) => {
    showConfirmModal({
      title: 'Conferma eliminazione',
      message: `Sei sicuro di voler eliminare l'offerta "${offer.title}"? Questa azione non può essere annullata.`,
      onConfirm: async () => {
        try {
          offersService.deleteOffer(user.id, offer.id)
          showSuccessModal('Offerta eliminata con successo')
          loadOffers()
        } catch (error) {
          console.error('Error deleting offer:', error)
          showErrorModal('Errore nell\'eliminazione dell\'offerta')
        }
      }
    })
  }

  const handleStatusChange = async (offer, newStatus) => {
    try {
      const updatedOffer = { ...offer, status: newStatus }
      offersService.updateOffer(user.id, offer.id, updatedOffer)
      showSuccessModal(`Offerta ${newStatus === 'active' ? 'attivata' : 'disattivata'} con successo`)
      loadOffers()
    } catch (error) {
      console.error('Error updating offer status:', error)
      showErrorModal('Errore nell\'aggiornamento dello status')
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedOffers.length === 0) return

    const actionText = {
      activate: 'attivare',
      pause: 'mettere in pausa',
      delete: 'eliminare'
    }

    showConfirmModal({
      title: `Conferma azione multipla`,
      message: `Sei sicuro di voler ${actionText[action]} ${selectedOffers.length} offerte selezionate?`,
      onConfirm: async () => {
        try {
          for (const offerId of selectedOffers) {
            if (action === 'delete') {
              await offersService.deleteOffer(offerId)
            } else {
              const status = action === 'activate' ? 'active' : 'paused'
              await offersService.updateOfferStatus(offerId, status)
            }
          }
          showSuccessModal(`Azione completata su ${selectedOffers.length} offerte`)
          setSelectedOffers([])
          loadOffers()
        } catch (error) {
          console.error('Error in bulk action:', error)
          showErrorModal('Errore nell\'esecuzione dell\'azione multipla')
        }
      }
    })
  }

  const handleOfferCreated = async () => {
    showSuccessModal('Offerta creata con successo!')
    await loadOffers()
    await loadStatistics() // Ricarica anche le statistiche
    setShowWizard(false)
    setEditingOffer(null)
  }

  // Calcola conversion rate reale
  const calculateConversionRate = () => {
    if (!statistics) return '0.00%'
    
    const totalViews = statistics.views || 0
    const totalBookings = statistics.bookings.total || 0
    
    if (totalViews === 0) return '0.00%'
    
    const rate = (totalBookings / totalViews) * 100
    return `${rate.toFixed(2)}%`
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Bozza' },
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Attiva' },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Pausa' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Scaduta' }
    }
    const config = statusConfig[status] || statusConfig.draft
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getTypeLabel = (type) => {
    const typeLabels = {
      percentage: 'Percentuale',
      fixed_amount: 'Importo Fisso',
      buy_one_get_one: 'Prendi 2 Paghi 1',
      group_discount: 'Sconto Gruppo'
    }
    return typeLabels[type] || type
  }

  const isOfferExpired = (offer) => {
    return new Date(offer.validUntil) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Offerte</h1>
          <p className="mt-1 text-sm text-gray-500">
            Crea e gestisci le offerte del tuo locale
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreateOffer}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuova Offerta
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TagIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Totale Offerte</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{offers.length}</dd>
                </dl>
              </div>
            </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlayIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Offerte Attive</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{offers.filter(o => o.status === 'active').length}</dd>
                </dl>
              </div>
            </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Offerte Scadute</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{offers.filter(isOfferExpired).length}</dd>
                </dl>
              </div>
            </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                  <dd><p className="text-2xl font-semibold text-gray-900">{calculateConversionRate()}</p></dd>
                </dl>
              </div>
            </div>
        </div>
      </div>

      {showWizard && (
        <OfferWizard
          isOpen={showWizard}
          onClose={() => {
            setShowWizard(false)
            setEditingOffer(null)
          }}
          onOfferCreated={handleOfferCreated}
          editOffer={editingOffer}
        />
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cerca offerte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          >
            <option value="all">Tutti gli stati</option>
            <option value="draft">Bozza</option>
            <option value="active">Attiva</option>
            <option value="paused">In Pausa</option>
            <option value="expired">Scaduta</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          >
            <option value="all">Tutti i tipi</option>
            <option value="percentage">Percentuale</option>
            <option value="fixed_amount">Importo Fisso</option>
            <option value="buy_one_get_one">2x1</option>
            <option value="group_discount">Sconto Gruppo</option>
          </select>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div>
              {selectedOffers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{selectedOffers.length} selezionate</span>
                  <button onClick={() => handleBulkAction('activate')} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200">Attiva</button>
                  <button onClick={() => handleBulkAction('pause')} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded hover:bg-yellow-200">Pausa</button>
                  <button onClick={() => handleBulkAction('delete')} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200">Elimina</button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Ordina per:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border-gray-300 rounded-md"
              >
                <option value="createdAt">Data Creazione</option>
                <option value="title">Titolo</option>
              </select>
              <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="text-sm p-1 border rounded-md hover:bg-gray-100">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {filteredOffers.map((offer) => (
            <li key={offer._id}>
              <div className="flex items-center px-4 py-4 sm:px-6">
                <div className="min-w-0 flex-1 flex items-center">
                  <div className="flex-shrink-0">
                    <input type="checkbox" className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                           checked={selectedOffers.includes(offer._id)}
                           onChange={(e) => {
                             const checked = e.target.checked
                             setSelectedOffers(prev => {
                               if (checked) {
                                 return [...prev, offer._id]
                               } else {
                                 return prev.filter(id => id !== offer._id)
                               }
                             })
                           }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-3 md:gap-4">
                    <div>
                      <p className="text-sm font-medium text-orange-600 truncate">{offer.title}</p>
                      <p className="mt-2 flex items-center text-sm text-gray-500">
                        <TagIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        <span className="truncate">{getTypeLabel(offer.type)}</span>
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm text-gray-900">{getStatusBadge(offer.status)}</p>
                      <p className="mt-2 flex items-center text-sm text-gray-500">
                        <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        <span>Scade il {new Date(offer.validUntil).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button title="Visualizza" className="p-1 text-gray-400 hover:text-gray-700"><EyeIcon className="h-5 w-5"/></button>
                  <button onClick={() => handleEditOffer(offer)} title="Modifica" className="p-1 text-gray-400 hover:text-gray-700"><PencilIcon className="h-5 w-5"/></button>
                  <button onClick={() => handleDeleteOffer(offer)} title="Elimina" className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="h-5 w-5"/></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default OffersManagement 