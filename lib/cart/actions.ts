"use server";

import { revalidatePath } from "next/cache";
import {
  addCartLines,
  createCart,
  getCart as fetchCart,
  removeCartLines,
  updateCartLine,
} from "@/lib/shopify/cart";
import type { Cart } from "@/lib/shopify/types";
import { isDropActive } from "@/lib/shop/drop";
import { clearCartId, readCartId, writeCartId } from "./cookie";

export type ActionResult =
  | { ok: true; cart: Cart }
  | { ok: false; error: string };

async function ensureCart(): Promise<Cart> {
  const id = await readCartId();
  if (id) {
    const cart = await fetchCart(id);
    if (cart) return cart;
    await clearCartId();
  }
  const fresh = await createCart();
  await writeCartId(fresh.id);
  return fresh;
}

export async function getCartAction(): Promise<Cart | null> {
  const id = await readCartId();
  if (!id) return null;
  const cart = await fetchCart(id);
  if (!cart) {
    await clearCartId();
    return null;
  }
  return cart;
}

export async function addToCartAction(
  variantId: string,
  quantity: number
): Promise<ActionResult> {
  if (!isDropActive()) {
    return { ok: false, error: "DROP BEENDET" };
  }
  if (!variantId || quantity < 1) {
    return { ok: false, error: "UNGÜLTIGE EINGABE" };
  }
  try {
    const cart = await ensureCart();
    const updated = await addCartLines(cart.id, [{ merchandiseId: variantId, quantity }]);
    revalidatePath("/", "layout");
    return { ok: true, cart: updated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FEHLER" };
  }
}

export async function updateLineAction(
  lineId: string,
  quantity: number
): Promise<ActionResult> {
  const id = await readCartId();
  if (!id) return { ok: false, error: "KEIN WARENKORB" };
  try {
    const updated =
      quantity <= 0
        ? await removeCartLines(id, [lineId])
        : await updateCartLine(id, lineId, quantity);
    revalidatePath("/", "layout");
    return { ok: true, cart: updated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FEHLER" };
  }
}

export async function removeLineAction(lineId: string): Promise<ActionResult> {
  const id = await readCartId();
  if (!id) return { ok: false, error: "KEIN WARENKORB" };
  try {
    const updated = await removeCartLines(id, [lineId]);
    revalidatePath("/", "layout");
    return { ok: true, cart: updated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FEHLER" };
  }
}
