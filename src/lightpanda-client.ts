/**
 * Lightpanda CDP Client
 *
 * Manages the Lightpana browser process and CDP communication
 */

import { execSync } from "node:child_process";
import { LightpandaNotFoundError } from "./error-handler";

export interface LightpandaClientOptions {
	port?: number;
	host?: string;
}

export class LightpandaClient {
	private port: number;
	private host: string;
	private binaryPath: string | null = null;
	private execSyncFn: (command: string) => Buffer;

	constructor(options: LightpandaClientOptions = {}) {
		this.port = options.port ?? 9222;
		this.host = options.host ?? "127.0.0.1";
		this.execSyncFn = execSync;
	}

	/**
	 * Set a custom execSync function (for testing)
	 */
	setExecSyncFn(fn: (command: string) => Buffer): void {
		this.execSyncFn = fn;
	}

	/**
	 * Detect Lightpanda binary in PATH or from env var (sync version)
	 */
	detectBinarySync(): string {
		// Check env var first
		const envPath = process.env.LIGHTPANDA_PATH;
		if (envPath) {
			this.binaryPath = envPath;
			return envPath;
		}

		// Check if 'lightpanda' is in PATH
		try {
			const result = this.execSyncFn("which lightpanda");
			const path = result.toString().trim();
			if (path) {
				this.binaryPath = "lightpanda";
				return "lightpanda";
			}
		} catch {
			// Binary not found in PATH
		}

		throw new LightpandaNotFoundError();
	}

	/**
	 * Detect Lightpanda binary in PATH or from env var (async version)
	 */
	async detectBinary(): Promise<string> {
		return this.detectBinarySync();
	}

	/**
	 * Build spawn arguments for Lightpanda CDP server
	 */
	buildSpawnArgs(): string[] {
		return ["--cdp", `--host=${this.host}`, `--port=${this.port}`];
	}

	/**
	 * Get CDP WebSocket URL
	 */
	getCDPUrl(): string {
		return `ws://${this.host}:${this.port}`;
	}

	/**
	 * Parse markdown dump output from Lightpanda
	 */
	parseMarkdownDump(output: string): string {
		// Lightpanda's --dump-mode=markdown outputs clean markdown
		// For now, return the output as-is
		// Future: Could parse and clean up further
		return output.trim();
	}
}
