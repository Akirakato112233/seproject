/**
 * @module utils/validation
 *
 * Server-side validation helpers shared across controllers.
 * Keeping validation in a central utility makes it easy to
 * write consistent error responses and avoids duplicating
 * the same null/empty checks in every handler.
 */

/**
 * Collect names of missing required fields from a key-value map.
 *
 * A field is considered "missing" when its value is `undefined`,
 * `null`, or an empty/whitespace-only string.
 *
 * @param fields  Object whose keys are field names and values are
 *                the corresponding user-supplied data.
 * @returns Array of field names that are missing (empty when all present).
 *
 * @example
 * ```ts
 * const missing = getMissingFields({ firstName, lastName, phone });
 * if (missing.length > 0) {
 *   return res.status(400).json({
 *     success: false,
 *     message: `Missing: ${missing.join(', ')}`,
 *   });
 * }
 * ```
 */
export function getMissingFields(fields: Record<string, unknown>): string[] {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) {
      missing.push(key);
      continue;
    }
    if (typeof value === 'string' && value.trim() === '') {
      missing.push(key);
    }
  }

  return missing;
}

/**
 * Check whether a value is one of a fixed set of allowed strings.
 *
 * @param value    The value to check
 * @param allowed  Array of acceptable string values
 * @returns `true` when the value is in the allowed set
 *
 * @example
 * ```ts
 * if (!isAllowedValue(plateColor, ['white', 'green', 'yellow', 'red'])) {
 *   return res.status(400).json({ … });
 * }
 * ```
 */
export function isAllowedValue(value: unknown, allowed: string[]): boolean {
  return typeof value === 'string' && allowed.includes(value);
}

/**
 * Assert that a value is a boolean.
 * Useful when a body field must be explicitly `true` or `false`.
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Maximum number of emergency contacts allowed per registration.
 */
export const MAX_EMERGENCY_CONTACTS = 3;
