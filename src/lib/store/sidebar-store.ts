import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SidebarState {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    toggleCollapsed: () => void;
    setCollapsed: (collapsed: boolean) => void;
    toggleMobileOpen: () => void;
    setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            isCollapsed: false,
            isMobileOpen: false,
            toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
            setCollapsed: (collapsed: boolean) => set({ isCollapsed: collapsed }),
            toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
            setMobileOpen: (open: boolean) => set({ isMobileOpen: open }),
        }),
        {
            name: 'sidebar-storage',
            storage: createJSONStorage(() => localStorage),
            // Only persist isCollapsed, skip isMobileOpen for better UX on refresh
            partialize: (state) => ({ isCollapsed: state.isCollapsed }),
        }
    )
);
