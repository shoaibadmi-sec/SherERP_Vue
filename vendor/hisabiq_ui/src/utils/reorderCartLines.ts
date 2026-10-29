/** Reorder by stable cart line keys so every invoice/receipt retains its product metadata. */
export function reorderCartLines<T extends { key: string }>(lines: T[], orderedKeys: string[]): T[] {
  if (lines.length !== orderedKeys.length) return lines;
  const keyed = new Map(lines.map((line) => [line.key, line]));
  if (keyed.size !== lines.length || new Set(orderedKeys).size !== lines.length
      || orderedKeys.some((key) => !keyed.has(key))) return lines;
  if (orderedKeys.every((key, index) => lines[index].key === key)) return lines;
  return orderedKeys.map((key) => keyed.get(key)!);
}

/** Move one POS cart line by a keyboard-accessible step, preserving all line fields. */
export function moveCartLine<T extends { key: string }>(lines: T[], key: string, delta: number): T[] {
  const from = lines.findIndex((line) => line.key === key);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= lines.length || !Number.isInteger(delta) || delta === 0) return lines;
  const next = [...lines];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}
