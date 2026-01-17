import { useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'

export function useAuthFetch() {
  const { getAuthToken } = useAuth()

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const token = await getAuthToken()

      const headers = new Headers(options.headers)
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      return fetch(url, {
        ...options,
        headers,
      })
    },
    [getAuthToken]
  )

  return { authFetch }
}
