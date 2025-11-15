const isDevelopment = import.meta.env.MODE === 'development'

const formatLine = (label: string, color: string, context?: string) => {
  const timestamp = new Date().toISOString()
  const prefix = context ? `[${context}]` : '[App]'
  return [`%c${timestamp} ${prefix} ${label}`, `color: ${color}; font-weight: 600;`] as const
}

const createLogger = (
  level: 'log' | 'warn' | 'error' | 'debug',
  color: string,
) => {
  return (context: string, ...payload: unknown[]) => {
    if (!isDevelopment && level === 'debug') {
      return
    }

    const [message, style] = formatLine(level.toUpperCase(), color, context)
    // eslint-disable-next-line no-console
    switch (level) {
      case 'log':
        console.log(message, style, ...payload)
        break
      case 'warn':
        console.warn(message, style, ...payload)
        break
      case 'error':
        console.error(message, style, ...payload)
        break
      case 'debug':
        console.debug(message, style, ...payload)
        break
    }
  }
}

export const log = createLogger('log', '#2563eb')
export const warn = createLogger('warn', '#f59e0b')
export const error = createLogger('error', '#dc2626')
export const debug = createLogger('debug', '#10b981')