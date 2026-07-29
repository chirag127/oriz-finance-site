# Oriz Paisa — Finance tools

[![Stars](https://img.shields.io/github/stars/chirag127/finance?style=flat)](https://github.com/chirag127/finance/stargazers) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)


> SIP, EMI, FIRE, tax — calculators that show the math, run in your browser, and never see your inputs.

**Live at**: https://finance.oriz.in · **Status**: production

## What this is

A personal-finance toolkit for India. The math is the product — every calculator shows the formula it used, the assumptions it made, and the year-by-year breakdown. Inputs never leave your device.

## Per-feature inventory

| Feature | Status |
|---|---|
| SIP calculator | ✅ live |
| EMI calculator | ✅ live |
| Lumpsum | 🚧 WIP |
| Step-up SIP | 🚧 WIP |
| SWP | 🚧 WIP |
| CAGR / XIRR | 🚧 WIP |
| Goal planner | 🚧 WIP |
| FIRE calculator | 🚧 WIP |
| Home / car / personal / education loans | 🚧 WIP |
| Loan prepayment & comparison | 🚧 WIP |
| FD / RD / PPF / NPS / NSC / SSY | 🚧 WIP |
| Compound interest | 🚧 WIP |
| Take-home / TDS / HRA / gratuity / GST | 🚧 WIP |
| Markets dashboard (`/dashboard`) | 📜 planned |

## App-specific env vars

| Var | Purpose |
|---|---|
| `PUBLIC_ALPHA_VANTAGE_PROXY` | Public Worker URL the markets dashboard fetches from. Default: `https://av.oriz.workers.dev`. |

The Alpha Vantage API key itself lives only on the Worker as `ALPHA_VANTAGE_API_KEY` — never on the static site.

## Local dev

```bash
# from the workspace root (c:/D/oriz)
pnpm -F @chirag127/oriz-finance dev
```

## Knowledge

See [`./knowledge/`](./knowledge/) for app-specific decisions, runbooks, and services. Family rules / decisions / architecture live at the master repo's [`knowledge/`](../../../../knowledge/).

## License

MIT License. See master [`LICENSE`](../../../../LICENSE) — same terms across the family.
