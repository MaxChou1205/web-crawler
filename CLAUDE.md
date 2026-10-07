# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A one-shot Taiwanese real-estate listing crawler. Each run scrapes new house listings from several agency sites, stores unseen ones in MongoDB, and pushes them to LINE users as Flex carousel messages. It runs hourly via GitHub Actions (`.github/workflows/cron-job.yml`), not as a long-lived process — `node-cron` is a dependency but unused.

## Commands

- `npm run dev` — dry run (`DRY_RUN=1`): opens a visible (non-headless) browser and skips DB inserts. LINE messages are **still sent** if new items are found.
- `npm start` / `node index.js` — production run.
- No tests, linter, or build step.

Env vars (see `.env.example`): `DATABASE` (Mongo URI), `CHANNEL_ACCESS_TOKEN` (LINE Messaging API), `USER_ID` (comma-separated LINE user IDs for multicast), `DRY_RUN`. In Docker, `NODE_ENV=production` makes Puppeteer use `PUPPETEER_EXECUTABLE_PATH` (system chromium).

Lockfiles for npm (CI uses `npm install`), pnpm (Dockerfile), and bun all exist.

## Architecture

`index.js` holds everything except DOM extraction:

1. Connect Mongo → launch one shared Puppeteer browser.
2. Run `fetchYungChing`, `fetchSinyi`, `fetchCt`, `fetchLand591` concurrently with `Promise.allSettled` (a failing site doesn't abort others). `fetchHb` exists but is commented out.
3. Each `fetchX` follows the same copy-pasted pattern: load all docs from its collection, open a page with request interception (blocking fonts/images/css/scripts to speed up), loop over hard-coded regions × 2 pages with search filters baked into the URL (price 800–2500萬, 新店區/文山區), call the site's `extractData`, filter out items whose `link` already exists in the DB, `insertMany` the new ones (unless dry run), and append them to a shared `messages` array.
4. `finally`: close browser, `sendMessage` multicasts `messages` in batches of 12 (Flex carousel limit) via `flexTemplate.js`, close Mongo.

`pageParser_<site>.js` — each exports `extractData(page)` that runs `page.evaluate` with site-specific CSS selectors and returns objects shaped like the shared schema: `{ image, link, title, price, location, description, details[], tags[] }`. `flexTemplate.js` renders `image`, `link`, `title`, `details`, `price` only. `pageParser_hb.js` additionally has `setSearchCondition`/`nextPage` form-driving helpers.

`model/houseData.js` — one mongoose schema reused for a separate collection per site (`house_yungching`, `house_sinyi`, ...). Deduplication is by `link` string equality, so changing how a site's `link` is built will cause every existing listing to be re-sent as new.

## Gotchas

- Selectors break when sites redesign; sinyi uses hashed CSS-module class names matched via `[class*='...']`.
- ct waits for its `/api/house_list.ashx` XHR (with `retry`) before extracting.
- Some sites (sinyi via `__NEXT_DATA__`, 591 via `__NUXT__`) server-render their listing data, so plain `fetch` + JSON parsing is a possible replacement for Puppeteer there.
