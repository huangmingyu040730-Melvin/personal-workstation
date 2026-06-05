import { Megaphone } from "lucide-react";

export function PublicContentGuidance({ variant = "content" }: { variant?: "content" | "publication" }) {
  return (
    <div className="mb-5 rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-7 text-blue-900">
      <div className="flex gap-3">
        <Megaphone className="mt-1 shrink-0 text-blue-700" size={18} />
        <div>
          <p className="font-semibold">公开站点运营提示</p>
          <p className="mt-1">
            将内容权限设为 public 后，会进入公开站点对应列表；勾选 featured 后，可能出现在首页精选区域。private / unlisted 内容不会对外展示。
            {variant === "publication" ? " 成果关联的文件附件默认仍保持私密，不会因为成果公开而自动公开下载。" : null}
          </p>
        </div>
      </div>
    </div>
  );
}
