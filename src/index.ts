/**
 * Lightpanda Web Search Extension for PI
 *
 * Uses Lightpanda headless browser for web search with clean Markdown output.
 */

import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { defineTool } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { parseToStructured } from "./content-extractor";
import {
	LightpandaNotFoundError,
	SearchTimeoutError,
	getInstallInstructions,
} from "./error-handler";
import { LightpandaClient } from "./lightpanda-client";
import { buildSearchUrl, truncateResults } from "./search-orchestrator";

// Extension state
interface ExtensionState {
	client: LightpandaClient | null;
	process: ReturnType<typeof spawn> | null;
	enabledAsDefault: boolean;
	binaryPath: string | null;
}

const state: ExtensionState = {
	client: null,
	process: null,
	enabledAsDefault: false,
	binaryPath: null,
};

/**
 * Search the web using Lightpanda browser
 */
async function searchWithLightpanda(
	query: string,
	format: "markdown" | "structured" = "markdown",
	maxResults = 10,
	ctx: { signal?: AbortSignal } = {},
): Promise<{ content: string; details: Record<string, unknown> }> {
	if (!state.client || !state.binaryPath) {
		throw new LightpandaNotFoundError("Lightpanda client not initialized");
	}

	const searchUrl = buildSearchUrl(query);

	// Use Lightpanda's dump mode for clean markdown extraction
	const args = ["fetch", searchUrl, "--dump", "markdown"];

	try {
		// Execute Lightpanda with timeout
		const TIMEOUT_MS = 30000;

		const binaryPath = state.binaryPath;
		if (!binaryPath) {
			throw new LightpandaNotFoundError("Binary path not set");
		}

		const result = await Promise.race([
			new Promise<{ stdout: string; stderr: string; code: number }>((resolve, reject) => {
				const proc = spawn(binaryPath, args, {
					stdio: ["ignore", "pipe", "pipe"],
				});

				let stdout = "";
				let stderr = "";

				proc.stdout?.on("data", (data) => {
					stdout += data.toString();
				});

				proc.stderr?.on("data", (data) => {
					stderr += data.toString();
				});

				proc.on("close", (code) => {
					resolve({ stdout, stderr, code: code ?? 0 });
				});

				proc.on("error", reject);

				// Handle abort signal
				ctx.signal?.addEventListener("abort", () => {
					proc.kill();
					reject(new Error("Search aborted"));
				});
			}),
			setTimeout(TIMEOUT_MS).then(() => {
				throw new SearchTimeoutError(TIMEOUT_MS / 1000);
			}),
		]);

		if (result.code !== 0 && !result.stdout) {
			throw new Error(`Lightpanda failed: ${result.stderr || "Unknown error"}`);
		}

		const markdown = result.stdout.trim();

		// Format output
		let output: string;
		const details: Record<string, unknown> = {
			query,
			url: searchUrl,
			format,
			timestamp: new Date().toISOString(),
		};

		if (format === "structured") {
			const results = parseToStructured(markdown);
			const truncated = truncateResults(results, maxResults);
			output = JSON.stringify({ results: truncated }, null, 2);
			details.resultCount = truncated.length;
		} else {
			// Markdown format
			output = markdown || "No results found.";
			details.rawLength = markdown.length;
		}

		return {
			content: output,
			details,
		};
	} catch (error) {
		if (error instanceof SearchTimeoutError) {
			throw error;
		}
		throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Main extension export
 */
export default function lightpandaSearchExtension(pi: ExtensionAPI) {
	// Extension state - configuration is not directly accessible via ExtensionAPI
	// In the future, this could be read from environment variables or settings
	state.enabledAsDefault = false;

	// Initialize on session start
	pi.on("session_start", async (_event, ctx) => {
		try {
			// Try to detect Lightpanda binary
			const client = new LightpandaClient();
			const binaryPath = client.detectBinarySync();

			// Store for later use
			state.client = client;
			state.binaryPath = binaryPath;

			ctx.ui.notify(`Lightpanda search ready (${binaryPath})`, "info");
		} catch (error) {
			if (error instanceof LightpandaNotFoundError) {
				ctx.ui.notify(getInstallInstructions(), "warning");
				// Disable default search if enabled
				if (state.enabledAsDefault) {
					state.enabledAsDefault = false;
					ctx.ui.notify("Lightpanda default search disabled (binary not found)", "warning");
				}
			} else {
				ctx.ui.notify(
					`Lightpanda init error: ${error instanceof Error ? error.message : String(error)}`,
					"error",
				);
			}
		}
	});

	// Register search tool
	const searchTool = defineTool({
		name: "search_web",
		label: "Search Web",
		description:
			"Search the web using Lightpanda headless browser. Returns clean Markdown or structured JSON results.",
		promptSnippet: "Search the web for current information",
		promptGuidelines: [
			"Use this tool when you need current information from the web",
			"Prefer markdown format for reading content",
			"Use structured format when you need to extract specific data fields",
		],
		parameters: Type.Object({
			query: Type.String({ description: "Search query" }),
			format: Type.Optional(Type.Union([Type.Literal("markdown"), Type.Literal("structured")])),
			max_results: Type.Optional(
				Type.Number({ description: "Maximum results (1-50, default 10)" }),
			),
		}),

		async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
			const result = await searchWithLightpanda(
				params.query,
				params.format || "markdown",
				params.max_results || 10,
				{ signal },
			);

			return {
				content: [{ type: "text", text: result.content }],
				details: result.details,
			};
		},
	});

	pi.registerTool(searchTool);

	// Register toggle command
	pi.registerCommand("toggle-lightpanda-search", {
		description: "Toggle Lightpanda as default search provider",
		handler: async (_args, ctx) => {
			state.enabledAsDefault = !state.enabledAsDefault;
			const status = state.enabledAsDefault ? "enabled" : "disabled";
			ctx.ui.notify(`Lightpanda default search ${status}`, "info");
		},
	});

	// Hook into default search if enabled
	if (state.enabledAsDefault) {
		pi.on("before_agent_start", async (event) => {
			// Check if this is a search query
			const searchKeywords = ["search", "find", "look up", "google", "what is", "who is"];
			const isSearchQuery = searchKeywords.some((kw) => event.prompt.toLowerCase().includes(kw));

			if (isSearchQuery && state.client) {
				// Could inject search result here
				// For now, just log
				console.log(`[Lightpanda] Search query detected: ${event.prompt}`);
			}
		});
	}

	// Cleanup on shutdown
	pi.on("session_shutdown", async () => {
		if (state.process) {
			state.process.kill();
			state.process = null;
		}
		state.client = null;
		state.binaryPath = null;
	});
}
