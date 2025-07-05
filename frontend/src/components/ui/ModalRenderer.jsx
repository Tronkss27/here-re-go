import React from 'react'
import { useModal } from '../../contexts/ModalContext'
import Modal from './Modal'
import ConfirmModal from './ConfirmModal'
import FormModal from './FormModal'
import BookingDetailsModal from './BookingDetailsModal'

/**
 * ModalRenderer - Componente che renderizza tutti i modal aperti
 * Utilizza il ModalContext per ottenere la lista dei modal da renderizzare
 */
const ModalRenderer = () => {
  const { getOpenModals, closeModal } = useModal()
  const openModals = getOpenModals()

  if (openModals.length === 0) {
    return null
  }

  return (
    <>
      {openModals.map((modal) => {
        const handleClose = () => {
          if (modal.onClose) {
            modal.onClose()
          }
          closeModal(modal.id)
        }

        // Gestione dei diversi tipi di modal
        switch (modal.type) {
          case 'confirm':
            return (
              <ConfirmModal
                key={modal.id}
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                confirmText={modal.confirmText}
                cancelText={modal.cancelText}
                variant={modal.variant}
                onConfirm={() => {
                  if (modal.onConfirm) {
                    modal.onConfirm()
                  }
                  closeModal(modal.id)
                }}
                onCancel={() => {
                  if (modal.onCancel) {
                    modal.onCancel()
                  }
                  closeModal(modal.id)
                }}
                style={{ zIndex: modal.zIndex }}
              />
            )

          case 'form':
            return (
              <FormModal
                key={modal.id}
                isOpen={modal.isOpen}
                title={modal.title}
                onClose={handleClose}
                onSubmit={modal.onSubmit}
                submitText={modal.submitText}
                cancelText={modal.cancelText}
                size={modal.size}
                style={{ zIndex: modal.zIndex }}
              >
                {modal.content}
              </FormModal>
            )

          case 'booking-details':
            return (
              <BookingDetailsModal
                key={modal.id}
                isOpen={modal.isOpen}
                booking={modal.booking}
                onClose={handleClose}
                style={{ zIndex: modal.zIndex }}
              />
            )

          case 'custom':
          default:
            return (
              <Modal
                key={modal.id}
                isOpen={modal.isOpen}
                title={modal.title}
                size={modal.size}
                onClose={handleClose}
                closeOnEscape={modal.closeOnEscape}
                closeOnOverlayClick={modal.closeOnOverlayClick}
                showCloseButton={modal.showCloseButton !== false}
                className={modal.className}
                overlayClassName={modal.overlayClassName}
                style={{ zIndex: modal.zIndex }}
                {...modal.modalProps}
              >
                {modal.content || modal.children}
              </Modal>
            )
        }
      })}
    </>
  )
}

export default ModalRenderer 