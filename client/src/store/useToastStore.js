import { create } from 'zustand';

let nextId = 1;

export const useToastStore = create((set) => ({
  toasts: [],

  show: (message, tone = 'success') =>
    set((state) => ({ toasts: [...state.toasts, { id: nextId++, message, tone }] })),

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message) => useToastStore.getState().show(message, 'success'),
  error: (message) => useToastStore.getState().show(message, 'error'),
};
