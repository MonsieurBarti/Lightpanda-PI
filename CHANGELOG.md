# Changelog

## [0.2.1](https://github.com/MonsieurBarti/Lightpanda-PI/compare/lightpanda-pi-v0.2.0...lightpanda-pi-v0.2.1) (2026-04-11)


### Features

* add read-only classification to search tool prompt guidelines ([#21](https://github.com/MonsieurBarti/Lightpanda-PI/issues/21)) ([b1e76b5](https://github.com/MonsieurBarti/Lightpanda-PI/commit/b1e76b544fa6e41df0912cd5cb65d6dc0dbbfe7f))

## [0.2.0](https://github.com/MonsieurBarti/Lightpanda-PI/compare/lightpanda-pi-v0.1.3...lightpanda-pi-v0.2.0) (2026-04-09)


### ⚠ BREAKING CHANGES

* any saved prompts, skills, or slash-command templates that hardcode the old tool id (`search_web`) must be updated. Live LLM sessions pick up the new name automatically from the registered tool list.

### Code Refactoring

* namespace tool id as tff-search_web + baseline fixes ([#18](https://github.com/MonsieurBarti/Lightpanda-PI/issues/18)) ([4f4a444](https://github.com/MonsieurBarti/Lightpanda-PI/commit/4f4a444e1f92c5a69074384b1cd096fa6f8852fe))

## [0.1.3](https://github.com/MonsieurBarti/Lightpanda-PI/compare/lightpanda-pi-v0.1.2...lightpanda-pi-v0.1.3) (2026-04-09)


### Bug Fixes

* apply GSD extension skill guidelines ([#16](https://github.com/MonsieurBarti/Lightpanda-PI/issues/16)) ([c3bbb85](https://github.com/MonsieurBarti/Lightpanda-PI/commit/c3bbb85240dbea69c2ff32bf42cee65ede2ce102))

## [0.1.2](https://github.com/MonsieurBarti/Lightpanda-PI/compare/lightpanda-pi-v0.1.1...lightpanda-pi-v0.1.2) (2026-04-09)


### Bug Fixes

* point pi.extensions to dist/index.js ([#14](https://github.com/MonsieurBarti/Lightpanda-PI/issues/14)) ([1439b60](https://github.com/MonsieurBarti/Lightpanda-PI/commit/1439b6041418e802ae8e7b488f412e9860069811))

## [0.1.1](https://github.com/MonsieurBarti/Lightpanda-PI/compare/lightpanda-pi-v0.1.0...lightpanda-pi-v0.1.1) (2026-04-09)


### Bug Fixes

* **release:** use NPM_CONFIG_TOKEN for bun publish auth ([#8](https://github.com/MonsieurBarti/Lightpanda-PI/issues/8)) ([99a7671](https://github.com/MonsieurBarti/Lightpanda-PI/commit/99a7671c079f37c179cfb7aa0828953440b6bfd8))

## [0.1.0](https://github.com/MonsieurBarti/Lightpanda-PI/compare/lightpanda-pi-v0.1.0...lightpanda-pi-v0.1.0) (2026-04-09)


### Bug Fixes

* **release:** use NPM_CONFIG_TOKEN for bun publish auth ([#8](https://github.com/MonsieurBarti/Lightpanda-PI/issues/8)) ([99a7671](https://github.com/MonsieurBarti/Lightpanda-PI/commit/99a7671c079f37c179cfb7aa0828953440b6bfd8))

## [0.1.0](https://github.com/MonsieurBarti/Lightpanda-PI/compare/lightpanda-pi-v0.1.0...lightpanda-pi-v0.1.0) (2026-04-09)


### Features

* lightpanda web search extension v0.1.0 ([#2](https://github.com/MonsieurBarti/Lightpanda-PI/issues/2)) ([c372f0b](https://github.com/MonsieurBarti/Lightpanda-PI/commit/c372f0b3d63adcbf96f4b611865c850a5752d5c2))


### Bug Fixes

* **release:** use manifest mode and pin first release to 0.1.0 ([#6](https://github.com/MonsieurBarti/Lightpanda-PI/issues/6)) ([48e4faa](https://github.com/MonsieurBarti/Lightpanda-PI/commit/48e4faa90f6ca8aaa6bafa8093fd34b1525dd033))
