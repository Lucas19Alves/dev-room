export function playSound(url) {
  const audio = new Audio(url)
  audio.play().catch(() => {
    // Silencia o erro de autoplay bloqueado
  })
}

// Mostra um aviso dentro do app (sempre) e uma notificação do sistema quando permitida.
export function toast(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('devroom-toast', { detail: { message, type } }))
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
}

export function notify(title, options = {}) {
  toast(options.body ? `${title} ${options.body}` : title, 'alert')
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    try { new Notification(title, { icon: '/icons/icon-192x192.png', ...options }) } catch {}
  } else if (Notification.permission === 'default') {
    requestNotificationPermission()
  }
}
