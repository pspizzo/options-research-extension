# options-research-extension
> Browser extension for custom option-chain research tools in Fidelity

## Features

- When viewing an option chain for a security, the "Change" column is replaced by annualized rate-of-return values for selling cash-covered puts and covered calls.
 - For puts, the rate is calculated using the most recent bid, strike price, and number of days remaining
 - For calls, the rate is calculated using the most recent bid, current stock price, and number of days remaining

