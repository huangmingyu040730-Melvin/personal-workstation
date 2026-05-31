import { Badge } from "./badge";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        {eyebrow ? (
          <Badge className="mb-3 bg-blue-50 text-blue-700 ring-blue-200">{eyebrow}</Badge>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}
