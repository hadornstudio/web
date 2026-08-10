import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const lineKey = (productId, variantId) => `${productId}::${variantId || 'base'}`;

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { productId, variantId, slug, title, image, variantLabel, unitPrice, quantity }
      isDrawerOpen: false,

      addItem: (item) =>
        set((state) => {
          const key = lineKey(item.productId, item.variantId);
          const existing = state.items.find((i) => lineKey(i.productId, i.variantId) === key);

          if (existing) {
            return {
              items: state.items.map((i) =>
                lineKey(i.productId, i.variantId) === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => lineKey(i.productId, i.variantId) !== lineKey(productId, variantId))
            : state.items.map((i) =>
                lineKey(i.productId, i.variantId) === lineKey(productId, variantId) ? { ...i, quantity } : i
              ),
        })),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter((i) => lineKey(i.productId, i.variantId) !== lineKey(productId, variantId)),
        })),

      clearCart: () => set({ items: [] }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    }),
    { name: 'hadorn-cart', partialize: (state) => ({ items: state.items }) }
  )
);
