declare class Buffer extends Uint8Array {
  static from(value: string, encoding?: string): Buffer;
  toString(encoding?: string): string;
}
declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  exitCode?: number;
  cwd(): string;
};

declare module 'node:crypto' {
  export function createHash(name: string): { update(value: string | Uint8Array): { digest(encoding: 'hex'): string } };
}
declare module 'node:fs/promises' {
  export function readFile(path: string, encoding: 'utf8'): Promise<string>;
  export function writeFile(path: string, value: string, encoding: 'utf8'): Promise<void>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function mkdtemp(prefix: string): Promise<string>;
  export function rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
}
declare module 'node:path' {
  export function basename(path: string): string;
  export function dirname(path: string): string;
  export function extname(path: string): string;
  export function relative(from: string, to: string): string;
  export function resolve(...paths: string[]): string;
  export function join(...paths: string[]): string;
}
declare module 'node:os' {
  export function tmpdir(): string;
}
declare module 'node:test' {
  export default function test(name: string, fn: () => void | Promise<void>): void;
}
declare module 'node:assert/strict' {
  const assert: {
    ok(value: unknown, message?: string): asserts value;
    equal(actual: unknown, expected: unknown, message?: string): void;
    notEqual(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    throws(fn: () => unknown, matcher?: RegExp | ((error: unknown) => boolean)): void;
    rejects(fn: () => Promise<unknown>, matcher?: RegExp | ((error: unknown) => boolean)): Promise<void>;
  };
  export default assert;
}
