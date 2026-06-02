function parseInline(value: string) {
  return value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em] text-slate-800">
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

export function MarkdownPreview({ content, emptyText = "暂无正文。" }: { content?: string | null; emptyText?: string }) {
  const lines = (content ?? "").split(/\r?\n/);

  if (!content?.trim()) {
    return <p className="text-sm leading-7 text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-3 text-sm leading-7 text-slate-700">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-1" />;
        }

        if (trimmed.startsWith("### ")) {
          return <h4 key={index} className="pt-2 text-base font-semibold text-slate-950">{parseInline(trimmed.slice(4))}</h4>;
        }

        if (trimmed.startsWith("## ")) {
          return <h3 key={index} className="pt-3 text-lg font-semibold text-slate-950">{parseInline(trimmed.slice(3))}</h3>;
        }

        if (trimmed.startsWith("# ")) {
          return <h2 key={index} className="pt-4 text-xl font-semibold text-slate-950">{parseInline(trimmed.slice(2))}</h2>;
        }

        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <p key={index} className="pl-4">
              <span className="mr-2 text-blue-600">•</span>
              {parseInline(trimmed.replace(/^[-*]\s+/, ""))}
            </p>
          );
        }

        if (/^\d+\.\s+/.test(trimmed)) {
          return <p key={index}>{parseInline(trimmed)}</p>;
        }

        return <p key={index}>{parseInline(trimmed)}</p>;
      })}
    </div>
  );
}
