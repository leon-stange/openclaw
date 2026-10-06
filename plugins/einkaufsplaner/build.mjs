import { mkdir, copyFile } from 'node:fs/promises';
await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
for (const name of ['index.js', 'client.mjs']) {
  await copyFile(new URL(`./src/${name}`, import.meta.url), new URL(`./dist/${name}`, import.meta.url));
}
