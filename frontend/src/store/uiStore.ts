import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStoreState {
  drawerOpen: boolean
  toggleDrawer: () => void
  setDrawerOpen: (open: boolean) => void
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      drawerOpen: false,
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
      setDrawerOpen: (open: boolean) => set({ drawerOpen: open }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ drawerOpen: state.drawerOpen }),
    }
  )
)

export default useUIStore
