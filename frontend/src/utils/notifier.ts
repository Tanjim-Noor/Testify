export type Severity = 'success' | 'info' | 'warning' | 'error'

type NotifyFn = (message: string, severity?: Severity) => void

let notifyFn: NotifyFn | null = null

export const setNotifier = (fn: NotifyFn) => {
  notifyFn = fn
}

export const clearNotifier = () => {
  notifyFn = null
}

export const notify = (message: string, severity: Severity = 'info') => {
  if (!notifyFn) return
  try {
    notifyFn(message, severity)
  } catch (err) {
    // swallow errors to keep notifier resilient
    // eslint-disable-next-line no-console
    console.error('Notifier error', err)
  }
}

export const success = (message: string) => notify(message, 'success')
export const info = (message: string) => notify(message, 'info')
export const warn = (message: string) => notify(message, 'warning')
export const error = (message: string) => notify(message, 'error')
