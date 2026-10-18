import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Different configurator choices on the same product/variant are separate cart lines.
const lineKey = (productId, variantId, configKey) => `${productId}::${variantId || 'base'}::${configKey || ''}`;

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { productId, variantId, slug, title, image, variantLabel, unitPrice, quantity, configKey?, options?, addons?, configSummary? }
      isDrawerOpen: false,

      addItem: (item) =>
        set((state) => {
          const key = lineKey(item.productId, item.variantId, item.configKey);
          const existing = state.items.find((i) => lineKey(i.productId, i.variantId, i.configKey) === key);

          if (existing) {
            return {
              items: state.items.map((i) =>
                lineKey(i.productId, i.variantId, i.configKey) === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      updateQuantity: (productId, variantId, quantity, configKey) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => lineKey(i.productId, i.variantId, i.configKey) !== lineKey(productId, variantId, configKey))
            : state.items.map((i) =>
                lineKey(i.productId, i.variantId, i.configKey) === lineKey(productId, variantId, configKey) ? { ...i, quantity } : i
              ),
        })),

      removeItem: (productId, variantId, configKey) =>
        set((state) => ({
          items: state.items.filter((i) => lineKey(i.productId, i.variantId, i.configKey) !== lineKey(productId, variantId, configKey)),
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
