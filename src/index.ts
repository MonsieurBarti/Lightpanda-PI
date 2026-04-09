/**
 * Lightpanda Web Search Extension for PI
 *
 * Uses Lightpanda headless browser for web search with clean Markdown output.
 */

import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { defineTool, truncateHead } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { parseToStructured } from "./content-extractor";
import { LightpandaNotFoundError, getInstallInstructions } from "./error-handler";
import { LightpandaClient } from "./lightpanda-client";
import { buildSearchUrl, truncateResults } from "./search-orchestrator";

// Extension state
interface ExtensionState {
	client: LightpandaClient | null;
	enabledAsDefault: boolean;
	binaryPath: string | null;
}

const state: ExtensionState = {
	client: null,
	enabledAsDefault: false,
	binaryPath: null,
};

/**
 * Search the web using Lightpanda browser
 */
async function searchWithLightpanda(
	pi: ExtensionAPI,
	query: string,
	signal: AbortSignal | undefined,
	format: "markdown" | "structured" = "markdown",
	maxResults = 10,
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

		// Use pi.exec() instead of child_process.spawn.
		// Pass signal through so mid-execution aborts kill the lightpanda process.
		const result = await pi.exec(binaryPath, args, {
			timeout: TIMEOUT_MS,
			signal,
		});

		// Propagate lightpanda failures to the LLM instead of silently returning
		// empty results — a non-zero exit with no stdout means the fetch failed
		// (network error, bad URL, crashed process) and the LLM needs to see why.
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
				if (ctx.hasUI) {
					ctx.ui.notify(getInstallInstructions(), "warning");
				}
				// Disable default search if enabled
				if (state.enabledAsDefault) {
					state.enabledAsDefault = false;
					if (ctx.hasUI) {
						ctx.ui.notify("Lightpanda default search disabled (binary not found)", "warning");
					}
				}
			} else {
				if (ctx.hasUI) {
					ctx.ui.notify(
						`Lightpanda init error: ${error instanceof Error ? error.message : String(error)}`,
						"error",
					);
				}
			}
		}
	});

	// Register search tool
	const searchTool = defineTool({
		name: "search_web",
		label: "Search Web",
		description:
			"Search the web using Lightpanda headless browser. Returns clean Markdown or structured JSON results. Single-shot: this tool does not paginate. If the output is truncated, refine the query or lower max_results — do not call the tool again expecting a 'next page'.",
		promptSnippet: "Search the web for current information",
		promptGuidelines: [
			"Use this tool when you need current information from the web",
			"Prefer markdown format for reading content",
			"Use structured format when you need to extract specific data fields",
			"If the result ends with a truncation notice, the output was cut because it exceeded the 50KB/2000-line safety limit. Refine the query to be more specific or lower max_results — calling the tool again with the same arguments will return the same truncated output.",
		],
		parameters: Type.Object({
			query: Type.String({ description: "Search query" }),
			format: Type.Optional(
				StringEnum(["markdown", "structured"] as const, { description: "Output format" }),
			),
			max_results: Type.Optional(
				Type.Number({ description: "Maximum results (1-50, default 10)" }),
			),
		}),

		async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
			const result = await searchWithLightpanda(
				pi,
				params.query,
				signal,
				params.format ?? "markdown",
				params.max_results ?? 10,
			);

			// Safety-net truncation: keep the TOP of the content (most-relevant results).
			// truncateHead keeps the first N lines/bytes; truncateTail would keep the bottom
			// (footer / low-ranked results), which is exactly wrong for ranked search output.
			const truncated = truncateHead(result.content, { maxBytes: 50000, maxLines: 2000 });

			// Surface truncation to the LLM. Without this, the model would silently assume
			// the truncated output is the full answer and never think to refine the query.
			let text = truncated.content;
			if (truncated.truncated) {
				const limit = truncated.truncatedBy === "bytes" ? "byte" : "line";
				text += `\n\n⚠️ Output truncated: showing ${truncated.outputLines}/${truncated.totalLines} lines, ${truncated.outputBytes}/${truncated.totalBytes} bytes (${limit} limit hit). This tool does not paginate — call search_web again with a more specific query or a smaller max_results to get a complete answer.`;
			}

			return {
				content: [{ type: "text", text }],
				details: {
					...result.details,
					truncated: truncated.truncated,
					truncatedBy: truncated.truncatedBy,
					totalLines: truncated.totalLines,
					totalBytes: truncated.totalBytes,
					outputLines: truncated.outputLines,
					outputBytes: truncated.outputBytes,
				},
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
			if (ctx.hasUI) {
				ctx.ui.notify(`Lightpanda default search ${status}`, "info");
			}
		},
	});

	// Hook into default search if enabled (checked at runtime, not load time)
	pi.on("before_agent_start", async (event) => {
		if (!state.enabledAsDefault) return;

		// Check if this is a search query
		const searchKeywords = ["search", "find", "look up", "google", "what is", "who is"];
		const isSearchQuery = searchKeywords.some((kw) => event.prompt.toLowerCase().includes(kw));

		if (isSearchQuery && state.client) {
			// Could inject search result here
			// For now, just log
			console.log(`[Lightpanda] Search query detected: ${event.prompt}`);
		}
	});

	// Cleanup on shutdown
	pi.on("session_shutdown", async () => {
		state.client = null;
		state.binaryPath = null;
	});
}
