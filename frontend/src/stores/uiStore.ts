import { create } from "zustand";

interface UiStore {
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setRightPanel: (open: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarCollapsed: false,
  rightPanelOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setRightPanel: (open) => set({ rightPanelOpen: open }),
}));
