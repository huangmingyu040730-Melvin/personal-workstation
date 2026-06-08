import Link from "next/link";
import { AlertTriangle, Inbox, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPageSurface({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("admin-reveal space-y-6", className)}>{children}</div>;
}

export function AdminSection({
  children,
  className,
  title,
  description,
  action
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-3xl border border-slate-200 bg-white p-5 shadow-soft", className)}>
      {title ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminContentCard({ children, className, href }: { children: React.ReactNode; className?: string; href?: string }) {
  const classes = cn(
    "admin-card-motion rounded-3xl border border-slate-200 bg-white p-5 shadow-soft",
    href && "block",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}

export function AdminFormSurface({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("max-w-5xl space-y-5", className)}>{children}</div>;
}

export function AdminEmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
        <Inbox size={22} />
      </div>
      <p className="mt-4 text-base font-semibold text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminFormSection({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-3xl border border-slate-200 bg-white p-5 shadow-soft", className)}>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function AdminDangerZone({ children, description = "危险操作会影响真实数据，请确认后再继续。" }: { children: React.ReactNode; description?: string }) {
  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50/70 p-5">
      <div className="mb-4 flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-700 shadow-sm">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-rose-950">危险操作</h2>
          <p className="mt-1 text-sm leading-6 text-rose-700">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function AdminSecurityNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
      <ShieldCheck className="mt-0.5 shrink-0" size={18} />
      <div>{children}</div>
    </div>
  );
}
