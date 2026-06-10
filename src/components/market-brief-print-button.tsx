"use client";

import { Printer } from "lucide-react";

export function MarketBriefPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-navy-800"
    >
      <Printer size={16} />
      打印 / 保存 PDF
    </button>
  );
}
