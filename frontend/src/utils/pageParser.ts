export function parseClientPageRange(
  input: string,
  maxPages: number
): { pages: number[]; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { pages: [] };
  }

  const pagesSet = new Set<number>();
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const subparts = part.split('-');
      if (subparts.length !== 2) {
        return { pages: [], error: `Noto‘g‘ri oraliq: "${part}"` };
      }
      const start = parseInt(subparts[0].trim(), 10);
      const end = parseInt(subparts[1].trim(), 10);

      if (isNaN(start) || isNaN(end)) {
        return { pages: [], error: `Sonlar kiritilishi kerak: "${part}"` };
      }
      if (start > end) {
        return { pages: [], error: `Boshlang‘ich sahifa oxirgisidan kichik bo‘lishi lozim: "${part}"` };
      }
      if (start < 1 || end > maxPages) {
        return { pages: [], error: `Sahifalar 1 va ${maxPages} oralig‘ida bo‘lishi kerak` };
      }

      for (let i = start; i <= end; i++) {
        pagesSet.add(i);
      }
    } else {
      const num = parseInt(part, 10);
      if (isNaN(num)) {
        return { pages: [], error: `Noto‘g‘ri raqam: "${part}"` };
      }
      if (num < 1 || num > maxPages) {
        return { pages: [], error: `Sahifa ${num} umumiy sahifalar (1-${maxPages}) doirasida emas` };
      }
      pagesSet.add(num);
    }
  }

  const sorted = Array.from(pagesSet).sort((a, b) => a - b);
  return { pages: sorted };
}

export function formatPageRangeString(pages: number[]): string {
  if (!pages.length) return '';
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = cur;
      prev = cur;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}
