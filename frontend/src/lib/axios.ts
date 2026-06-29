import axios, { InternalAxiosRequestConfig } from 'axios'

// ─── Token en mémoire — jamais exposé au localStorage ni accessible par JS tiers
let inMemoryAccessToken: string | null = null

export function setAccessToken(token: string): void {
  inMemoryAccessToken = token
}

export function clearAccessToken(): void {
  inMemoryAccessToken = null
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken
}

// ─── Instance axios ──────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  // Nécessaire pour que le navigateur envoie le cookie httpOnly avec les requêtes
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (inMemoryAccessToken) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`
  }
  return config
})

// ─── Refresh silencieux — renouvellement de l'access token sur 401 ───────────

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

function clearSessionAndRedirect(): void {
  clearAccessToken()
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
      // Le cookie httpOnly est envoyé automatiquement — pas de body requis
      const { data } = await api.post<{ accessToken: string }>('/auth/refresh')
      const newAccessToken = data.accessToken

      setAccessToken(newAccessToken)
      processQueue(newAccessToken)

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      rejectQueue(refreshError)
      clearSessionAndRedirect()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
