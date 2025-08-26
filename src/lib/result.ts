/*
 * Copyright (c) 2025 Novumlogic Technologies Pvt Ltd
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Represents a successful result value.
 */
export type Ok<T> = { readonly ok: true; readonly value: T };

/**
 * Represents an error result value.
 */
export type Err<E> = { readonly ok: false; readonly error: E };

/**
 * Represents either a successful result or an error result.
 */
export type Result<T, E = unknown> = Ok<T> | Err<E>;

/**
 * Creates a successful result value.
 */
export const Ok = <T>(value: T): Ok<T> => ({ ok: true, value }) as const;

/**
 * Creates an error result value.
 */
export const Err = <E>(error: E): Err<E> => ({ ok: false, error }) as const;

/**
 * Checks if the result is successful.
 */
export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;

/**
 * Checks if the result is an error.
 */
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;

/**
 * Maps a successful result value to a new value.
 * @param r - The result to map.
 * @param f - The function to apply to the value if successful.
 * @returns A new result with the mapped value or the original error.
 */
export function map<T, E, U>(r: Result<T, E>, f: (v: T) => U): Result<U, E> {
  return r.ok ? Ok(f(r.value)) : Err(r.error);
}

/**
 * Maps an error result value to a new error value.
 * @param r - The result to map.
 * @param f - The function to apply to the error if not successful.
 * @returns A new result with the original value or the mapped error.
 */
export function mapErr<T, E, F>(r: Result<T, E>, f: (e: E) => F): Result<T, F> {
  return r.ok ? Ok(r.value) : Err(f(r.error));
}

/**
 * Chains a result-producing function if the result is successful.
 * @param r - The result to chain.
 * @param f - The function to apply if successful.
 * @returns The result of the function or the original error.
 */
export function andThen<T, E, U>(
  r: Result<T, E>,
  f: (v: T) => Result<U, E>,
): Result<U, E> {
  return r.ok ? f(r.value) : Err(r.error);
}

/**
 * Pattern matches on a result, calling the appropriate handler.
 * @param r - The result to match.
 * @param cases - Handlers for Ok and Err cases.
 * @returns The result of the handler function.
 */
export function match<T, E, U>(
  r: Result<T, E>,
  cases: { Ok: (v: T) => U; Err: (e: E) => U },
): U {
  return r.ok ? cases.Ok(r.value) : cases.Err(r.error);
}

/**
 * Unwraps a successful result or throws the error if not successful.
 * @param r - The result to unwrap.
 * @returns The value if successful.
 * @throws The error if not successful.
 */
export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  const err = r.error;
  throw err instanceof Error ? err : new Error(String(err));
}

/**
 * Unwraps a successful result or throws an error with a custom message if not successful.
 * @param r - The result to unwrap.
 * @param msg - The custom error message.
 * @returns The value if successful.
 * @throws The error with the custom message if not successful.
 */
export function expect<T, E>(r: Result<T, E>, msg: string): T {
  if (r.ok) return r.value;
  const err = r.error;
  const suffix = err instanceof Error ? `: ${err.message}` : `: ${String(err)}`;
  throw new Error(msg + suffix);
}

/**
 * Unwraps a successful result or returns a default value if not successful.
 * @param r - The result to unwrap.
 * @param defaultValue - The default value to return if not successful.
 * @returns The value if successful, otherwise the default value.
 */
export function unwrapOr<T, E>(r: Result<T, E>, defaultValue: T): T {
  return r.ok ? r.value : defaultValue;
}

/**
 * Unwraps a successful result or computes a value from the error if not successful.
 * @param r - The result to unwrap.
 * @param f - The function to compute a value from the error.
 * @returns The value if successful, otherwise the computed value.
 */
export function unwrapOrElse<T, E>(r: Result<T, E>, f: (e: E) => T): T {
  return r.ok ? r.value : f(r.error);
}

/**
 * Creates a result from a nullable value, returning an error if null or undefined.
 * @param value - The value to check.
 * @param error - The error to return if value is null or undefined.
 * @returns Ok if value is not null/undefined, otherwise Err.
 */
export function fromNullable<T, E>(
  value: T | null | undefined,
  error: E,
): Result<T, E> {
  return value == null ? Err(error) : Ok(value);
}

/**
 * Executes a function and returns Ok if successful, otherwise Err with the error.
 * Optionally maps the error.
 * @param fn - The function to execute.
 * @param mapError - Optional function to map the error.
 * @returns Ok if successful, otherwise Err.
 */
export function fromThrowable<T, E = unknown>(
  fn: () => T,
  mapError?: (u: unknown) => E,
): Result<T, E> {
  try {
    return Ok(fn());
  } catch (u) {
    return Err(mapError ? mapError(u) : (u as E));
  }
}

/**
 * Converts a promise to a result, returning Ok if resolved, otherwise Err with the error.
 * Optionally maps the error.
 * @param p - The promise to convert.
 * @param mapError - Optional function to map the error.
 * @returns A promise that resolves to Ok or Err.
 */
export async function fromPromise<T, E = unknown>(
  p: Promise<T>,
  mapError?: (u: unknown) => E,
): Promise<Result<T, E>> {
  try {
    return Ok(await p);
  } catch (u) {
    return Err(mapError ? mapError(u) : (u as E));
  }
}

/**
 * Aggregates an array of results, returning Ok with all values if all are successful, otherwise Err with the first error.
 * @param results - Array of results to aggregate.
 * @returns Ok with all values or Err with the first error.
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const out: T[] = [];
  for (const r of results) {
    if (!r.ok) return Err(r.error);
    out.push(r.value);
  }
  return Ok(out);
}
/**
 * Returns Ok with the first successful value in an array of results, otherwise Err with all errors.
 * @param results - Array of results to check.
 * @returns Ok with the first value or Err with all errors.
 */
export function any<T, E>(results: Result<T, E>[]): Result<T, E[]> {
  const errors: E[] = [];
  for (const r of results) {
    if (r.ok) return Ok(r.value);
    errors.push(r.error);
  }
  return Err(errors);
}

/**
 * Calls side-effect handlers for Ok or Err cases, returning the original result.
 * @param r - The result to tap.
 * @param handlers - Handlers for Ok and Err cases.
 * @returns The original result.
 */
export function tap<T, E>(
  r: Result<T, E>,
  handlers: { Ok?: (v: T) => void; Err?: (e: E) => void },
): Result<T, E> {
  if (r.ok) handlers.Ok?.(r.value);
  else handlers.Err?.(r.error);
  return r;
}
