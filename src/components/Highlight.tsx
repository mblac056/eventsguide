interface HighlightProps {
  text: string;
  query: string;
}

/** Renders `text` with case-insensitive occurrences of `query` wrapped in <mark>. */
export function Highlight({ text, query }: HighlightProps) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(<mark key={key++}>{text.slice(idx, idx + needle.length)}</mark>);
    i = idx + needle.length;
  }

  return <>{parts}</>;
}
