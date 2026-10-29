/**
 * HisabIQ calculator scratchpad semantics adapted from sherERP_Mohim/javascript.html.
 * This is intentionally local-only and never changes a POS/payment/ledger value.
 * No eval/Function: expressions are parsed as arithmetic with smart percentages.
 */
export type CalculatorResult = { value: number; error: boolean };
export const CALCULATOR_STORAGE_KEY = 'hisabiq.calc.lines.v1';
export const MAX_CALCULATOR_LINES = 120;
const MAX_EXPRESSION_LENGTH = 256;

export function normalizeCalculatorExpression(raw: string): string {
  return raw.replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)))
    .replace(/[×xX]/g, '*').replace(/÷/g, '/')
    .replace(/[−–]/g, '-').replace(/,/g, '');
}

/** Addition/subtraction treat a plain RHS percent as a percent of the LHS.
 * 500 + 10% = 550; 500 * 10% = 50; (10%) is a literal 0.1.
 */
export function evaluateCalculatorExpression(expression: string): CalculatorResult {
  const raw = String(expression ?? '').trim();
  if (!raw) return { value: 0, error: false };
  if (raw.length > MAX_EXPRESSION_LENGTH) return { value: 0, error: true };
  const source = normalizeCalculatorExpression(raw);
  let pos = 0;
  const peek = () => source.charAt(pos);
  const skip = () => { while (/\s/.test(peek()) && pos < source.length) pos++; };
  const fail = (): never => { throw new Error('invalid arithmetic expression'); };
  type Factor = { value: number; percent: boolean };

  function suffix(value: number): Factor {
    skip();
    if (peek() === '%') { pos++; return { value: value / 100, percent: true }; }
    return { value, percent: false };
  }

  function number(): number {
    skip();
    const start = pos;
    while (/[0-9]/.test(peek())) pos++;
    if (peek() === '.') {
      pos++;
      while (/[0-9]/.test(peek())) pos++;
    }
    const part = source.slice(start, pos);
    if (!part || part === '.') return fail();
    const result = Number(part);
    if (!Number.isFinite(result)) return fail();
    return result;
  }

  function factor(): Factor {
    skip();
    const ch = peek();
    if (ch === '+' || ch === '-') {
      pos++;
      const next = factor();
      return { value: ch === '-' ? -next.value : next.value, percent: next.percent };
    }
    if (ch === '(') {
      pos++;
      const nested = expr();
      skip();
      if (peek() !== ')') return fail();
      pos++;
      return suffix(nested);
    }
    return suffix(number());
  }

  function term(): Factor {
    const left = factor();
    let value = left.value;
    let percent = left.percent;
    while (pos < source.length) {
      skip();
      const ch = peek();
      if (ch !== '*' && ch !== '/') break;
      pos++;
      const rhs = factor();
      value = ch === '*' ? value * rhs.value : value / rhs.value;
      percent = false;
      if (!Number.isFinite(value)) return fail();
    }
    return { value, percent };
  }

  function expr(): number {
    let value = term().value;
    while (pos < source.length) {
      skip();
      const ch = peek();
      if (ch !== '+' && ch !== '-') break;
      pos++;
      const rhs = term();
      const amount = rhs.percent ? value * rhs.value : rhs.value;
      value = ch === '+' ? value + amount : value - amount;
      if (!Number.isFinite(value)) return fail();
    }
    return value;
  }

  try {
    const value = expr();
    skip();
    if (pos !== source.length || !Number.isFinite(value)) return { value: 0, error: true };
    return { value, error: false };
  } catch {
    return { value: 0, error: true };
  }
}

export function formatCalculatorNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round((value + Number.EPSILON) * 1e6) / 1e6;
  return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString('en-IN', {
    maximumFractionDigits: 6
  });
}

export function sanitizeCalculatorLines(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) return [''];
  const lines = value.slice(0, MAX_CALCULATOR_LINES).map(item =>
    typeof item === 'string' ? item.slice(0, MAX_EXPRESSION_LENGTH) : '');
  return lines.length ? lines : [''];
}

export function summarizeCalculatorLines(lines: string[]) {
  const results = lines.map(evaluateCalculatorExpression);
  const total = lines.reduce((sum, line, index) =>
    line.trim() && !results[index].error ? sum + results[index].value : sum, 0);
  const errors = results.filter((r, i) => lines[i].trim() && r.error).length;
  return { results, total, errors };
}
