import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { privateKeyToAccount } from "viem/accounts";
import { createPaymentHeader } from "x402/client";
import type { PremiumContentResponse, X402Response } from "../types";

interface LogEntry {
	message: string;
	type: "info" | "success" | "error";
	timestamp: string;
}

function TestClient() {
	const [privateKey, setPrivateKey] = useState("");
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [isRunning, setIsRunning] = useState(false);
	const statusRef = useRef<HTMLDivElement>(null);

	// Load saved private key from localStorage
	useEffect(() => {
		const savedKey = localStorage.getItem("x402_test_private_key");
		if (savedKey) {
			setPrivateKey(savedKey);
		}
		addLog(
			"Ready! Enter a private key and click 'Run Payment Flow Test' to begin.",
		);
	}, []);

	// Auto-scroll logs
	useEffect(() => {
		if (statusRef.current) {
			statusRef.current.scrollTop = statusRef.current.scrollHeight;
		}
	}, [logs]);

	// Save private key to localStorage
	useEffect(() => {
		if (privateKey) {
			localStorage.setItem("x402_test_private_key", privateKey);
		}
	}, [privateKey]);

	const addLog = (
		message: string,
		type: "info" | "success" | "error" = "info",
	) => {
		const timestamp = new Date().toLocaleTimeString();
		setLogs((prev: LogEntry[]) => [...prev, { message, type, timestamp }]);
	};

	const clearLogs = () => {
		setLogs([]);
	};

	const runPaymentFlowTest = async () => {
		const key = privateKey.trim();

		if (!key) {
			addLog("Please enter a private key", "error");
			return;
		}

		clearLogs();
		setIsRunning(true);

		try {
			const SERVER_URL = window.location.origin;

			addLog("🧪 Testing x402 Payment Flow");
			addLog(`Server: ${SERVER_URL}`);
			addLog(`Network: Base Sepolia (testnet)`);

			// Step 1: Request without payment (should get 402)
			addLog("Step 1: Requesting /premium without payment...");
			const initialResponse = await fetch(`${SERVER_URL}/premium`);

			if (initialResponse.status !== 402) {
				addLog(`Expected 402, got ${initialResponse.status}`, "error");
				return;
			}

			const paymentInfo: X402Response = await initialResponse.json();
			addLog("Received 402 Payment Required", "success");

			const requirement = paymentInfo.accepts[0];
			if (!requirement) {
				addLog("No payment requirements found", "error");
				return;
			}

			addLog(`Payment needed: ${requirement.maxAmountRequired}`);
			addLog(`Description: ${requirement.description}`);

			addLog("Step 2: Creating and signing payment...");

			const formattedPrivateKy = key.startsWith("0x") ? key : `0x${key}`;

			const account = privateKeyToAccount(formattedPrivateKy as `0x${string}`);

			addLog(`Wallet: ${account.address}`);

			// Create payment using x402 SDK
			const paymentHeader = await createPaymentHeader(
				account,
				paymentInfo.x402Version,
				requirement as Parameters<typeof createPaymentHeader>[2],
			);

			addLog("Payment signed", "success");
			addLog(`Amount: ${requirement.maxAmountRequired}`);
			addLog(`Recipient: ${requirement.payTo}`);

			// Step 3: Retry request with payment
			addLog("Step 3: Sending request with payment...");

			const paidResponse = await fetch(`${SERVER_URL}/premium`, {
				headers: {
					"X-PAYMENT": paymentHeader,
				},
			});

			if (!paidResponse.ok) {
				const errorBody = await paidResponse.text();
				addLog(`Payment failed with status ${paidResponse.status}`, "error");
				addLog(`Error: ${errorBody}`, "error");
				return;
			}

			// Extract cookie from response
			const setCookieHeader = paidResponse.headers.get("set-cookie");
			let authToken = "";

			if (setCookieHeader) {
				const match = setCookieHeader.match(/auth_token=([^;]+)/);
				if (match) {
					authToken = match[1];
				}
			}

			const premiumContent =
				(await paidResponse.json()) as PremiumContentResponse;
			addLog("Payment successful! Premium content received:", "success");
			addLog(`Message: ${premiumContent.message}`);
			addLog(`Auth method: ${premiumContent.data.authenticated}`);
			addLog(`Cookie received: ${authToken ? "Yes" : "No"}`);

			if (!authToken) {
				addLog("Warning: No auth cookie received", "error");
				addLog("Skipping cookie authentication test");
				return;
			}

			// Step 4: Test access with cookie (no payment needed)
			addLog("Step 4: Testing cookie authentication...");
			addLog(`Cookie: auth_token=${authToken}`);
			addLog("Waiting 2 seconds...");
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const cookieResponse = await fetch(`${SERVER_URL}/premium`, {
				headers: {
					Cookie: `auth_token=${authToken}`,
				},
			});

			if (!cookieResponse.ok) {
				addLog(
					`Cookie auth failed with status ${cookieResponse.status}`,
					"error",
				);
				return;
			}

			const cookieContent =
				(await cookieResponse.json()) as PremiumContentResponse;
			addLog("Cookie authentication successful!", "success");
			addLog(`Message: ${cookieContent.message}`);
			addLog(`Auth method: ${cookieContent.data.authenticated}`);
			addLog("No payment required!");

			// Success summary
			addLog("🎉 All tests passed!", "success");
			addLog("Summary:");
			addLog("  ✅ 402 Payment Required response");
			addLog("  ✅ Payment creation and signing");
			addLog("  ✅ Payment verification and content access");
			addLog("  ✅ JWT cookie issuance");
			addLog("  ✅ Cookie-based authentication (no repeat payment)");
			addLog("✨ The x402 payment flow is working correctly!", "success");
		} catch (error) {
			addLog(`Test failed: ${error}`, "error");
			console.error(error);
		} finally {
			setIsRunning(false);
		}
	};

	const getLogEmoji = (type: string) => {
		switch (type) {
			case "success":
				return "✅";
			case "error":
				return "❌";
		}
		return "";
	};

	return (
		<>
			<div className="input-group">
				<label htmlFor="privateKey">Private Key:</label>
				<input
					type="text"
					id="privateKey"
					value={privateKey}
					onChange={(e) => setPrivateKey(e?.target?.value ?? "")}
					placeholder="0x..."
				/>
			</div>

			<button id="runTest" onClick={runPaymentFlowTest} disabled={isRunning}>
				{isRunning ? "Running Test..." : "🚀 Run Payment Flow Test"}
			</button>

			<div style={{ marginBottom: "10px" }}>
				<strong style={{ fontSize: "14px" }}>Status Log:</strong>
			</div>
			<div
				id="status"
				ref={statusRef}
				style={{
					maxWidth: "100%",
					overflowWrap: "break-word",
					wordBreak: "break-word",
				}}
			>
				{logs.map((log, index) => (
					<div key={index} className={log.type}>
						[{log.timestamp}] {getLogEmoji(log.type)} {log.message}
					</div>
				))}
			</div>
		</>
	);
}

// Mount the React app
const container = document.getElementById("test-client-root");
if (container) {
	const root = createRoot(container);
	root.render(<TestClient />);
}
