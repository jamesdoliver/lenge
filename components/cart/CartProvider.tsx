"use client";

import {
  createContext,
  useCallback,
  useContext,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { Cart } from "@/lib/shopify/types";
import {
  addToCartAction,
  removeLineAction,
  updateLineAction,
} from "@/lib/cart/actions";

type CartContextValue = {
  cart: Cart | null;
  isOpen: boolean;
  isPending: boolean;
  open: () => void;
  close: () => void;
  add: (variantId: string, quantity: number) => Promise<void>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  initialCart,
  children,
}: {
  initialCart: Cart | null;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [optimisticCart] = useOptimistic(cart);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const add = useCallback(
    (variantId: string, quantity: number) =>
      new Promise<void>((resolve) => {
        startTransition(async () => {
          // Open the sheet immediately for responsiveness
          setIsOpen(true);
          const result = await addToCartAction(variantId, quantity);
          if (result.ok) setCart(result.cart);
          resolve();
        });
      }),
    []
  );

  const updateLine = useCallback(
    (lineId: string, quantity: number) =>
      new Promise<void>((resolve) => {
        startTransition(async () => {
          const result = await updateLineAction(lineId, quantity);
          if (result.ok) setCart(result.cart);
          resolve();
        });
      }),
    []
  );

  const removeLine = useCallback(
    (lineId: string) =>
      new Promise<void>((resolve) => {
        startTransition(async () => {
          const result = await removeLineAction(lineId);
          if (result.ok) setCart(result.cart);
          resolve();
        });
      }),
    []
  );

  return (
    <CartContext.Provider
      value={{
        cart: optimisticCart,
        isOpen,
        isPending,
        open,
        close,
        add,
        updateLine,
        removeLine,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
