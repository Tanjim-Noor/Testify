import type { AxiosError } from 'axios'

export const parseAxiosError = (err: unknown): string => {
  // Axios error shapes
  if (!err) return 'Unknown error'

  const e = err as AxiosError
  const payload = e?.response?.data
  if (payload) {
    // Common FastAPI shapes: { detail: "..." }
    if (typeof payload === 'object' && 'detail' in (payload as unknown as Record<string, unknown>)) {
      return (payload as unknown as { detail?: unknown }).detail as string
    }
    if (typeof payload === 'object' && 'message' in (payload as unknown as Record<string, unknown>)) {
      return (payload as unknown as { message?: unknown }).message as string
    }
    // When validation errors occur, FastAPI returns detail as array
    if (Array.isArray(payload)) {
      try {
        return (payload as unknown[]).map((d) => {
          const dd = d as Record<string, unknown>
          return (typeof dd?.msg === 'string' ? dd.msg : JSON.stringify(d))
        }).join(', ')
      } catch {
        return JSON.stringify(payload)
      }
    }
    // fallback stringification
    try {
      return JSON.stringify(payload)
    } catch {
      return String(payload)
    }
  }

  if (typeof (err as Error).message === 'string') return (err as Error).message
  return String(err)
}

/**
 * Inspect axios error response for field-level validation messages and return
 * a map of fieldName -> message. This supports FastAPI shapes (detail array),
 * plain object responses and string messages that include a field name.
 */
export const parseFieldErrors = (err: unknown): Record<string, string> => {
  try {
    const e = err as AxiosError
    const payload = e?.response?.data
    if (!payload) return {}

    // If payload is object with field arrays: { email: ["already exists"] }
    if (typeof payload === 'object' && !Array.isArray(payload)) {
      const fieldMap: Record<string, string> = {}
      for (const key of Object.keys(payload)) {
        const val = (payload as unknown as Record<string, unknown>)[key]
        if (Array.isArray(val) && val.length > 0) {
          fieldMap[key] = String(val[0])
        } else if (typeof val === 'string') {
          fieldMap[key] = val
        }
      }
      if (Object.keys(fieldMap).length) return fieldMap
    }

    // If payload.detail is a string: attempt to map common field names
    const payloadAny = payload as unknown as { detail?: unknown }
    const detail = payloadAny?.detail
    if (typeof detail === 'string') {
      if (/email/i.test(detail)) return { email: detail }
      if (/password/i.test(detail)) return { password: detail }
      if (/username/i.test(detail)) return { username: detail }
    }

    // If payload.detail is an array of pydantic errors, map loc[-1] -> msg
    if (Array.isArray(detail)) {
      const map: Record<string, string> = {}
      for (const item of detail) {
        const loc = item?.loc
        const msg = item?.msg ?? item?.detail
        if (Array.isArray(loc) && loc.length) {
          const field = String(loc[loc.length - 1])
          map[field] = String(msg)
        }
      }
      if (Object.keys(map).length) return map
    }

    return {}
  } catch {
    return {}
  }
}
