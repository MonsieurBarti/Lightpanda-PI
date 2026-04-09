import { describe, expect, test } from "vitest";
import {
	LightpandaNotFoundError,
	SearchError,
	getInstallInstructions,
} from "../../src/error-handler";

describe("error-handler", () => {
	describe("getInstallInstructions", () => {
		test("returns formatted installation message", () => {
			const instructions = getInstallInstructions();
			expect(instructions).toContain("Lightpanda not found");
			expect(instructions).toContain("curl -fsSL https://pkg.lightpanda.io/install.sh");
			expect(instructions).toContain("github.com/lightpanda-io/browser");
			expect(instructions).toContain("lightpanda.io/docs/open-source/installation");
		});
	});

	describe("LightpandaNotFoundError", () => {
		test("creates error with install instructions", () => {
			const error = new LightpandaNotFoundError();
			expect(error.message).toContain("Lightpanda not found");
			expect(error.name).toBe("LightpandaNotFoundError");
			expect(error.message).toContain("curl -fsSL");
		});

		test("includes custom message when provided", () => {
			const error = new LightpandaNotFoundError("Custom prefix message");
			expect(error.message).toContain("Custom prefix message");
			expect(error.message).toContain("Lightpanda not found");
		});
	});

	describe("SearchError", () => {
		test("creates generic search error", () => {
			const error = new SearchError("Something went wrong");
			expect(error.message).toBe("Something went wrong");
			expect(error.name).toBe("SearchError");
		});
	});
});
