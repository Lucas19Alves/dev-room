export function playSound(url) {
  const audio = new Audio(url)
  audio.play().catch(() => {
    // Silencia o erro de autoplay bloqueado
  })
}

export function notify(title, options = {}) {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, options)
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, options)
        } else {
          alert(`${title}\n${options.body || ''}`)
        }
      })
    } else {
      alert(`${title}\n${options.body || ''}`)
    }
  } else {
    alert(`${title}\n${options.body || ''}`)
  }
}