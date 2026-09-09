"use client";

import { useActionState } from "react";

import { runAuditAction, type RunAuditState } from "@/app/actions/run-audit";

const initialState: RunAuditState = { message: "" };

export function AuditForm() {
  const [state, action, pending] = useActionState(runAuditAction, initialState);

  return (
    <form
      action={action}
      className="mt-10 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.24)] sm:flex sm:items-center"
    >
      <label className="sr-only" htmlFor="audit-url">
        Website URL
      </label>
      <input
        className="h-12 w-full rounded-xl px-4 text-base text-slate-900 outline-none placeholder:text-slate-400"
        id="audit-url"
        name="url"
        placeholder="https://example.com"
        required
        type="url"
      />
      <button
        className="mt-2 h-12 w-full rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-slate-500 sm:mt-0 sm:w-auto sm:shrink-0"
        disabled={pending}
        type="submit"
      >
        {pending ? "Running audit…" : "Run audit"}
      </button>
      {state.message ? (
        <p aria-live="polite" className="px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
