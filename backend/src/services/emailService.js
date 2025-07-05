// Email Service - Basic implementation for booking notifications
class EmailService {
  
  // Send booking confirmation email
  async sendBookingConfirmation(booking) {
    console.log('📧 Email Service: Booking confirmation email would be sent to:', booking.customerInfo?.email)
    console.log('📧 Booking details:', {
      confirmationCode: booking.confirmationCode,
      venue: booking.venue?.name,
      date: booking.date,
      time: `${booking.startTime} - ${booking.endTime}`
    })
    
    // In a real implementation, this would send actual emails
    // For now, we just log the email content
    return {
      success: true,
      messageId: `mock-email-${Date.now()}`,
      message: 'Email sent successfully (mock)'
    }
  }

  // Send booking cancellation email
  async sendBookingCancellation(booking) {
    console.log('📧 Email Service: Booking cancellation email would be sent to:', booking.customerInfo?.email)
    console.log('📧 Cancelled booking:', {
      confirmationCode: booking.confirmationCode,
      venue: booking.venue?.name,
      date: booking.date
    })
    
    return {
      success: true,
      messageId: `mock-email-${Date.now()}`,
      message: 'Cancellation email sent successfully (mock)'
    }
  }

  // Send booking reminder email
  async sendBookingReminder(booking) {
    console.log('📧 Email Service: Booking reminder email would be sent to:', booking.customerInfo?.email)
    console.log('📧 Reminder for booking:', {
      confirmationCode: booking.confirmationCode,
      venue: booking.venue?.name,
      date: booking.date,
      time: `${booking.startTime} - ${booking.endTime}`
    })
    
    return {
      success: true,
      messageId: `mock-email-${Date.now()}`,
      message: 'Reminder email sent successfully (mock)'
    }
  }

  // Send status change notification
  async sendStatusChangeNotification(booking, oldStatus, newStatus) {
    console.log('📧 Email Service: Status change notification would be sent to:', booking.customerInfo?.email)
    console.log('📧 Status change:', {
      confirmationCode: booking.confirmationCode,
      venue: booking.venue?.name,
      oldStatus,
      newStatus
    })
    
    return {
      success: true,
      messageId: `mock-email-${Date.now()}`,
      message: 'Status change notification sent successfully (mock)'
    }
  }

  // Validate email address
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Format email template (basic implementation)
  formatEmailTemplate(templateType, data) {
    const templates = {
      confirmation: {
        subject: `Conferma prenotazione - ${data.venue?.name}`,
        body: `
          Ciao ${data.customerInfo?.name},
          
          La tua prenotazione è stata confermata!
          
          Dettagli:
          - Codice prenotazione: ${data.confirmationCode}
          - Locale: ${data.venue?.name}
          - Data: ${data.date}
          - Orario: ${data.startTime} - ${data.endTime}
          - Persone: ${data.partySize}
          
          Grazie per aver scelto SPOrTS!
        `
      },
      cancellation: {
        subject: `Prenotazione cancellata - ${data.venue?.name}`,
        body: `
          Ciao ${data.customerInfo?.name},
          
          La tua prenotazione è stata cancellata.
          
          Dettagli:
          - Codice prenotazione: ${data.confirmationCode}
          - Locale: ${data.venue?.name}
          - Data: ${data.date}
          
          Speriamo di rivederti presto!
        `
      }
    }
    
    return templates[templateType] || { subject: 'Notifica SPOrTS', body: 'Aggiornamento sulla tua prenotazione.' }
  }
}

module.exports = new EmailService() 