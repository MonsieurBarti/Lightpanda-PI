/**
 * Error classes and messages for Lightpanda search extension
 */

export const INSTALL_INSTRUCTIONS = `
⚠️  Lightpanda not found in PATH

Install locally:
  curl -fsSL https://pkg.lightpanda.io/install.sh | bash

Or build from source:
  git clone https://github.com/lightpanda-io/browser
  cd browser && zig build

See: https://lightpanda.io/docs/open-source/installation
`;

export function getInstallInstructions(): string {
	return INSTALL_INSTRUCTIONS.trim();
}

export class LightpandaNotFoundError extends Error {
	constructor(prefix = "") {
		const message = prefix ? `${prefix}\n${getInstallInstructions()}` : getInstallInstructions();
		super(message);
		this.name = "LightpandaNotFoundError";
	}
}

export class SearchTimeoutError extends Error {
	constructor(seconds: number) {
		super(`Search timed out after ${seconds}s. Please check your connection or try again.`);
		this.name = "SearchTimeoutError";
	}
}

export class SearchError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SearchError";
	}
}
