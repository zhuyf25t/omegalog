export type Result<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      reason: string;
    };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const err = <T = never>(reason: string): Result<T> => ({ ok: false, reason });

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
