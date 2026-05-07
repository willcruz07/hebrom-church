import { create } from 'zustand'
import { getPendingUsersCount, getVisitorsCount } from '@/services/firebase/users'

interface NewUsersState {
  pendingCount: number
  visitorsCount: number
  isMonitoring: boolean
  startMonitoring: (canManageUsers: boolean) => () => void
}

export const useNewUsersStore = create<NewUsersState>((set, get) => ({
  pendingCount: 0,
  visitorsCount: 0,
  isMonitoring: false,
  startMonitoring: (canManageUsers) => {
    if (!canManageUsers || get().isMonitoring) return () => {}

    const unsubPending = getPendingUsersCount((count) => set({ pendingCount: count }))
    const unsubVisitors = getVisitorsCount((count) => set({ visitorsCount: count }))
    
    set({ isMonitoring: true })

    return () => {
      unsubPending()
      unsubVisitors()
      set({ isMonitoring: false, pendingCount: 0, visitorsCount: 0 })
    }
  },
}))
