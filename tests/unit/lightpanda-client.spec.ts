import { describe, expect, test, vi } from "vitest";
import { LightpandaNotFoundError } from "../../src/error-handler";
import { LightpandaClient } from "../../src/lightpanda-client";

describe("LightpandaClient", () => {
	describe("buildSpawnArgs", () => {
		test("returns correct CDP server args", () => {
			const client = new LightpandaClient();
			const args = client.buildSpawnArgs();
			expect(args).toContain("--cdp");
			expect(args).toContain("--host=127.0.0.1");
			expect(args).toContain("--port=9222");
		});

		test("uses custom port when specified", () => {
			const client = new LightpandaClient({ port: 9999 });
			const args = client.buildSpawnArgs();
			expect(args).toContain("--port=9999");
		});
	});

	describe("getCDPUrl", () => {
		test("returns correct WebSocket URL", () => {
			const client = new LightpandaClient();
			const url = client.getCDPUrl();
			expect(url).toBe("ws://127.0.0.1:9222");
		});

		test("returns URL with custom port", () => {
			const client = new LightpandaClient({ port: 9999 });
			const url = client.getCDPUrl();
			expect(url).toBe("ws://127.0.0.1:9999");
		});
	});

	describe("parseMarkdownDump", () => {
		test("extracts content from markdown dump output", () => {
			const client = new LightpandaClient();
			const output = `Some header info

# Search Results

## Result 1
Title: Example
URL: https://example.com
Snippet: This is an example result.
`;
			const result = client.parseMarkdownDump(output);
			expect(result).toContain("# Search Results");
			expect(result).toContain("## Result 1");
		});
	});

	describe("detectBinary", () => {
		test("returns LIGHTPANDA_PATH env var when set", () => {
			const originalEnv = process.env.LIGHTPANDA_PATH;
			process.env.LIGHTPANDA_PATH = "/custom/path/to/lightpanda";

			const client = new LightpandaClient();
			const result = client.detectBinarySync();
			expect(result).toBe("/custom/path/to/lightpanda");

			// Restore env. Note: `process.env.X = undefined` coerces to the
			// STRING "undefined" (process.env stringifies all assignments), so
			// we must delete the property to clear it.
			if (originalEnv) {
				process.env.LIGHTPANDA_PATH = originalEnv;
			} else {
				Reflect.deleteProperty(process.env, "LIGHTPANDA_PATH");
			}
		});

		test("throws LightpandaNotFoundError when binary not found", () => {
			const originalEnv = process.env.LIGHTPANDA_PATH;
			// Must delete — not assign undefined — because process.env coerces
			// undefined to the string "undefined" which detectBinarySync's
			// truthy check would then happily return as the binary path.
			Reflect.deleteProperty(process.env, "LIGHTPANDA_PATH");

			// Mock execSync to throw
			const client = new LightpandaClient();
			client.setExecSyncFn(() => {
				throw new Error("not found");
			});

			expect(() => client.detectBinarySync()).toThrow(LightpandaNotFoundError);

			// Restore env
			if (originalEnv) {
				process.env.LIGHTPANDA_PATH = originalEnv;
			}
		});
	});
});
