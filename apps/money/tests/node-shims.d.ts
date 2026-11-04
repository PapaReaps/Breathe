/*
 * A tiny description of the three Node.js tools that tests/pwa.test.ts uses to read files,
 * so the type check does not depend on extra packages being installed.
 */
declare module "node:fs" {
  export function readFileSync(path: string, encoding?: string): any;
  export function existsSync(path: string): boolean;
}

declare module "node:url" {
  export function fileURLToPath(url: URL | string): string;
}

interface ImportMeta {
  url: string;
}
