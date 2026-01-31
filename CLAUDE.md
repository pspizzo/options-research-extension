# CLAUDE.md

## Project Overview

Firefox browser extension ("Fidelity Options Research Tools") that enhances Fidelity's options research page (`https://digital.fidelity.com/ftgw/digital/options-research/*`) with annualized yield calculations for puts and calls. Single content script injected at `document_idle`.

## Architecture

**Single-file extension** — all logic lives in `content.js` (no build system, no dependencies, no bundler).

- **Manifest V2** (`manifest.json`) — content script auto-injected on matching Fidelity URLs
- **`content.js`** — functional JavaScript organized as:
  - **Constants** — CSS styles and DOM selectors (SCREAMING_SNAKE_CASE)
  - **Initialization** — `init()` → `waitForElements()` (Promise-based polling, 60 attempts × 500ms) → `observeGrid()`
  - **DOM parsing** — `getCurrentPrice()`, `parseExpirationHeaders()`, `findPutBidPrice()`, `findCallBidPrice()`
  - **Yield math** — `getAnnualPutYield()`, `getAnnualCallYield()`
  - **Row processing** — `processRow()` creates overlay divs with yield percentages
  - **Live updates** — `MutationObserver` on the AG-Grid container reprocesses rows on DOM changes

The extension targets AG-Grid components on Fidelity's page. Key selectors: `span.oar-quote-last` (stock price), `div.ag-center-cols-container[data-ref='eContainer']` (grid), `div[col-id='strike']` (strike cells). Processed rows are marked with `data-strike-highlighted` to prevent duplicates.

## Development

No build step, no tests, no linter. To develop:

1. Load as a temporary extension in Firefox (`about:debugging` → Load Temporary Add-on → select `manifest.json`)
2. Navigate to a Fidelity options page (e.g., `https://digital.fidelity.com/ftgw/digital/options-research/?symbol=XOM`)
3. Edit `content.js`, reload the extension, refresh the page

## Conventions

- Functional style — no classes, pure functions where possible
- CSS classes prefixed with `spizzo-` (`.spizzo-container`, `.spizzo-overlay`, `.spizzo-overlay-put`, `.spizzo-overlay-call`)
- Console logging uses emoji prefixes: `💥💥💥` for errors, '🐇' for info
- `prompts/` directory contains the incremental feature specs used to build the extension
- `reference/example.html` is a captured Fidelity page for offline development reference
