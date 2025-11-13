# x402 Paywall Template

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/x402-paywall-template)

<!-- dash-content-start -->

A payment-gated API template using the [x402 protocol](https://x402.org) for cryptocurrency payments. This template demonstrates how to monetize API endpoints by requiring payment before granting access, with stateless cookie-based authentication for subsequent requests.

## Features

- 💰 **x402 Protocol Integration** - Accept crypto payments for API access
- ⚡ **Edge Computing** - Runs on Cloudflare Workers
- 🔒 **Secure** - HttpOnly, Secure, SameSite cookies

## How It Works

1. Client requests a protected endpoint without payment
2. Server returns HTTP 402 Payment Required with payment details
3. Client creates and signs payment using crypto wallet
4. Client retries request with payment in `X-PAYMENT` header
5. Server verifies payment and issues JWT cookie (valid 1 hour)
6. Subsequent requests use cookie—no additional payment needed

> [!IMPORTANT]
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/x402-paywall-template#setup-steps) before deploying.

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/x402-paywall-template
```

## Setup Steps

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   ```bash
   # Copy the example file
   cp .dev.vars.example .dev.vars
   ```

   Edit `.dev.vars` and add your values:

   ```ini
   # Your Ethereum wallet address to receive payments (must start with 0x)
   WALLET_ADDRESS=0x1234567890123456789012345678901234567890

   # Secret key for signing JWT tokens (generate with: openssl rand -base64 32)
   JWT_SECRET=your-secret-jwt-key-here
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   Open http://localhost:8787 to see the interactive test client.

4. Deploy to Cloudflare Workers:

   ```bash
   npm run deploy
   ```

5. Set production secrets:

   ```bash
   npx wrangler secret put WALLET_ADDRESS
   npx wrangler secret put JWT_SECRET
   ```

## Project Structure

```
src/
├── client/          # Browser-based React test client
│   └── index.tsx    # Interactive payment flow tester
├── server/          # Worker server code
│   ├── index.ts     # Main worker entry point
│   ├── auth.ts      # Payment & cookie authentication
│   └── jwt.ts       # JWT token utilities
└── types.ts         # Shared TypeScript types
```

## API Endpoints

### `GET /message`

Public endpoint that returns a simple message. No payment required.

**Response:**

```
Hello Hono!
```

### `GET /premium`

Protected endpoint requiring payment OR valid authentication cookie.

**Price:** $0.01 (valid for 1 hour)
**Network:** Base Sepolia (testnet)
**Payment:** USDC

**Without payment:**

```json
{
	"error": "Payment required",
	"accepts": [
		{
			"scheme": "evm",
			"network": "base-sepolia",
			"maxAmountRequired": "10000",
			"payTo": "0x...",
			"asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
			"description": "Access to premium content for 1 hour"
		}
	],
	"x402Version": 1
}
```

**With valid payment or cookie:**

```json
{
	"message": "Welcome to premium content!",
	"data": {
		"secret": "This is valuable premium data",
		"timestamp": "2025-11-13T20:00:00.000Z",
		"authenticated": "via payment"
	}
}
```

## Testing

### Interactive Web Client

The deployed application includes a built-in test client:

1. Open the deployed URL in your browser
2. Enter a Base Sepolia testnet wallet private key
3. Click "Run Payment Flow Test"
4. Watch the complete payment flow execute

⚠️ **Use testnet wallets only. Never use real funds.**

## Customization

### Change Payment Amount

Edit `src/server/index.ts`:

```typescript
createProtectedRoute({
	price: "$0.05", // Change amount here
	network: "base-sepolia",
	description: "Access to premium content for 1 hour",
});
```

### Change Cookie Duration

Edit `src/server/index.ts`:

```typescript
const token = await generateJWT(
	c.env.JWT_SECRET,
	7200, // 2 hours (in seconds)
);
```

### Use Production Network

Change `network` from `"base-sepolia"` to `"base"` in the route configuration. Ensure you update your wallet address and test thoroughly on testnet first.

## Resources

- [x402 Protocol Documentation](https://x402.gitbook.io/x402)
- [x402 SDK on GitHub](https://github.com/coinbase/x402)
- [Base Sepolia Testnet](https://docs.base.org/network-information/#base-testnet-sepolia)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
