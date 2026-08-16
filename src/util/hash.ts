import { createHash } from 'node:crypto';

export function sha256(value: string | Buffer): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

export function stableId(prefix: string, value: string): string {
  return `${prefix}:${sha256(value).slice('sha256:'.length, 'sha256:'.length + 16)}`;
}
