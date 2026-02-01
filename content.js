const STYLES = `
.spizzo-container {
}

.spizzo-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 99999;
  background-color: #dfe8ff;
  border: 1px solid black;
  border-radius: .25rem;
  padding: .25rem;
  font-size: .75rem;
  line-height: 1;
  font-weight: 600;
}
`;

const injectStyles = () => {
  const style = document.createElement("style");
  style.textContent = STYLES;
  document.head.appendChild(style);
};

const PRICE_SELECTOR = "span.oar-quote-last";
const GRID_CONTAINER_SELECTOR = "div.ag-center-cols-container[data-ref='eContainer']";
const STRIKE_CELL_SELECTOR = "div[col-id='strike']";
const DATA_ATTR_PROCESSED = "data-strike-highlighted";
const EXPIRATION_GROUP_SELECTOR = "div.ag-row[row-index][row-id^='row-group-expirationData-']";

const getCurrentPrice = () => {
  const el = document.querySelector(PRICE_SELECTOR);
  if (!el) return NaN;
  return parseFloat(el.textContent.replace("$", "").trim());
};

const getAnnualPutYield = (optionPrice, strikePrice, daysToExpire) => {
  const directYield = optionPrice / strikePrice;
  return directYield * 365 / daysToExpire;
}

const getAnnualCallYield = (optionPrice, stockPrice, daysToExpire) => {
  const directYield = optionPrice / stockPrice;
  return directYield * 365 / daysToExpire;
}

const parseExpirationHeaders = () => {
  const headers = document.querySelectorAll(EXPIRATION_GROUP_SELECTOR);
  const expirations = [];

  for (const header of headers) {
    const rowIndex = parseInt(header.getAttribute("row-index"), 10);
    const rowId = header.getAttribute("row-id");
    // row-id format: "row-group-expirationData-Mar 20, 2026 (M)|in 49 days"
    const dataStr = rowId.replace("row-group-expirationData-", "");
    const [datePart, daysPart] = dataStr.split("|");

    const dateClean = datePart.replace(/\s*\([^)]*\)\s*$/, "").trim();
    const expirationDate = new Date(dateClean);

    const daysMatch = daysPart.match(/(\d+)/);
    const expirationDays = daysMatch ? parseInt(daysMatch[1], 10) : NaN;

    expirations.push({ rowIndex, expirationDate, expirationDays });
  }

  expirations.sort((a, b) => a.rowIndex - b.rowIndex);
  return expirations;
};

const findExpiration = (rowIndex, expirations) => {
  let result = null;
  for (const exp of expirations) {
    if (exp.rowIndex < rowIndex) {
      result = exp;
    } else {
      break;
    }
  }
  return result;
};

const findPutBidPrice = (node) => {
  const cell = node.parentNode.querySelector('[col-id="putBid"] [data-cy="bidCell"] b');
  if (!cell) return undefined;
  return parseFloat(cell.textContent.trim());
};

const findCallBidPrice = (node) => {
  const cell = node.parentNode.querySelector('[col-id="callBid"] [data-cy="bidCell"] b');
  if (!cell) return undefined;
  return parseFloat(cell.textContent.trim());
};

const processRow = (row, currentPrice, expirations) => {
  const strikeCell = row.querySelector(STRIKE_CELL_SELECTOR);
  if (!strikeCell) return;

  if (strikeCell.getAttribute(DATA_ATTR_PROCESSED) === "true") return;

  strikeCell.setAttribute(DATA_ATTR_PROCESSED, "true");

  const strikeValue = parseFloat(strikeCell.textContent.replace("$", "").trim());
  if (isNaN(strikeValue)) return;

  const rowIndex = parseInt(row.getAttribute("row-index"), 10);
  if (isNaN(rowIndex)) return;

  const expiration = findExpiration(rowIndex, expirations);
  if (!expiration) return;

  const isoDate = expiration.expirationDate.toISOString().split("T")[0];
  strikeCell.setAttribute("data-expiration-date", isoDate);
  strikeCell.setAttribute("data-expiration-days", String(expiration.expirationDays));

  const putPrice = findPutBidPrice(strikeCell);
  const callPrice = findCallBidPrice(strikeCell);
  if (strikeValue < currentPrice && putPrice) {
    const target = strikeCell.parentNode.querySelector('[col-id="putChange"]');
    if (!target) return;

    target.classList.add("spizzo-container");
    const overlay = document.createElement("div");
    overlay.className = "spizzo-overlay spizzo-overlay-put";
    const rate = getAnnualPutYield(putPrice, strikeValue, expiration.expirationDays);
    overlay.textContent = (rate * 100).toFixed(2) + '%';
    target.appendChild(overlay);
  } else if (strikeValue > currentPrice && callPrice) {
    const target = strikeCell.parentNode.querySelector('[col-id="callChange"]');
    if (!target) return;

    target.classList.add("spizzo-container");
    const overlay = document.createElement("div");
    overlay.className = "spizzo-overlay spizzo-overlay-call";
    const rate = getAnnualCallYield(callPrice, currentPrice, expiration.expirationDays);
    overlay.textContent = (rate * 100).toFixed(2) + '%';
    target.appendChild(overlay);
  }
};

const removeOverlays = (container) => {
  container.querySelectorAll(`[${DATA_ATTR_PROCESSED}]`).forEach((el) => {
    el.removeAttribute(DATA_ATTR_PROCESSED);
  });
  container.querySelectorAll(".spizzo-overlay").forEach((el) => el.remove());
  container.querySelectorAll(".spizzo-container").forEach((el) => {
    el.classList.remove("spizzo-container");
  });
};

const observeGrid = (container) => {
  let debounceTimer = null;

  const processAllRows = () => {
    const currentPrice = getCurrentPrice();
    if (isNaN(currentPrice)) return;
    const expirations = parseExpirationHeaders();
    container.querySelectorAll("div.ag-row").forEach((row) => {
      processRow(row, currentPrice, expirations);
    });
  };

  const connect = () => {
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  };

  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      observer.disconnect();
      removeOverlays(container);
      processAllRows();
      connect();
    }, 100);
  });

  processAllRows();
  connect();

  return observer;
};

const waitForElements = () =>
  new Promise((resolve, reject) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = () => {
      attempts++;
      const priceEl = document.querySelector(PRICE_SELECTOR);
      const gridEl = document.querySelector(GRID_CONTAINER_SELECTOR);

      if (priceEl && gridEl) {
        resolve({ priceEl, gridEl });
        return;
      }

      if (attempts >= maxAttempts) {
        reject(new Error("Timed out waiting for options page elements"));
        return;
      }

      setTimeout(poll, 500);
    };

    poll();
  });

const init = async () => {
  injectStyles();
  try {
    let gridEl = (await waitForElements()).gridEl;
    const currentPrice = getCurrentPrice();
    if (isNaN(currentPrice)) {
      console.warn("💥💥💥 Options Research Extension: Could not read current price");
      return;
    }
    let gridObserver = observeGrid(gridEl);

    // Watch for grid container being replaced entirely (full AJAX re-render)
    new MutationObserver(() => {
      if (!document.contains(gridEl)) {
        const newGridEl = document.querySelector(GRID_CONTAINER_SELECTOR);
        if (newGridEl) {
          gridObserver.disconnect();
          gridEl = newGridEl;
          console.log("🐇 Grid container replaced, re-initializing overlays");
          gridObserver = observeGrid(newGridEl);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
    console.info("🐇🐇🐇 Options Research Extension: init() successful");
  } catch (err) {
    console.warn("💥💥💥 Options Research Extension:", err.message);
  }
};

init();
