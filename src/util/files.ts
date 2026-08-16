import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export async function readJson<T>(path: string): Promise<T> {
  const text = await readFile(path, 'utf8');
  return JSON.parse(text) as T;
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  const absolute = resolve(path);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function writeText(path: string, value: string): Promise<void> {
  const absolute = resolve(path);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}

export function nowIso(): string {
  const forced = process.env.TWIN_NOW;
  if (forced) {
    const parsed = new Date(forced);
    if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid TWIN_NOW: ${forced}`);
    return parsed.toISOString();
  }
  return new Date().toISOString();
}
