import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { createProtectedRoute } from "./auth";
import { generateJWT } from "./jwt";

type AppContext = {
	Bindings: Env;
	Variables: {
		auth?: { paid: boolean; iat: number; exp: number };
	};
};

const app = new Hono<AppContext>();

// Public endpoint - no authentication required
app.get("/message", (c) => {
	return c.text("Hello Hono!");
});

// Protected endpoint - requires payment OR valid cookie
app.get(
	"/premium",
	createProtectedRoute({
		price: "$0.01",
		network: "base-sepolia",
		description: "Access to premium content for 1 hour",
	}),
	// Handler that runs after successful authentication (cookie or payment)
	async (c) => {
		// Check if this is a fresh payment (not from cookie auth)
		const hasExistingAuth = c.get("auth");

		if (!hasExistingAuth) {
			// This is a new payment, issue a JWT cookie
			// Generate JWT valid for 1 hour
			const token = await generateJWT(
				c.env.JWT_SECRET,
				3600, // 1 hour
			);

			// Set secure HTTP-only cookie
			setCookie(c, "auth_token", token, {
				httpOnly: true, // Prevents JavaScript access (XSS protection)
				secure: true, // HTTPS only (in production)
				sameSite: "Strict", // CSRF protection
				maxAge: 3600, // 1 hour (matches JWT expiration)
				path: "/", // Available for all routes
			});
		}

		// Return premium content
		return c.json({
			message: "Welcome to premium content!",
			data: {
				secret: "This is valuable premium data",
				timestamp: new Date().toISOString(),
				authenticated: hasExistingAuth ? "via cookie" : "via payment",
			},
		});
	},
);

export default app;
