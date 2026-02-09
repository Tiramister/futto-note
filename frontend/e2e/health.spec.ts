import { expect, test } from "@playwright/test";

test("ヘルスチェックが成功表示になる", async ({ page }) => {
	await page.route("**/api/health", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ status: "ok" }),
		});
	});

	await page.goto("/");

	await expect(page.getByTestId("health-status")).toHaveText("接続成功");
});
