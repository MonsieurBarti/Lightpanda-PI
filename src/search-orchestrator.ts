/**
 * Search orchestrator - builds URLs and coordinates search flow
 *
 * Uses SearXNG public instances instead of DuckDuckGo Lite to avoid
 * headless-browser detection/captcha. Instances are tried in order;
 * the first one that returns real content wins.
 */

export interface SearchResultItem {
	title: string;
	url: string;
	snippet: string;
}

/**
 * SearXNG public instances that are tolerant of headless browsers.
 * Maintained as a list so we can rotate/failover when one blocks us.
 */
const SEARXNG_INSTANCES: string[] = [
	"https://searx.si",
	"https://paulgo.io",
	"https://search.sapti.com",
	"https://priv.au",
	"https://search.ononoki.ru",
];

/**
 * Build a SearXNG search URL for a given instance base.
 * SearXNG format: INSTANCE/search?q=QUERY&categories=general
 */
function buildSearXNGUrl(instance: string, query: string): string {
	const encoded = encodeURIComponent(query);
	return `${instance}/search?q=${encoded}&categories=general&language=auto`;
}

/**
 * Build the primary search URL (first instance in the list).
 * Exported for the main orchestrator flow.
 */
export function buildSearchUrl(query: string): string {
	const base = SEARXNG_INSTANCES[0];
	return buildSearXNGUrl(base, query);
}

/**
 * Generate all candidate URLs to try (for fallback logic).
 */
export function buildSearchUrls(query: string): string[] {
	return SEARXNG_INSTANCES.map((base) => buildSearXNGUrl(base, query));
}

/**
 * Truncate results to max count
 */
export function truncateResults<T>(results: T[], max: number): T[] {
	return results.slice(0, max);
}
