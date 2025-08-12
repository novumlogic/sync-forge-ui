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

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E = unknown> = Ok<T> | Err<E>;

export const Ok = <T>(value: T): Ok<T> => ({ ok: true, value }) as const;
export const Err = <E>(error: E): Err<E> => ({ ok: false, error }) as const;

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;

export function map<T, E, U>(r: Result<T, E>, f: (v: T) => U): Result<U, E> {
  return r.ok ? Ok(f(r.value)) : Err(r.error);
}

export function mapErr<T, E, F>(r: Result<T, E>, f: (e: E) => F): Result<T, F> {
  return r.ok ? Ok(r.value) : Err(f(r.error));
}

export function andThen<T, E, U>(
  r: Result<T, E>,
  f: (v: T) => Result<U, E>,
): Result<U, E> {
  return r.ok ? f(r.value) : Err(r.error);
}

export function match<T, E, U>(
  r: Result<T, E>,
  cases: { Ok: (v: T) => U; Err: (e: E) => U },
): U {
  return r.ok ? cases.Ok(r.value) : cases.Err(r.error);
}

export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  const err = r.error;
  throw err instanceof Error ? err : new Error(String(err));
}

export function expect<T, E>(r: Result<T, E>, msg: string): T {
  if (r.ok) return r.value;
  const err = r.error;
  const suffix = err instanceof Error ? `: ${err.message}` : `: ${String(err)}`;
  throw new Error(msg + suffix);
}

export function unwrapOr<T, E>(r: Result<T, E>, defaultValue: T): T {
  return r.ok ? r.value : defaultValue;
}

export function unwrapOrElse<T, E>(r: Result<T, E>, f: (e: E) => T): T {
  return r.ok ? r.value : f(r.error);
}

export function fromNullable<T, E>(
  value: T | null | undefined,
  error: E,
): Result<T, E> {
  return value == null ? Err(error) : Ok(value);
}

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

export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const out: T[] = [];
  for (const r of results) {
    if (!r.ok) return Err(r.error);
    out.push(r.value);
  }
  return Ok(out);
}
export function any<T, E>(results: Result<T, E>[]): Result<T, E[]> {
  const errors: E[] = [];
  for (const r of results) {
    if (r.ok) return Ok(r.value);
    errors.push(r.error);
  }
  return Err(errors);
}

export function tap<T, E>(
  r: Result<T, E>,
  handlers: { Ok?: (v: T) => void; Err?: (e: E) => void },
): Result<T, E> {
  if (r.ok) handlers.Ok?.(r.value);
  else handlers.Err?.(r.error);
  return r;
}
