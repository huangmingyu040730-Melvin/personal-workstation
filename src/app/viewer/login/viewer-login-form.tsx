"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail } from "lucide-react";
import { viewerLoginAction, type ViewerLoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Mail size={18} />
      {pending ? "发送中..." : "发送邮箱登录链接"}
    </button>
  );
}

export function ViewerLoginForm({ nextPath }: { nextPath: string }) {
  const initialState: ViewerLoginState = {};
  const [state, formAction] = useActionState(viewerLoginAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <label className="block">
        <span className="text-sm font-medium text-slate-700">授权邮箱</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          placeholder="name@example.com"
          required
        />
      </label>
      {state.error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">{state.success}</p> : null}
      <SubmitButton />
    </form>
  );
}
