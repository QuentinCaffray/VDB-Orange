import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import './index.css'
import App from './App'

function extractErrorMessage(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return null // géré par l'intercepteur axios (redirect /login)
    const serverMessage = error.response?.data?.message
    if (typeof serverMessage === 'string') return serverMessage
    if (error.code === 'ERR_NETWORK') return 'Impossible de joindre le serveur'
    return `Erreur serveur (${error.response?.status ?? 'inconnue'})`
  }
  return 'Une erreur inattendue est survenue'
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const message = extractErrorMessage(error)
      if (message) toast.error(message)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const message = extractErrorMessage(error)
      if (message) toast.error(message)
    },
  }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
