/**
 * UI Store
 * 
 * Manages global UI state including drawer and loading states
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStoreState {
  // Drawer state
  drawerOpen: boolean
  toggleDrawer: () => void
  setDrawerOpen: (open: boolean) => void
  
  // Loading state
  isLoading: boolean
  loadingMessage?: string
  setLoading: (loading: boolean, message?: string) => void
  clearLoading: () => void
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      // Drawer state
      drawerOpen: false,
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
      setDrawerOpen: (open: boolean) => set({ drawerOpen: open }),
      
      // Loading state
      isLoading: false,
      loadingMessage: undefined,
      setLoading: (loading: boolean, message?: string) => 
        set({ isLoading: loading, loadingMessage: message }),
      clearLoading: () => 
        set({ isLoading: false, loadingMessage: undefined }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ drawerOpen: state.drawerOpen }),
    }
  )
)

export default useUIStore
