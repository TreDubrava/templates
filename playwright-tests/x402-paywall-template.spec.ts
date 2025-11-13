import { test, expect } from "./fixtures";

test.describe("x402 Paywall Template", () => {
	test("should display homepage with documentation and test client", async ({
		page,
		templateUrl,
	}) => {
		await page.goto(templateUrl);

		// Check main heading
		await expect(
			page.getByRole("heading", { name: "x402 Payment-Gated API" }),
		).toBeVisible();

		// Check that documentation content is visible
		await expect(
			page.getByText("This Cloudflare Worker demonstrates payment-gated"),
		).toBeVisible();

		// Check Available Endpoints section
		await expect(
			page.getByRole("heading", { name: "Available Endpoints" }),
		).toBeVisible();

		// Check public endpoint documentation
		await expect(page.getByText("GET /message")).toBeVisible();
		await expect(page.getByText("PUBLIC")).toBeVisible();

		// Check protected endpoint documentation
		await expect(page.getByText("GET /premium")).toBeVisible();
		await expect(page.getByText("PROTECTED")).toBeVisible();

		// Check test client panel is visible
		await expect(
			page.getByRole("heading", { name: "🧪 Test Payment Flow" }),
		).toBeVisible();

		// Check private key input field exists
		await expect(page.getByLabel("Private Key:")).toBeVisible();

		// Check run test button exists
		await expect(
			page.getByRole("button", { name: "🚀 Run Payment Flow Test" }),
		).toBeVisible();

		// Check status log container exists
		await expect(page.locator("#status")).toBeVisible();
	});

	test("should access public endpoint without payment", async ({
		page,
		templateUrl,
	}) => {
		// Navigate directly to the public endpoint
		const response = await page.goto(`${templateUrl}/message`);

		// Should return 200 OK
		expect(response?.status()).toBe(200);

		// Should display the message
		await expect(page.getByText("Hello Hono!")).toBeVisible();
	});

	test("should return 402 for protected endpoint without payment", async ({
		page,
		templateUrl,
	}) => {
		// Navigate to protected endpoint without payment
		const response = await page.goto(`${templateUrl}/premium`);

		// Should return 402 Payment Required
		expect(response?.status()).toBe(402);

		// Check that payment information is returned
		const content = await page.content();
		expect(content).toContain("accepts");
		expect(content).toContain("x402Version");
	});

	test("should have working links to endpoints", async ({
		page,
		templateUrl,
	}) => {
		await page.goto(templateUrl);

		// Click on the public endpoint link
		await page.getByRole("link", { name: "Try it now →" }).first().click();

		// Should navigate to /message
		await expect(page).toHaveURL(`${templateUrl}/message`);
		await expect(page.getByText("Hello Hono!")).toBeVisible();
	});
});
