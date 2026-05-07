"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { Cart } from "@/lib/shopify/types";
import {
  addToCartAction,
  removeLineAction,
  updateLineAction,
  type ActionResult,
} from "@/lib/cart/actions";

export type { ActionResult };

type CartContextValue = {
  cart: Cart | null;
  isOpen: boolean;
  isPending: boolean;
  open: () => void;
  close: () => void;
  add: (variantId: string, quantity: number) => Promise<ActionResult>;
  updateLine: (lineId: string, quantity: number) => Promise<ActionResult>;
  removeLine: (lineId: string) => Promise<ActionResult>;
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
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const add = useCallback(
    (variantId: string, quantity: number) =>
      new Promise<ActionResult>((resolve) => {
        startTransition(async () => {
          // Open the sheet immediately for responsiveness
          setIsOpen(true);
          const result = await addToCartAction(variantId, quantity);
          if (result.ok) setCart(result.cart);
          resolve(result);
        });
      }),
    []
  );

  const updateLine = useCallback(
    (lineId: string, quantity: number) =>
      new Promise<ActionResult>((resolve) => {
        startTransition(async () => {
          const result = await updateLineAction(lineId, quantity);
          if (result.ok) setCart(result.cart);
          resolve(result);
        });
      }),
    []
  );

  const removeLine = useCallback(
    (lineId: string) =>
      new Promise<ActionResult>((resolve) => {
        startTransition(async () => {
          const result = await removeLineAction(lineId);
          if (result.ok) setCart(result.cart);
          resolve(result);
        });
      }),
    []
  );

  return (
    <CartContext.Provider
      value={{
        cart,
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
