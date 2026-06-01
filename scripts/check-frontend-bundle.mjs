import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDir = join(repoRoot, 'frontend', 'dist');
const forbidden = [
  'service_role',
  'SUPABASE_SERVICE_ROLE',
  'supabase_service_role',
];

if (!existsSync(distDir)) {
  console.error(`Missing build output: ${distDir}`);
  process.exit(1);
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const hits = [];

for (const file of listFiles(distDir)) {
  const content = readFileSync(file, 'utf8');
  for (const token of forbidden) {
    if (content.includes(token)) {
      hits.push(`${file}: ${token}`);
    }
  }
}

if (hits.length > 0) {
  console.error('Forbidden secret-like tokens found in frontend bundle:');
  for (const hit of hits) {
    console.error(`- ${hit}`);
  }
  process.exit(1);
}

console.log('Frontend bundle secret scan passed.');
