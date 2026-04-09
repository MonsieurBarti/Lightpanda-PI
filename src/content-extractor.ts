/**
 * Content extractor - parses Markdown into structured data
 */

import type { SearchResultItem } from "./search-orchestrator";

/**
 * Parse markdown search results into structured format
 */
export function parseToStructured(markdown: string): SearchResultItem[] {
	const results: SearchResultItem[] = [];

	if (!markdown.trim()) {
		return results;
	}

	// Split by headings (## or ###)
	const sections = markdown.split(/^#{2,3}\s+/m).slice(1);

	for (const section of sections) {
		const lines = section.trim().split("\n");
		if (lines.length === 0) continue;

		// First line is the title (may contain markdown link)
		const titleLine = lines[0].trim();
		let title = titleLine;
		let url = "";

		// Extract URL from markdown link [title](url)
		const linkMatch = titleLine.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
		if (linkMatch) {
			title = linkMatch[1];
			url = linkMatch[2];
		} else {
			// Look for URL on next line
			if (lines[1]?.startsWith("http")) {
				url = lines[1].trim();
			}
		}

		// Remaining lines form the snippet
		const snippetLines = lines.slice(linkMatch ? 1 : url ? 2 : 1).filter((line) => line.trim());
		const snippet = snippetLines.join(" ").slice(0, 300);

		if (title && (url || snippet)) {
			results.push({
				title: title.slice(0, 200),
				url: url.slice(0, 500),
				snippet: snippet || "No description available",
			});
		}
	}

	return results;
}
