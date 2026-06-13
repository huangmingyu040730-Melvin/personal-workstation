import { PublicSectionHeader } from "@/components/public/public-shell";
import { cn } from "@/lib/utils";

type HomeSectionProps = {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  surface?: "white" | "muted";
  className?: string;
  innerClassName?: string;
};

const surfaceClasses = {
  white: "border-t border-slate-200 bg-white",
  muted: "border-t border-slate-200 bg-slate-50/70"
};

export function HomeSection({
  children,
  eyebrow,
  title,
  description,
  action,
  surface = "white",
  className,
  innerClassName
}: HomeSectionProps) {
  return (
    <section className={cn(surfaceClasses[surface], className)}>
      <div className={cn("mx-auto max-w-[1680px] px-5 py-14 lg:px-12 lg:py-16 2xl:px-16", innerClassName)}>
        <PublicSectionHeader eyebrow={eyebrow} title={title} description={description} action={action} />
        {children}
      </div>
    </section>
  );
}
