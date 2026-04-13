// T2 — Servicio de notificaciones con EventEmitter
// Emite eventos en el ciclo de vida del usuario
import { EventEmitter } from 'node:events'

class NotificationService extends EventEmitter {
  constructor() {
    super()
    this._registerListeners()
  }

  _registerListeners() {
    // En la práctica final estos eventos se enviarán a Slack
    this.on('user:registered', ({ email }) => {
      console.log(`[EVENT] user:registered → ${email}`)
    })

    this.on('user:verified', ({ email }) => {
      console.log(`[EVENT] user:verified → ${email}`)
    })

    this.on('user:invited', ({ email, invitedBy }) => {
      console.log(`[EVENT] user:invited → ${email} (invitado por ${invitedBy})`)
    })

    this.on('user:deleted', ({ email, soft }) => {
      console.log(`[EVENT] user:deleted → ${email} (soft: ${soft})`)
    })
  }
}

// Singleton — un único emisor para toda la app
export const notificationService = new NotificationService()
