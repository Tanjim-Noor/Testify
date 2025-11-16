import { useEffect, useState } from 'react'

/**
 * useDebounce - Returns a debounced value that updates after the specified delay.
 */
export function useDebounce<T>(value: T, delay = 500) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

export default useDebounce
