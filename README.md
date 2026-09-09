# Site Audit Dashboard

A focused web application for auditing the technical health of one public URL. It demonstrates secure backend fetching, TypeScript, PostgreSQL, external APIs, testing, Docker, and CI.

## Status

The foundation is in place. Audit features are delivered incrementally through tracked GitHub issues and pull requests.

## Planned capabilities

- HTTP status, response time, and HTTPS checks
- SEO and social metadata checks
- Optional Google PageSpeed Insights scores
- Saved audit reports and history
- SSRF-aware public URL fetching

## Quick start

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local database

Start PostgreSQL in Docker:

```bash
docker compose up -d db
pnpm db:generate
pnpm db:migrate
```

The local credentials in `.env.example` match the Compose service. Stop the
database with `docker compose down`; its named volume preserves data.

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

GitHub Actions runs these same checks for every pull request and every push to
`develop` or `main`.

## Environment variables

| Variable                   | Required | Purpose                              |
| -------------------------- | -------- | ------------------------------------ |
| `DATABASE_URL`             | Yes      | PostgreSQL connection string.        |
| `GOOGLE_PAGESPEED_API_KEY` | No       | Enables PageSpeed Insights requests. |

## Development workflow

Work starts from `develop`. Each relevant feature has a GitHub issue, a dedicated branch, focused Conventional Commits, a pull request, automated checks, and review before merging back to `develop`.

## Roadmap

1. Project bootstrap
2. PostgreSQL and Drizzle
3. Secure URL validation and SSRF protection
4. Secure website fetcher
5. Audit runner and baseline checks
6. Metadata checks and PageSpeed
7. Audit UI and history
8. Docker, CI, screenshots, and v1.0.0 release

## License

MIT
