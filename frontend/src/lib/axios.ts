import axios, { InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Refresh token — renouvellement silencieux de l'access token ──────────────

interface RequestWithRetryFlag extends InternalAxiosRequestConfig {
  _retried?: boolean
}

interface PendingRequest {
  resolve: (newToken: string) => void
  reject: (error: unknown) => void
}

let isRefreshing = false
let pendingRequestQueue: PendingRequest[] = []

function processQueue(newToken: string): void {
  pendingRequestQueue.forEach(({ resolve }) => resolve(newToken))
  pendingRequestQueue = []
}

function rejectQueue(error: unknown): void {
  pendingRequestQueue.forEach(({ reject }) => reject(error))
  pendingRequestQueue = []
}

function clearAuthAndRedirect(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('current_user')
  window.location.href = '/login'
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RequestWithRetryFlag

    const isUnauthorized = error.response?.status === 401
    const isRefreshEndpoint = originalRequest?.url?.includes('/auth/refresh')
    const hasAlreadyRetried = originalRequest?._retried

    if (!isUnauthorized || isRefreshEndpoint || hasAlreadyRetried) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    // Si un refresh est déjà en cours, mettre la requête en file d'attente
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequestQueue.push({
          resolve: (newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    isRefreshing = true
    originalRequest._retried = true

    try {
      const { data } = await api.post<{ accessToken: string }>('/auth/refresh', { refreshToken })
      const newAccessToken = data.accessToken

      localStorage.setItem('access_token', newAccessToken)
      processQueue(newAccessToken)

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      rejectQueue(refreshError)
      clearAuthAndRedirect()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
