"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <LogIn size={18} />
      {pending ? "登录中..." : "登录工作台"}
    </button>
  );
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const initialState: LoginState = {};
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <label className="block">
        <span className="text-sm font-medium text-slate-700">邮箱</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          placeholder="admin@example.com"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">密码</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          placeholder="请输入密码"
        />
      </label>
      {state.error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{state.error}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
