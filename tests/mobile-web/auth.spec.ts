import { expect, test } from "@playwright/test";

test("Expo web login exposes both supported authentication methods", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText("Aloyz", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "E-posta ile giriş yap" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Google ile devam et" })).toBeVisible();

  await page.getByRole("button", { name: "E-posta ile giriş yap" }).click();
  await expect(page.getByText("E-posta ve şifre alanlarını doldurun.", { exact: true })).toBeVisible();
});
