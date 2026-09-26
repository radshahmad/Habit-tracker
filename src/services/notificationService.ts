// A single general daily reminder (never per-habit). Because this app has no
// server to push through, the reminder is scheduled locally with a timer:
// it fires reliably whenever the app/tab is open, and browsers that support
// background sync for installed PWAs may still deliver it briefly after
// close. This limitation is explained to the user in Settings.

let timer: ReturnType<typeof setTimeout> | null = null

export const notificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window
  },

  permission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied'
    return Notification.requestPermission()
  },

  cancel(): void {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  },

  /** Schedules (or re-schedules) today's/tomorrow's reminder at `time` = "HH:mm". */
  scheduleDaily(time: string, getMessage: () => { title: string; body: string } | null): void {
    this.cancel()
    if (!this.isSupported() || Notification.permission !== 'granted') return

    const [h, m] = time.split(':').map(Number)
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0)
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1)
    }
    const delay = next.getTime() - now.getTime()

    timer = setTimeout(() => {
      const message = getMessage()
      if (message) {
        try {
          new Notification(message.title, { body: message.body, icon: '/icons/icon-192.png' })
        } catch {
          // Notifications can throw in some embedded/mobile webviews; fail silently.
        }
      }
      this.scheduleDaily(time, getMessage)
    }, delay)
  },
}
