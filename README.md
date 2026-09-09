# Site Audit Dashboard

A focused web application that audits the technical health of one public URL and turns the result into an actionable report. It reflects an agency workflow: quickly assess a prospect or client website before proposing technical improvements.

## Overview

Enter a public HTTP(S) URL, run an audit, and review its saved report or history. The report combines HTTP, SEO, social metadata, discovery resources, and optional PageSpeed Insights scores. If PageSpeed is unavailable, successful checks are retained in a `partial` audit.

The MVP deliberately audits one page at a time. It does not crawl sites, require accounts, or add background queues.

## Features

- Secure public URL validation with SSRF safeguards
- Bounded HTML fetching with timeout, manual redirects, size, and content-type controls
- HTTP status, HTTPS, and response-time checks
- Title, meta description, canonical URL, and robots meta checks
- Open Graph title, description, image, and favicon checks
- `robots.txt` and `sitemap.xml` availability checks
- Optional PageSpeed performance, accessibility, SEO, and best-practices scores
- PostgreSQL-backed audit reports and recent-audit history
- Vitest, ESLint, Prettier, Docker Compose, and GitHub Actions

## Architecture

```text
Server Action
  -> Audit runner
       -> public-target validation and secure HTML fetch
       -> HTML parser and independent checks
       -> robots.txt / sitemap.xml resource checks
       -> optional PageSpeed client
  -> audit repository (PostgreSQL)
  -> result and history pages
```

```text
src/features/audits/
  audit-runner.ts        orchestration and aggregation
  checks/                pure, standardized HTML checks
  http/                  bounded website and resource fetchers
  html/                  Cheerio document parsing
  pagespeed/             Google PageSpeed Insights client
  repositories/          PostgreSQL persistence
  schemas/               input schemas
  security/              target validation and IP classification
```

## Audit flow

1. Validate the supplied URL and reject non-public targets.
2. Fetch HTML with a 10-second timeout, 2 MiB size limit, manual redirects, and a dedicated user agent. Each redirect is validated again.
3. Parse the document with Cheerio and execute registered checks.
4. Check `robots.txt` and `sitemap.xml`; unavailable auxiliary resources become warnings and do not fail the audit.
5. Query PageSpeed when configured; an external API failure yields a partial report.
6. Persist standardized JSON results and render the report.

## Security

Because the backend requests user-supplied URLs, SSRF protection is a first-class concern:

- only `http` and `https` protocols are accepted;
- local hostnames and non-public IPv4/IPv6 ranges are rejected;
- DNS results are inspected before requests;
- redirect targets are revalidated;
- main-document response time, size, and content type are bounded;
- discovery-resource failures are isolated from the main audit.

These controls are purposely scoped to a public single-page audit and complement, rather than replace, network-level egress controls in a larger system.

## Result model

Each check uses a predictable shape: identifier, category, status, severity, message, optional value, and optional recommendation. This lets checks stay independent from the runner, database, and UI.

The MVP stores one audit record with JSON results. This is more flexible and proportional than normalizing every check while keeping history queries simple.

## Stack

- Next.js App Router and TypeScript
- PostgreSQL with Drizzle ORM
- Cheerio for server-side HTML parsing
- Google PageSpeed Insights API (optional)
- Vitest, ESLint, Prettier, and GitHub Actions
- Docker Compose for local PostgreSQL

Drizzle was selected over Prisma because this small, SQL-oriented schema benefits from a lightweight persistence layer and generated migrations.

## Quick start

Requirements: Node.js 20+, pnpm, and Docker Desktop for the local database.

```bash
pnpm install
cp .env.example .env
docker compose up -d db
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Stop the database with `docker compose down`; its named volume preserves local data.

## Environment variables

| Variable                   | Required | Purpose                             |
| -------------------------- | -------- | ----------------------------------- |
| `DATABASE_URL`             | Yes      | PostgreSQL connection string        |
| `GOOGLE_PAGESPEED_API_KEY` | No       | Enables PageSpeed Insights requests |

Copy `.env.example`; never commit credentials or API keys.

## Quality

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

GitHub Actions runs formatting, linting, type checking, tests, and a production build on every pull request and every push to `develop` or `main`.

## Git workflow

`main` is reserved for stable releases and `develop` is the integration branch. Each relevant feature starts with a GitHub issue, receives a focused branch and Conventional Commit, then merges only after review and green CI.

## Scope and roadmap

The completed MVP delivers a secure, persisted audit of one public URL. The next iteration will add real screenshots from a local database-backed flow and publish the first portfolio release.

Future ideas include shareable/PDF reports, scheduled audits, alerts, historical comparisons, deeper accessibility reports, broken-link checks, and multi-page crawling. Authentication, billing, multi-tenancy, queues, and full-site crawling remain intentionally out of scope.

## License

MIT
