import { expect, test } from "@playwright/test";

test("home page renders the landing shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("unwrapped.tools");
  await expect(page.getByRole("heading", { level: 1, name: /search tools/i })).toBeVisible();
});
