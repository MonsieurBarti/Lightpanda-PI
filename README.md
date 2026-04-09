<div align="center">
  <img src="https://raw.githubusercontent.com/MonsieurBarti/The-Forge-Flow-CC/refs/heads/main/assets/forge-banner.png" alt="The Forge Flow - Lightpanda Search Extension" width="100%">
  
  <h1>🔍 Lightpanda Search Extension</h1>
  
  <p>
    <strong>Web search for PI, powered by <a href="https://lightpanda.io/">Lightpanda</a></strong>
  </p>
  
  <p>
    <a href="https://github.com/MonsieurBarti/pi-lightpanda-search-extension/actions/workflows/ci.yml">
      <img src="https://img.shields.io/github/actions/workflow/status/MonsieurBarti/pi-lightpanda-search-extension/ci.yml?label=CI&style=flat-square" alt="CI Status">
    </a>
    <a href="https://www.npmjs.com/package/pi-lightpanda-search-extension">
      <img src="https://img.shields.io/npm/v/pi-lightpanda-search-extension?style=flat-square" alt="npm version">
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/github/license/MonsieurBarti/pi-lightpanda-search-extension?style=flat-square" alt="License">
    </a>
  </p>
</div>

---

## ✨ Features

- **⚡ Ultra-fast**: 10× faster than Chrome headless, 16× less memory
- **🧹 Clean output**: Markdown results without ads or clutter
- **🔧 Two modes**: Markdown for reading, structured JSON for data extraction
- **🖥️ Local-only**: No cloud APIs, no rate limits, no API keys
- **🤖 PI-native**: Seamless integration with PI's tool system

## 📦 Installation

### Prerequisites

Install Lightpanda locally:

```bash
# Quick install
curl -fsSL https://pkg.lightpanda.io/install.sh | bash

# Or build from source
git clone https://github.com/lightpanda-io/browser
cd browser && zig build
```

### Install Extension

```bash
# Via npm (when published)
npm install -g pi-lightpanda-search-extension

# Or copy to PI extensions
mkdir -p ~/.pi/agent/extensions
cp -r . ~/.pi/agent/extensions/lightpanda-search
cd ~/.pi/agent/extensions/lightpanda-search && bun install
```

Reload PI with `/reload`.

## 🚀 Usage

### As a Tool

The LLM can call `search_web`:

```typescript
search_web({
  query: "zig best practices 2024",
  format: "markdown",      // "markdown" or "structured"
  max_results: 10          // 1-50, default 10
})
```

### As Default Search

Toggle with `/toggle-lightpanda-search`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `LIGHTPANDA_PATH` | Custom path to lightpanda binary |

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  User Query │────▶│ search_web   │────▶│  Lightpanda │
└─────────────┘     │   Tool       │     │   fetch     │
                    └──────────────┘     └──────┬──────┘
                           │                     │
                           │              ┌──────▼──────┐
                           │              │ DuckDuckGo  │
                           │              │    Lite     │
                           │              └──────┬──────┘
                           │                     │
                    ┌──────▼──────┐              │
                    │   Markdown  │◀─────────────┘
                    │   Output    │
                    └─────────────┘
```

## 🧪 Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Lint & format
bun run check

# Build for publish
bun run build
```

## 📁 Project Structure

```
src/
├── index.ts              # Extension entry & tool registration
├── lightpanda-client.ts  # Binary detection & spawn logic
├── search-orchestrator.ts # URL building & result truncation
├── content-extractor.ts   # Markdown → structured parser
└── error-handler.ts       # Error messages & install help
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit with conventional commits (`git commit -m "feat: add something"`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📜 License

MIT © [MonsieurBarti](https://github.com/MonsieurBarti)

---

<div align="center">
  <sub>Built with ⚡ by <a href="https://github.com/MonsieurBarti">MonsieurBarti</a></sub>
</div>
