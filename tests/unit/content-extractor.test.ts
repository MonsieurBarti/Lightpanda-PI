import { describe, expect, test } from "vitest";
import { parseToStructured } from "../../src/content-extractor";

describe("content-extractor", () => {
	describe("parseToStructured", () => {
		test("parses markdown with headings and links", () => {
			const markdown = `
# Search Results

## Example Site
https://example.com
This is a description of the example site.

## Another Site  
https://another.com
Another description here.
`;
			const results = parseToStructured(markdown);
			expect(results).toHaveLength(2);
			expect(results[0].title).toBe("Example Site");
			expect(results[0].url).toBe("https://example.com");
			expect(results[0].snippet).toContain("This is a description");
		});

		test("handles empty input", () => {
			const results = parseToStructured("");
			expect(results).toEqual([]);
		});

		test("extracts URLs from markdown links", () => {
			const markdown = `
## [Linked Title](https://linked.com)
Snippet text here.
`;
			const results = parseToStructured(markdown);
			expect(results).toHaveLength(1);
			expect(results[0].title).toBe("Linked Title");
			expect(results[0].url).toBe("https://linked.com");
		});
	});
});
