"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children = "保存",
  pendingLabel = "保存中...",
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  const variantClass =
    variant === "primary"
      ? "bg-navy-900 text-white shadow-sm hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md"
      : "border border-blue-200 bg-blue-50 text-blue-700 hover:-translate-y-0.5 hover:bg-blue-100";

  return (
    <button
      type="submit"
      {...props}
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClass,
        className
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function DeleteButton({ label = "删除" }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm("确认删除吗？此操作无法撤销。")) {
          event.preventDefault();
        }
      }}
      className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "删除中..." : label}
    </button>
  );
}
