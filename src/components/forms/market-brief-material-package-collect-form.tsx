"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search, Sparkles } from "lucide-react";
import { Select, TextInput } from "@/components/forms/form-fields";

type CollectResponse = {
  ok?: boolean;
  package_id?: string;
  status?: string;
  sources_count?: number;
  warnings?: string[];
  detail_url?: string;
  error?: string;
};

export function MarketBriefMaterialPackageCollectForm({ today }: { today: string }) {
  const router = useRouter();
  const [packageDate, setPackageDate] = useState(today);
  const [market, setMarket] = useState("A股");
  const [isTodayPending, setIsTodayPending] = useState(false);
  const [isDatePending, setIsDatePending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function collectMaterialPackage(input: { packageDate?: string; market: string }, pendingSetter: (value: boolean) => void) {
    setMessage(null);
    setError(null);
    pendingSetter(true);

    try {
      const response = await fetch("/api/market-briefs/material-packages/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const payload = await response.json() as CollectResponse;

      if (!response.ok || !payload.package_id) {
        setError(payload.error ?? "素材包采集失败。");
        return;
      }

      setMessage(`素材包已保存，状态：${payload.status ?? "unknown"}，来源：${payload.sources_count ?? 0} 条。`);
      router.push(payload.detail_url ?? `/dashboard/market-briefs/materials/${payload.package_id}`);
      router.refresh();
    } catch {
      setError("素材包采集请求失败，请稍后重试。");
    } finally {
      pendingSetter(false);
    }
  }

  function handleTodaySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void collectMaterialPackage({ market: "A股" }, setIsTodayPending);
  }

  function handleDateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void collectMaterialPackage({ packageDate, market }, setIsDatePending);
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={handleTodaySubmit} className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">今日：{today}</span>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">默认市场：A股</span>
          </div>
          <button
            type="submit"
            disabled={isTodayPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles size={16} />
            {isTodayPending ? "采集中..." : "采集今日素材包"}
          </button>
        </form>

        <form onSubmit={handleDateSubmit} className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
            <TextInput type="date" value={packageDate} max={today} onChange={(event) => setPackageDate(event.target.value)} required />
            <Select value={market} onChange={(event) => setMarket(event.target.value)}>
              <option value="A股">A股</option>
            </Select>
          </div>
          <button
            type="submit"
            disabled={isDatePending}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search size={16} />
            {isDatePending ? "采集中..." : "采集指定日期素材包"}
          </button>
        </form>
      </div>
    </div>
  );
}
