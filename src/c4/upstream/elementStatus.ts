import type { ElementStatus } from './model';
import { representable } from './dsl/encoding';

// This module contains only the parser-required open status validation subset
// from C4 Hero's elementStatus implementation.
export const MAX_STATUS_LENGTH = 60;

export function isElementStatusValue(v: unknown): v is ElementStatus {
  return (
    typeof v === 'string' &&
    v.trim().length > 0 &&
    v.length <= MAX_STATUS_LENGTH &&
    !/[\r\n]/.test(v) &&
    representable(v.trim()) === v.trim()
  );
}

export function normalizeElementStatus(v: unknown): ElementStatus | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return isElementStatusValue(trimmed) ? trimmed : undefined;
}
