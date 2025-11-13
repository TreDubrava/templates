import type { Address } from "viem";

/**
 * Payment requirement information returned in 402 responses
 */
export interface PaymentRequirement {
	scheme: string;
	network: string;
	maxAmountRequired: string;
	resource: string;
	description: string;
	mimeType: string;
	maxTimeoutSeconds: number;
	payTo: Address;
	asset: string;
}

/**
 * x402 protocol response structure
 */
export interface X402Response {
	error: string;
	accepts: PaymentRequirement[];
	x402Version: number;
}

/**
 * Premium content response structure
 */
export interface PremiumContentResponse {
	message: string;
	data: {
		secret: string;
		timestamp: string;
		authenticated: "via payment" | "via cookie";
	};
}
