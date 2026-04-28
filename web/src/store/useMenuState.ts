import { create } from 'zustand';

interface MenuState {
  menuIsOpen: boolean;
  setMenuIsOpen(open: boolean): void;
}

export const useMenuState = create<MenuState>((set) => ({
  menuIsOpen: false,
  setMenuIsOpen: (open) => set({ menuIsOpen: open }),
}));
