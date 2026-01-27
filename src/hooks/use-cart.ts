import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

interface CartState {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      totalItems: 0,
      totalPrice: 0,

      addToCart: (item) => {
        set((state) => {
          const existing = state.cart.find((i) => i.id === item.id);
          let newCart: CartItem[];

          if (existing) {
            newCart = state.cart.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            );
          } else {
            newCart = [...state.cart, { ...item, quantity: 1 }];
          }

          const totalItems = newCart.reduce((sum, i) => sum + i.quantity, 0);
          const totalPrice = newCart.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          );

          return { cart: newCart, totalItems, totalPrice };
        });
      },

      removeFromCart: (id) => {
        set((state) => {
          const newCart = state.cart.filter((i) => i.id !== id);
          const totalItems = newCart.reduce((sum, i) => sum + i.quantity, 0);
          const totalPrice = newCart.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          );
          return { cart: newCart, totalItems, totalPrice };
        });
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            const newCart = state.cart.filter((i) => i.id !== id);
            const totalItems = newCart.reduce((sum, i) => sum + i.quantity, 0);
            const totalPrice = newCart.reduce(
              (sum, i) => sum + i.price * i.quantity,
              0
            );
            return { cart: newCart, totalItems, totalPrice };
          }

          const newCart = state.cart.map((i) =>
            i.id === id ? { ...i, quantity } : i
          );
          const totalItems = newCart.reduce((sum, i) => sum + i.quantity, 0);
          const totalPrice = newCart.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          );
          return { cart: newCart, totalItems, totalPrice };
        });
      },

      clearCart: () => {
        set({ cart: [], totalItems: 0, totalPrice: 0 });
      },
    }),
    {
      name: "shop-cart",
    }
  )
);
