"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type MaterialPackageActionsProps = {
  id: string;
  recollectAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export function MarketBriefMaterialPackageActions({ id, recollectAction, deleteAction }: MaterialPackageActionsProps) {
  return (
    <div className="space-y-3">
      <form action={recollectAction}>
        <input type="hidden" name="id" value={id} />
        <RecollectButton />
      </form>

      <form
        action={deleteAction}
        onSubmit={(event) => {
          const confirmed = window.confirm("确认删除这个市场素材包？该操作不会删除已生成简报，但历史 job 中的素材包链接可能失效。");
          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100"
        >
          <Trash2 size={16} />
          删除此素材包
        </button>
      </form>
    </div>
  );
}

function RecollectButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCw size={16} />
      {pending ? "重新采集中..." : "重新采集此素材包"}
    </button>
  );
}
