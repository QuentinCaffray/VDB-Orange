import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAllUsers,
  updateUserColor,
  createVendor,
  updateUserProfile,
  adminResetUserPassword,
  updateUserRole,
  deleteUser,
  CreateVendorInput,
  UpdateUserProfileInput,
} from '../api'

export function useAllUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchAllUsers,
  })
}

export function useUpdateUserColor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, color }: { userId: string; color: string }) =>
      updateUserColor(userId, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useCreateVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVendorInput) => createVendor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserProfileInput }) =>
      updateUserProfile(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useAdminResetUserPassword() {
  return useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      adminResetUserPassword(userId, newPassword),
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'vendeur' }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
