import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { nanoid } from 'nanoid'

// Modal context per gestione centralizzata
const ModalContext = createContext()

// Stati possibili per i modal
const MODAL_ACTIONS = {
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  UPDATE_MODAL: 'UPDATE_MODAL',
  CLOSE_ALL: 'CLOSE_ALL',
  SET_GLOBAL_CONFIG: 'SET_GLOBAL_CONFIG'
}

// Reducer per gestire lo stato dei modal
const modalReducer = (state, action) => {
  switch (action.type) {
    case MODAL_ACTIONS.OPEN_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.id]: {
            ...action.payload,
            isOpen: true,
            openedAt: Date.now()
          }
        }
      }
    
    case MODAL_ACTIONS.CLOSE_MODAL:
      const { [action.payload.id]: removed, ...remainingModals } = state.modals
      return {
        ...state,
        modals: remainingModals
      }
    
    case MODAL_ACTIONS.UPDATE_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.id]: {
            ...state.modals[action.payload.id],
            ...action.payload.updates
          }
        }
      }
    
    case MODAL_ACTIONS.CLOSE_ALL:
      return {
        ...state,
        modals: {}
      }
    
    case MODAL_ACTIONS.SET_GLOBAL_CONFIG:
      return {
        ...state,
        globalConfig: {
          ...state.globalConfig,
          ...action.payload
        }
      }
    
    default:
      return state
  }
}

// Stato iniziale
const initialState = {
  modals: {},
  globalConfig: {
    closeOnEscape: true,
    closeOnOverlayClick: true,
    maxOpenModals: 3,
    defaultSize: 'medium',
    animationDuration: 200
  }
}

// Provider del ModalContext
export const ModalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(modalReducer, initialState)

  // Apri un nuovo modal
  const openModal = useCallback((modalConfig) => {
    const id = modalConfig.id || nanoid()
    
    // Controlla il limite di modal aperti
    const openModalIds = Object.keys(state.modals)
    if (openModalIds.length >= state.globalConfig.maxOpenModals) {
      console.warn(`Limite di ${state.globalConfig.maxOpenModals} modal aperti raggiunto`)
      return null
    }

    const modal = {
      id,
      type: 'custom',
      size: state.globalConfig.defaultSize,
      closeOnEscape: state.globalConfig.closeOnEscape,
      closeOnOverlayClick: state.globalConfig.closeOnOverlayClick,
      zIndex: 1000 + openModalIds.length * 10,
      ...modalConfig
    }

    dispatch({
      type: MODAL_ACTIONS.OPEN_MODAL,
      payload: modal
    })

    return id
  }, [state.modals, state.globalConfig])

  // Chiudi un modal specifico
  const closeModal = useCallback((id) => {
    dispatch({
      type: MODAL_ACTIONS.CLOSE_MODAL,
      payload: { id }
    })
  }, [])

  // Aggiorna un modal esistente
  const updateModal = useCallback((id, updates) => {
    dispatch({
      type: MODAL_ACTIONS.UPDATE_MODAL,
      payload: { id, updates }
    })
  }, [])

  // Chiudi tutti i modal
  const closeAllModals = useCallback(() => {
    dispatch({
      type: MODAL_ACTIONS.CLOSE_ALL
    })
  }, [])

  // Configura impostazioni globali
  const setGlobalConfig = useCallback((config) => {
    dispatch({
      type: MODAL_ACTIONS.SET_GLOBAL_CONFIG,
      payload: config
    })
  }, [])

  // Modal preconfigurati
  const showConfirmModal = useCallback((options) => {
    return openModal({
      type: 'confirm',
      title: options.title || 'Conferma',
      message: options.message,
      confirmText: options.confirmText || 'Conferma',
      cancelText: options.cancelText || 'Annulla',
      variant: options.variant || 'danger',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      size: 'small'
    })
  }, [openModal])

  const showFormModal = useCallback((options) => {
    return openModal({
      type: 'form',
      title: options.title,
      content: options.content,
      submitText: options.submitText || 'Salva',
      cancelText: options.cancelText || 'Annulla',
      onSubmit: options.onSubmit,
      onCancel: options.onCancel,
      size: options.size || 'medium'
    })
  }, [openModal])

  const showBookingDetailsModal = useCallback((booking) => {
    return openModal({
      type: 'booking-details',
      title: `Prenotazione #${booking.confirmationCode}`,
      booking,
      size: 'large'
    })
  }, [openModal])

  // Modal per messaggi di successo
  const showSuccessModal = useCallback((message, options = {}) => {
    return openModal({
      type: 'success',
      title: options.title || 'Successo!',
      message,
      confirmText: options.confirmText || 'OK',
      variant: 'success',
      onConfirm: options.onConfirm,
      size: 'small',
      autoClose: options.autoClose || false,
      autoCloseDelay: options.autoCloseDelay || 3000
    })
  }, [openModal])

  // Modal per messaggi di errore
  const showErrorModal = useCallback((message, options = {}) => {
    return openModal({
      type: 'error',
      title: options.title || 'Errore',
      message,
      confirmText: options.confirmText || 'OK',
      variant: 'error',
      onConfirm: options.onConfirm,
      size: 'small'
    })
  }, [openModal])

  // Ottieni modal aperti ordinati per zIndex
  const getOpenModals = useCallback(() => {
    return Object.values(state.modals)
      .sort((a, b) => a.zIndex - b.zIndex)
  }, [state.modals])

  const contextValue = {
    // Stato
    modals: state.modals,
    globalConfig: state.globalConfig,
    
    // Azioni base
    openModal,
    closeModal,
    updateModal,
    closeAllModals,
    setGlobalConfig,
    
    // Modal preconfigurati
    showConfirmModal,
    showFormModal,
    showBookingDetailsModal,
    showSuccessModal,
    showErrorModal,
    
    // Utility
    getOpenModals,
    isModalOpen: (id) => Boolean(state.modals[id]),
    getModalCount: () => Object.keys(state.modals).length
  }

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  )
}

// Hook per usare il modal context
export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal deve essere usato all\'interno di un ModalProvider')
  }
  return context
}

export default ModalContext 