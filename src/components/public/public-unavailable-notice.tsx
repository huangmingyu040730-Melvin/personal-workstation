import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PublicUnavailableNotice({
  backHref,
  backLabel
}: {
  backHref: string;
  backLabel: string;
}) {
  return (
    <section className="mx-auto max-w-[1680px] px-5 py-10 lg:px-12 2xl:px-16">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm leading-7 text-slate-600">
          公开站点只展示明确设为 public 的内容。当前地址没有可公开展示的内容，页面不会确认 private、unlisted 或历史受限内容是否真实存在，也不会展示正文、附件、内部关系或文件信息。
        </p>
        <Link href={backHref} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100">
          <ArrowLeft size={16} />
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
