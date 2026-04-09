/**
 * Search orchestrator - builds URLs and coordinates search flow
 */

export interface SearchResultItem {
	title: string;
	url: string;
	snippet: string;
}

/**
 * Build DuckDuckGo Lite search URL
 */
export function buildSearchUrl(query: string): string {
	const encoded = encodeURIComponent(query);
	return `https://lite.duckduckgo.com/lite/?q=${encoded}`;
}

/**
 * Truncate results to max count
 */
export function truncateResults<T>(results: T[], max: number): T[] {
	return results.slice(0, max);
}
