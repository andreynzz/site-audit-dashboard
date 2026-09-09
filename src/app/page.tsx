import Link from "next/link";

import { AuditForm } from "@/components/audit-form";

const capabilities = [
  "HTTP and HTTPS health",
  "Search metadata",
  "Social previews",
  "PageSpeed scores",
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:px-10 lg:px-12">
      <header className="flex items-center justify-between">
        <Link
          className="flex items-center gap-3 font-semibold tracking-tight"
          href="/"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-sm text-white shadow-sm">
            SA
          </span>
          <span>Site Audit</span>
        </Link>
        <Link
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
          href="/audits"
        >
          View history
        </Link>
      </header>
      <section className="flex flex-1 flex-col justify-center py-20 sm:py-28">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-semibold tracking-[0.16em] text-blue-700 uppercase">
            Site Audit Dashboard
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl sm:leading-[1.08]">
            Understand your website&apos;s technical health.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Run a focused audit of one public page. Get actionable findings for
            HTTP, SEO, social metadata, and performance.
          </p>
          <AuditForm />
          <p className="mt-3 text-xs text-slate-500">
            Public HTTP(S) URLs only. Secure target validation will be enabled
            in the next implementation stages.
          </p>
        </div>
        <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((capability, index) => (
            <div
              className="rounded-xl border border-slate-200 bg-white p-4"
              key={capability}
            >
              <span className="text-xs font-semibold text-blue-700">
                0{index + 1}
              </span>
              <p className="mt-5 text-sm font-medium text-slate-800">
                {capability}
              </p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-slate-200 pt-6 text-sm text-slate-500">
        Built as a focused technical audit tool for agencies, freelancers, and
        product teams.
      </footer>
    </main>
  );
}
