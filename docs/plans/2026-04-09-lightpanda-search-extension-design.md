# Lightpanda Web Search PI Extension - Design Document

**Date:** 2026-04-09  
**Status:** Design Complete  
**Phase:** Ready for Implementation

---

## Overview

A PI extension that uses **Lightpanda** (AI-native headless browser built in Zig) as the native web search tool. Provides fast, low-memory web searches with clean Markdown/structured output.

**Key Decisions:**
- **Local Lightpanda only** — no cloud fallback
- **Markdown as default output** — clean, token-efficient, preserves structure
- **Structured JSON mode** — for programmatic data extraction
- **Both explicit tool + default override toggle**

---

## What is Lightpanda?

- AI-native headless browser built from scratch in Zig (not a Chrome fork)
- 10× faster, 16× less memory than Chrome headless
- CDP-compatible (works with Playwright/Puppeteer)
- Native Markdown/AXTree export (`--dump-mode=markdown`)
- Instant startup, multi-client support
- Open source (AGPL-3.0)

**Documentation:** https://lightpanda.io/docs/

---

## Architecture

### Components

```
┌─────────────────┐
│   PI Extension  │
│  ┌───────────┐  │
│  │  Config   │  │  lightpanda_search.enabled_as_default: boolean
│  │   Hook    │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ search_web │  │  Tool: query, format, max_results
│  │   Tool    │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
┌────────▼────────┐
│  Lightpanda    │
│    Client      │
│  ┌───────────┐  │
│  │  Binary   │  │  spawns: lightpanda --cdp --host=127.0.0.1 --port=9222
│  │   Check   │  │  connection: CDP WebSocket (ws://127.0.0.1:9222)
│  └─────┬─────┘  │
│  ┌─────▼─────┐  │
│  │   CDP     │  │  commands: Target.createTarget, Page.navigate,
│  │  Session  │  │           Runtime.evaluate, custom Markdown export
│  └───────────┘  │
└─────────────────┘
```

### Data Flow

```
User Query → PI Extension → Lightpanda Client → CDP Server → DuckDuckGo HTML
     ↑                                                           ↓
     └──────── Markdown/Structured Results ←──── Page Content ←─┘
```

---

## Implementation Details

### Tool Registration: `search_web`

```typescript
interface SearchWebParams {
  query: string;
  format?: "markdown" | "structured";  // default: "markdown"
  max_results?: number;                 // default: 10
}

interface SearchWebResult {
  content: string;      // Markdown or JSON string
  source: string;       // URL searched
  format: "markdown" | "structured";
}
```

### Search Provider

**Default:** DuckDuckGo HTML (no JavaScript required, fast)
```
https://html.duckduckgo.com/html/?q={encoded_query}
```

**Rationale:** Avoids JavaScript-heavy Google, respects rate limits, returns clean results.

### Lightpanda Commands

1. **Spawn:** `lightpanda --cdp --host=127.0.0.1 --port=9222`
2. **Connect:** WebSocket to `ws://127.0.0.1:9222`
3. **Search Tab:** CDP `Target.createTarget` → `Page.navigate`
4. **Wait:** CDP `Runtime.evaluate` for `document.readyState === 'complete'`
5. **Extract:** Lightpanda custom command for Markdown export (or DOM scraping)
6. **Cleanup:** Close tab, keep browser running for reuse

### Configuration

```json
{
  "lightpanda_search": {
    "enabled_as_default": false,     // When true, overrides PI's default search
    "binary_path": "lightpanda",      // Or full path to binary
    "port": 9222,
    "obey_robots": true,              // Pass --obey-robots flag
    "search_provider": "duckduckgo"   // Future: google, bing, etc.
  }
}
```

---

## Output Formats

### Markdown (default)

Clean, structured text with headings, links, lists preserved. Ideal for LLM consumption.

Example:
```markdown
# Zig Best Practices - Search Results

## result 1: ziglang.org/documentation/master
Zig Documentation — Learn about Zig's build system, syntax, and standard library.

## result 2: github.com/ziglang/zig/wiki/FAQ
Zig FAQ — Common questions about memory management, comptime, and more.
```

### Structured

JSON array of search results:
```json
{
  "results": [
    {
      "title": "Zig Documentation",
      "url": "https://ziglang.org/documentation/master",
      "snippet": "Learn about Zig's build system, syntax..."
    }
  ],
  "query": "zig best practices",
  "total_found": 10
}
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| **Binary not found** | Log install instructions, disable `enabled_as_default`, return error with install command |
| **Timeout (>30s)** | Return error, suggest checking connection |
| **HTTP error** | Return structured error with status code |
| **Empty extraction** | Fallback to raw HTML, log warning |
| **Browser crash** | Auto-restart (max 3), then fail gracefully |
| **Rate limit** | Add 2s delay + retry once, then error |

### Binary Not Found Message

```
⚠️  Lightpanda not found in PATH

Install locally:
  curl -fsSL https://pkg.lightpanda.io/install.sh | bash

Or build from source:
  git clone https://github.com/lightpanda-io/browser
  cd browser && zig build

See: https://lightpanda.io/docs/open-source/installation
```

---

## Security & Ethics

- **robots.txt compliance:** Pass `--obey-robots` flag to Lightpanda
- **No persistent cookies:** Clean browser session per query
- **URL validation:** Reject `file://`, `localhost`, private IP ranges
- **Respectful scraping:** DuckDuckGo used to minimize load on any single service

---

## Testing Strategy

| Layer | Approach |
|-------|----------|
| **Unit** | Mock CDP WebSocket, test URL construction, test Markdown→JSON parsing |
| **Integration** | Real Lightpanda binary required. Test actual search, verify output format. Skip if binary missing. |
| **Manual** | Test `enabled_as_default` toggle, verify PI search behavior changes |

---

## Future Enhancements

1. **Multiple search providers** (Google, Bing via SerpAPI, etc.)
2. **Session persistence** (cookies for logged-in searches)
3. **Screenshot mode** for visual verification
4. **PDF extraction** for document search
5. **Parallel searches** for multiple queries

---

## Open Questions

None — design validated through brainstorming session.

---

## Next Steps

1. Set up isolated workspace for implementation
2. Create implementation plan with TDD approach
3. Build extension following PI extension patterns
