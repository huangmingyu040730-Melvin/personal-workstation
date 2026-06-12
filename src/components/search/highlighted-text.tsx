type HighlightedTextProps = {
  text: string | null | undefined;
  query: string;
};

export function HighlightedText({ text, query }: HighlightedTextProps) {
  const source = text ?? "";
  const normalizedQuery = query.trim();

  if (!source || !normalizedQuery) {
    return <>{source}</>;
  }

  const sourceLower = source.toLocaleLowerCase();
  const queryLower = normalizedQuery.toLocaleLowerCase();
  const parts: Array<{ text: string; highlighted: boolean }> = [];
  let cursor = 0;
  let matchIndex = sourceLower.indexOf(queryLower);

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push({ text: source.slice(cursor, matchIndex), highlighted: false });
    }

    const matchEnd = matchIndex + normalizedQuery.length;
    parts.push({ text: source.slice(matchIndex, matchEnd), highlighted: true });
    cursor = matchEnd;
    matchIndex = sourceLower.indexOf(queryLower, cursor);
  }

  if (cursor < source.length) {
    parts.push({ text: source.slice(cursor), highlighted: false });
  }

  return (
    <>
      {parts.map((part, index) =>
        part.highlighted ? (
          <mark key={`${part.text}-${index}`} className="rounded bg-amber-100 px-0.5 font-semibold text-amber-950">
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        )
      )}
    </>
  );
}
