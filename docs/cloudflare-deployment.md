# Cloudflare deployment

The `populous-new-dawn` Worker uses account `19321bcee0ed17a93b709cb602dd070c`.
Wrangler 4.92.0 and the existing vinext/Vite plugin are pinned in package-lock.json.
No database or cloud save storage is provisioned; game saves remain browser-local.

## Local production deployment

Use Node 24.18.0 and the existing Wrangler login:

```sh
npm ci
npx wrangler whoami
npm run check
npm run deploy:cloudflare
```

`build:cloudflare` opts into `wrangler.cloudflare.jsonc`. Vite emits the actual
deployment configuration in `dist/server/wrangler.json`; deploy that built file,
not the source config. Ordinary `npm run dev` and `npm run build` retain the Sites
configuration and `.openai/hosting.json` is unchanged. Do not deploy a default
Sites build with Wrangler; build for Cloudflare first.

## PR previews

```sh
npm run preview:cloudflare -- --preview-alias pr-123
```

This builds and uploads a version without replacing production. Wrangler prints
its preview URL. The stable alias is `pr-123-populous-new-dawn.<account-subdomain>.workers.dev`.
Previews are public and retain their own origin's browser-local saves. Closing a
PR does not delete its retained version or alias; old preview URLs can remain live.

## Cloudflare Workers Builds

Cloudflare connects directly to `JohnDeved/populous-new-dawn` on GitHub. It builds
and deploys commits without GitHub Actions or a GitHub Actions API-token secret.
Configure the Worker's Settings > Build as follows:

- Production branch: `main`.
- Root directory: `/`.
- Build command (production and previews): `npm run build:cloudflare`.
- Production deploy command: `npx wrangler deploy --config dist/server/wrangler.json`.
- Non-production deploy command: `npx wrangler versions upload --config dist/server/wrangler.json`.
- Enable non-production branch builds and PR preview comments.
- Build variable: `NODE_VERSION=24.18.0`.
- Enable build caching for production and previews to reuse npm downloads.

Cloudflare runs only the application build and deployment; tests, typechecking,
parity, and workflow checks run separately during development and review. Keep
`npm run check` out of the Cloudflare build command. The deploy commands above
upload the existing build; do not use `deploy:cloudflare` or `preview:cloudflare`
there, because those local convenience scripts would build the app a second time.

Cloudflare installs dependencies and manages its own build token. Branch builds
upload preview versions; only main builds deploy production. Cloudflare supplies
preview links on pull requests. Fork PRs do not share this repository connection.

Verify production and a PR preview after connecting Workers Builds. A passing build/dry-run does
not prove authentication or remote serving. For a local packaging check:

```sh
npm run build:cloudflare
npx wrangler deploy --config dist/server/wrangler.json --dry-run
```

References: [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
and [version preview URLs](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/).
