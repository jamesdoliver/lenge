import "server-only";
import { shopifyFetch } from "./client";
import {
  CART_QUERY,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from "./mutations";
import type { Cart } from "./types";

type CartRaw = Omit<Cart, "lines"> & { lines: { nodes: Cart["lines"] } };
type CartPayload = { cart: CartRaw | null; userErrors: { field: string[] | null; message: string }[] };

function flattenCart(raw: CartRaw): Cart {
  return { ...raw, lines: raw.lines.nodes };
}

export async function getCart(id: string): Promise<Cart | null> {
  const data = await shopifyFetch<{ cart: CartRaw | null }>(
    CART_QUERY,
    { id },
    { cache: "no-store" }
  );
  return data.cart ? flattenCart(data.cart) : null;
}

export async function createCart(): Promise<Cart> {
  const data = await shopifyFetch<{ cartCreate: CartPayload }>(
    CART_CREATE_MUTATION,
    { input: {} },
    { cache: "no-store" }
  );
  if (!data.cartCreate.cart) {
    throw new Error(data.cartCreate.userErrors[0]?.message ?? "Cart creation failed");
  }
  return flattenCart(data.cartCreate.cart);
}

export async function addCartLines(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesAdd: CartPayload }>(
    CART_LINES_ADD_MUTATION,
    { cartId, lines },
    { cache: "no-store" }
  );
  if (!data.cartLinesAdd.cart) {
    throw new Error(data.cartLinesAdd.userErrors[0]?.message ?? "Add to cart failed");
  }
  return flattenCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesUpdate: CartPayload }>(
    CART_LINES_UPDATE_MUTATION,
    { cartId, lines: [{ id: lineId, quantity }] },
    { cache: "no-store" }
  );
  if (!data.cartLinesUpdate.cart) {
    throw new Error(data.cartLinesUpdate.userErrors[0]?.message ?? "Update line failed");
  }
  return flattenCart(data.cartLinesUpdate.cart);
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesRemove: CartPayload }>(
    CART_LINES_REMOVE_MUTATION,
    { cartId, lineIds },
    { cache: "no-store" }
  );
  if (!data.cartLinesRemove.cart) {
    throw new Error(data.cartLinesRemove.userErrors[0]?.message ?? "Remove line failed");
  }
  return flattenCart(data.cartLinesRemove.cart);
}
