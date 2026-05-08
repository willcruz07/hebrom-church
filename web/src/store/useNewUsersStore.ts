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

    set({ isMonitoring: true })

    const fetchCounts = async () => {
      try {
        const pending = await getPendingUsersCount()
        const visitors = await getVisitorsCount()
        set({ pendingCount: pending, visitorsCount: visitors })
      } catch (error) {
        console.error('Erro ao buscar contagens:', error)
      }
    }

    fetchCounts()

    return () => {
      set({ isMonitoring: false, pendingCount: 0, visitorsCount: 0 })
    }
  },
}))
