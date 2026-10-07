# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A one-shot Taiwanese real-estate listing crawler. Each run scrapes new house listings from several agency sites, stores unseen ones in MongoDB, and pushes them to LINE users as Flex carousel messages. It runs hourly via GitHub Actions (`.github/workflows/cron-job.yml`), not as a long-lived process — `node-cron` is a dependency but unused.

## Commands

- `npm run dev` — dry run (`DRY_RUN=1`): skips DB inserts. LINE messages are **still sent** if new items are found; to test end to end without sending, override the token: `DRY_RUN=1 CHANNEL_ACCESS_TOKEN=x USER_ID=x node index.js` (dotenv doesn't override existing env vars; expect 401s at the end).
- `npm start` / `node index.js` — production run.
- No tests, linter, or build step.

Env vars (see `.env.example`): `DATABASE` (Mongo URI), `CHANNEL_ACCESS_TOKEN` (LINE Messaging API), `USER_ID` (comma-separated LINE user IDs for multicast), `DRY_RUN`.

Lockfiles for npm (CI uses `npm install`), pnpm (Dockerfile), and bun all exist.

## Architecture

`index.js` holds the orchestration:

1. Connect Mongo.
2. Run `fetchYungChing`, `fetchSinyi`, `fetchCt`, `fetchLand591`, `fetchHb` concurrently with `Promise.allSettled` (a failing site is logged and doesn't abort others).
3. Each `fetchX` follows the same pattern: load all docs from its collection, loop over hard-coded regions × 2 pages with search filters baked into the URL (price 800–2500萬, 新店區/文山區), call the site's `fetchList`, drop items whose `link` is already in the DB or already seen this run, `insertMany` the new ones (unless dry run), and append them to a shared `messages` array.
4. `finally`: `sendMessage` multicasts `messages` in batches of 12 (Flex carousel limit) via `flexTemplate.js`, then closes Mongo.

`pageParser_<site>.js` — each exports `fetchList(...)` returning objects shaped like the shared schema: `{ image, link, title, price, location, description, details[], tags[] }`. `flexTemplate.js` renders only `image`, `link`, `title`, `details`, `price`. No browser is involved:

- **sinyi** — parses `__NEXT_DATA__` JSON (`props.initialReduxState.buyReducer.list`).
- **ct** — POSTs `{arg, page}` to `/api/house_list.ashx`; `arg` is the listing URL path after `/area/`.
- **yungching** — regex over Angular-SSR HTML, split on `search-result-list-item`. Its `ng-state` API payload is obfuscated, so don't bother with it.
- **591** — regex over Nuxt-SSR HTML (`__NUXT__` is a JS function, not JSON).
- `html.js` — shared `fetchHtml` (sets a browser UA) and regex helpers `one`/`all`/`text`. `all(html, cls, tag)` uses a non-greedy match to the first closing tag, so it's only reliable for elements without nested same-name tags.
- **hbhousing** — decodes Nuxt 3's `__NUXT_DATA__` (devalue format: a flat array of index references) and reads `buyHouseListDatas`; the `data` key is a per-request hash. Default sort is already newest first.

There is no headless browser anymore (Puppeteer was removed), so all fetching is plain Node `fetch`.

`model/houseData.js` — one mongoose schema reused for a separate collection per site (`house_yungching`, `house_sinyi`, ...). Deduplication is by `link` string equality, so changing how a site's `link` is built will cause every existing listing to be re-sent as new. ct's `https://buy.cthouse.com.tw//house/<id>.html` double slash is intentional — it matches what the old scraper stored.
