// Removes stale build output before `next build` / `next dev`.
//
// Why: Next cleans `.next/` (and a previous `out/`) with readdir(withFileTypes) + readlink on every entry that is a
// reparse point. Inside Dropbox/OneDrive folders every file carries a cloud-files reparse tag, so that cleanup fails
// with "EINVAL: invalid argument, readlink '.next\cache'". fs.rmSync has no such problem, so we delete first.
// Dropbox also briefly locks freshly written files while indexing them (EBUSY), hence the retries.
//
// Usage: node scripts/clean.mjs [--out] [--next]   (no flag = both)
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const args = new Set(process.argv.slice(2));
const targets = [];
if (args.size === 0 || args.has('--out')) targets.push('out');
if (args.size === 0 || args.has('--next')) targets.push('.next');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const t of targets) {
  const p = resolve(process.cwd(), t);
  if (!existsSync(p)) continue;
  let lastErr;
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      rmSync(p, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
      lastErr = undefined;
      break;
    } catch (e) {
      lastErr = e;
      await sleep(500 * attempt);
    }
  }
  if (lastErr) {
    console.error(`[clean] could not remove ${t}/ (${lastErr.code}). Dropbox/antivirus may still be indexing it; wait a few seconds and retry, or delete the folder by hand.`);
    process.exit(1);
  }
  console.log(`[clean] removed ${t}/`);
}
