import { describe, expect, test } from "vitest";
import { buildSearchUrl, truncateResults } from "../../src/search-orchestrator";

describe("search-orchestrator", () => {
	describe("buildSearchUrl", () => {
		test("constructs DuckDuckGo Lite URL", () => {
			const url = buildSearchUrl("zig best practices");
			expect(url).toBe("https://lite.duckduckgo.com/lite/?q=zig%20best%20practices");
		});

		test("encodes special characters", () => {
			const url = buildSearchUrl("hello & world");
			expect(url).toContain("hello%20%26%20world");
		});
	});

	describe("truncateResults", () => {
		test("limits array to max results", () => {
			const results = [
				{ title: "A", url: "a.com", snippet: "..." },
				{ title: "B", url: "b.com", snippet: "..." },
				{ title: "C", url: "c.com", snippet: "..." },
			];
			const truncated = truncateResults(results, 2);
			expect(truncated).toHaveLength(2);
			expect(truncated[0].title).toBe("A");
			expect(truncated[1].title).toBe("B");
		});

		test("returns all if less than max", () => {
			const results = [{ title: "A", url: "a.com", snippet: "..." }];
			const truncated = truncateResults(results, 5);
			expect(truncated).toHaveLength(1);
		});
	});
});
