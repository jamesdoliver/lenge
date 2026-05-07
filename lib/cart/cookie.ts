import "server-only";
import { cookies } from "next/headers";

const CART_COOKIE_NAME = "lenge_cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export async function readCartId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE_NAME)?.value ?? null;
}

export async function writeCartId(cartId: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE_NAME, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export async function clearCartId(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE_NAME);
}
