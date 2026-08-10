import { expect, test } from "@playwright/test";

test("login exposes password and Google authentication", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText("Aloyz", { exact: true }).last()).toBeVisible();
  await expect(page.getByLabel("E-posta")).toBeVisible();
  await expect(page.getByLabel("Şifre")).toBeVisible();
  await expect(page.getByRole("button", { name: "E-posta ile giriş yap" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Google ile/ })).toBeVisible();
});

test("invalid web password is rejected without leaving login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(`missing-${Date.now()}@example.invalid`);
  await page.getByLabel("Şifre").fill("definitely-not-a-real-password");
  await page.getByRole("button", { name: "E-posta ile giriş yap" }).click();

  await expect(page.getByText("E-posta veya şifre hatalı.", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("mobile auth endpoints reject missing or invalid credentials", async ({ request }) => {
  const invalidPassword = await request.post("/api/mobile/auth/password", {
    data: { email: `missing-${Date.now()}@example.invalid`, password: "invalid-password" },
  });
  expect(invalidPassword.status()).toBe(401);
  await expect(invalidPassword.json()).resolves.toMatchObject({ error: expect.any(String) });

  const missingSession = await request.get("/api/mobile/auth/session");
  expect(missingSession.status()).toBe(401);

  const protectedInstagramConnect = await request.get("/api/mobile/integrations/instagram/connect");
  expect(protectedInstagramConnect.status()).toBe(401);
});
