# Streamr flag viewer

Shows recent flags and votes in the Streamr Network.

# Query params

- `network`: name of the supported network, eg. `polygon` or `amoy-testnet`
- `startDate`: by default, data is shown for the past 14 days. A different start date can be given in `yyyy-mm-dd` format.
- `endDate`: by default, data is shown up until the current time. A different end date (inclusive) can be given in `yyyy-mm-dd` format.

# Deployment

Every commit to `HEAD` is automatically deployed to https://flag-monitor.vercel.app