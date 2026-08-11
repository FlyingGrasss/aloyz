import { expect, test } from "@playwright/test";

test("Expo web login exposes both supported authentication methods", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText("Aloyz", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "E-posta ile giriş yap" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Google ile devam et" })).toBeVisible();

  await page.getByRole("button", { name: "E-posta ile giriş yap" }).click();
  await expect(page.getByText("E-posta ve şifre alanlarını doldurun.", { exact: true })).toBeVisible();
});

test("authenticated Expo web dashboard exposes the web-style shell and overview", async ({ page }) => {
  await page.route("https://www.aloyz.co/api/mobile/auth/password", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "playwright-token",
        expiresAt: "2099-01-01T00:00:00.000Z",
        user: { id: "user-1", email: "owner@example.com", name: "Owner", image: null, role: "business", approvalStatus: "APPROVED" },
      }),
    });
  });
  await page.route("https://www.aloyz.co/api/business", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "business-1",
        name: "Demo işletme",
        slug: "demo-isletme",
        type: "Salon",
        phone: null,
        email: null,
        city: null,
        district: null,
        address: null,
        website: null,
        calendarId: null,
        welcome_message: null,
        hours: {},
        menu_or_services: "",
        faqs: [],
        staff: [],
        services: [],
        customers: [],
        checkouts: [],
        promotions: { receivables: [] },
        bookingSettings: {},
        botSettings: {},
        special_instructions: null,
        is_active: false,
        test_mode: false,
        instagram_page_id: null,
        currentMembershipRole: "owner",
        conversations: [],
        appointments: [],
      }),
    });
  });

  await page.goto("/login");
  const inputs = page.locator("input");
  await inputs.nth(0).fill("owner@example.com");
  await inputs.nth(1).fill("password");
  await page.getByRole("button", { name: "E-posta ile giriş yap" }).click();

  await expect(page.getByRole("button", { name: "Menüyü aç" })).toBeVisible();
  await expect(page.getByText("Bugünkü randevu", { exact: true })).toBeVisible();
  await expect(page.getByText("Açık randevular", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Menüyü aç" }).click();
  await expect(page.getByText("Raporlar", { exact: true })).toBeVisible();
  await expect(page.getByText("Mesajlaşma", { exact: true })).toBeVisible();
  await page.getByText("Mesajlaşma", { exact: true }).click();
  await expect(page.getByText("WhatsApp", { exact: true })).toBeVisible();
  await expect(page.getByText("Instagram", { exact: true })).toBeVisible();
});
