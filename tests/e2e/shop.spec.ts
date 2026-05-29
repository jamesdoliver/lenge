import { test, expect } from "@playwright/test";

const HANDLE_A = "lenge-design-a";

test.describe("Lenge shop", () => {
  test("homepage renders both shop cards", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("nav")).toBeVisible();

    const shopSection = page.locator("#shop");
    await expect(shopSection).toBeVisible();
    await expect(shopSection.getByText("Limitierter Drop · 15 Tage")).toBeVisible();

    const cards = shopSection.locator(`a[href^="/shop/"]`);
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toContainText(/Lenge.*Design.*A/i);
    await expect(cards.last()).toContainText(/Lenge.*Design.*B/i);
  });

  test("MERCH CTA scrolls to shop section", async ({ page }) => {
    await page.goto("/");
    const merch = page.getByRole("link", { name: "MERCH" });
    await expect(merch).toHaveAttribute("href", "#shop");
  });

  test("product page renders countdown, title, price, size grid, accordions", async ({ page }) => {
    await page.goto(`/shop/${HANDLE_A}`);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Lenge.*Design.*A/i);
    await expect(page.getByText(/Drop endet in/i)).toBeVisible();
    await expect(page.locator("text=/35,00.*€/")).toBeVisible();

    // Size selector — 8 buttons (XXS, XS, S, M, L, XL, 2XL, 3XL)
    const sizeButtons = page.locator('button[aria-pressed]');
    await expect(sizeButtons).toHaveCount(8);

    // Default selection: first available variant (likely XXS)
    const selectedSize = page.locator('button[aria-pressed="true"]');
    await expect(selectedSize).toHaveCount(1);

    // Quantity stepper
    await expect(page.getByRole("button", { name: "Menge verringern" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Menge erhöhen" })).toBeVisible();

    // Size guide trigger
    await expect(page.getByRole("button", { name: /Größentabelle anzeigen/i })).toBeVisible();

    // Accordions
    await expect(page.getByRole("button", { name: /Material.*Pflege/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Versand.*Rückgabe/i })).toBeVisible();
  });

  test("size guide modal opens and shows table + diagram", async ({ page }) => {
    await page.goto(`/shop/${HANDLE_A}`);

    await page.getByRole("button", { name: /Größentabelle anzeigen/i }).click();

    const dialog = page.getByRole("dialog", { name: /Größentabelle/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Maße in Zentimetern/i)).toBeVisible();
    await expect(dialog.locator("svg[role='img']")).toBeVisible();
    await expect(dialog.locator("table")).toBeVisible();

    // ESC closes
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("add to cart opens drawer and shows checkout link", async ({ page }) => {
    await page.goto(`/shop/${HANDLE_A}`);

    // Pick a size that's typically available — M
    await page.getByRole("button", { name: "M", exact: true }).click();

    await page.getByRole("button", { name: /In den Warenkorb/i }).click();

    // Cart sheet slides in
    const cartDialog = page.getByRole("dialog", { name: /Warenkorb/i });
    await expect(cartDialog).toBeVisible();

    // Should show one line item
    await expect(cartDialog.getByText(/Lenge.*Design.*A/i)).toBeVisible();
    await expect(cartDialog.getByText(/GRÖSSE M/i)).toBeVisible();

    // Subtotal label visible
    await expect(cartDialog.getByText(/Zwischensumme/i)).toBeVisible();

    // Checkout link points to Shopify-hosted checkout
    const checkoutLink = cartDialog.getByRole("link", { name: /Zur Kasse/i });
    await expect(checkoutLink).toBeVisible();
    const href = await checkoutLink.getAttribute("href");
    expect(href).toMatch(/^https:\/\/(.*\.shop|.*\.myshopify\.com)\/cart\/c\//);
  });

  test("cart pill appears after adding item, opens drawer when tapped", async ({ page }) => {
    await page.goto(`/shop/${HANDLE_A}`);

    // Add to cart
    await page.getByRole("button", { name: "M", exact: true }).click();
    await page.getByRole("button", { name: /In den Warenkorb/i }).click();

    // Wait for the drawer to fully appear, then close it
    const dialog = page.getByRole("dialog", { name: /Warenkorb/i });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    // Wait for transform-based slide-out to settle (300ms duration)
    await page.waitForTimeout(500);

    // Pill should be visible now (cart has 1 item)
    const pill = page.getByRole("button", { name: /Warenkorb öffnen/i });
    await expect(pill).toBeVisible();
    await expect(pill).toContainText("· 1");

    // Click pill -> drawer reopens. Pill has hover:scale animation; force-click to bypass stability check.
    await pill.click({ force: true });
    await expect(page.getByRole("dialog", { name: /Warenkorb/i })).toBeVisible();
  });

  test("404 not-found.tsx renders for unknown handle", async ({ page }) => {
    const response = await page.goto("/shop/does-not-exist-12345");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /Produkt nicht gefunden/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Zurück zum Shop/i })).toBeVisible();
  });
});
