function numberValue(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function cleanNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

export function compoundBaseQuantity(
  primaryQty: string | number,
  secondaryQty: string | number,
  factor: number
): number {
  const primary = numberValue(primaryQty);
  if (!Number.isFinite(factor) || factor <= 1) return primary;
  return primary * factor + numberValue(secondaryQty);
}

export function compoundLineTotal(
  primaryQty: string | number,
  secondaryQty: string | number,
  factor: number,
  selectedUnitPrice: string | number
): number {
  const price = numberValue(selectedUnitPrice);
  const primary = numberValue(primaryQty);
  if (!Number.isFinite(factor) || factor <= 1) return primary * price;
  const secondary = numberValue(secondaryQty);
  return primary * price + secondary * (price / factor);
}

export function normalizeCompoundQuantity(
  primaryQty: string | number,
  secondaryQty: string | number,
  factor: number
): { primaryQty: string; secondaryQty: string } {
  const primary = numberValue(primaryQty);
  if (!Number.isFinite(factor) || factor <= 1) {
    return { primaryQty: cleanNumber(primary), secondaryQty: '' };
  }

  const secondary = numberValue(secondaryQty);
  const carry = Math.floor(secondary / factor);
  const remainder = secondary - carry * factor;

  return {
    primaryQty: cleanNumber(primary + carry),
    secondaryQty: cleanNumber(remainder)
  };
}

export function formatCompoundQuantity(
  primaryQty: string | number,
  selectedUnit: string,
  secondaryQty: string | number,
  baseUnit: string
): string {
  const primary = cleanNumber(numberValue(primaryQty)) || '0';
  if (selectedUnit === baseUnit) return `${primary} ${baseUnit}`;

  const secondary = cleanNumber(numberValue(secondaryQty));
  return secondary
    ? `${primary} ${selectedUnit} ${secondary} ${baseUnit}`
    : `${primary} ${selectedUnit}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseCompoundQuantity(
  label: string,
  alternateUnit: string,
  baseUnit: string
): { primaryQty: string; secondaryQty: string; usesAlternate: boolean } {
  const text = label.trim();
  const alternateMatch = text.match(
    new RegExp('([0-9]*\\.?[0-9]+)\\s*' + escapeRegExp(alternateUnit) + '\\b', 'i')
  );

  if (alternateMatch) {
    const baseMatch = text.match(
      new RegExp('([0-9]*\\.?[0-9]+)\\s*' + escapeRegExp(baseUnit) + '\\b', 'i')
    );
    return {
      primaryQty: alternateMatch[1],
      secondaryQty: baseMatch?.[1] ?? '',
      usesAlternate: true
    };
  }

  const first = text.match(/[0-9]*\.?[0-9]+/);
  return { primaryQty: first?.[0] ?? '0', secondaryQty: '', usesAlternate: false };
}
