import { useQuery } from '@tanstack/react-query'
import { fetchAllUsers } from '../api'

export function useAllUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchAllUsers,
  })
}
