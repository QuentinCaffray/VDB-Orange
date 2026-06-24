import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { DailySaleEntry } from '../../../types/sales.types'

// Connexion singleton — partagée entre tous les composants qui utilisent ce hook
const socket = io()

export function useDailySalesSocket(dateString: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    function handleSaleUpdate(updatedSale: DailySaleEntry): void {
      if (updatedSale.date !== dateString) return

      queryClient.setQueryData<DailySaleEntry[]>(
        ['sales', 'daily', dateString],
        (previous = []) => {
          const existingIndex = previous.findIndex(
            (entry) =>
              entry.indicatorId === updatedSale.indicatorId &&
              entry.userId === updatedSale.userId,
          )
          if (existingIndex === -1) return [...previous, updatedSale]
          return previous.map((entry, index) =>
            index === existingIndex ? updatedSale : entry,
          )
        },
      )
    }

    socket.on('sales:daily:updated', handleSaleUpdate)
    return () => {
      socket.off('sales:daily:updated', handleSaleUpdate)
    }
  }, [dateString, queryClient])
}
