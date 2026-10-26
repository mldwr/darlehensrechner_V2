# Cloudflare Pages Deployment Guide

This guide outlines the steps to deploy the Darlehensrechner (loan calculator) — a Vite + Svelte static site — to Cloudflare Pages using Wrangler.

## Prerequisites

- A Cloudflare account.
- Node.js and npm installed.

## Setup Instructions

### 1. Install Dependencies

Wrangler is included as a development dependency. After cloning the repo, install all dependencies:

```bash
npm install
```

### 2. Login to Cloudflare

Authenticate Wrangler with your Cloudflare account. This command will open a browser window to authorize:

```bash
npx wrangler login
```

### 3. Configure Wrangler

The project's `wrangler.jsonc` defines the deployment settings:

```jsonc
{
  "name": "darlehensrechner-v2",
  "compatibility_date": "2026-10-26",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  },
  "observability": {
    "enabled": true
  }
}
```

- `assets.directory` points to `./dist`, which is Vite's build output.
- `not_found_handling` set to `single-page-application` serves `index.html` for unknown routes, which is appropriate for this single-page app.

*Note: If you rename the build output folder, update `assets.directory` accordingly.*

## Deploying

A `deploy` script is defined in `package.json` that builds the project and then deploys:

```bash
npm run deploy
```

This runs `vite build` followed by `wrangler deploy`. On the first run, Wrangler may ask you to confirm the creation of the project in your Cloudflare account.
