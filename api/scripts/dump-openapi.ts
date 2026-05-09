import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildApp } from '../src/app.js';

async function main() {
  const app = await buildApp();
  await app.ready();
  const spec = app.swagger();
  const outPath = path.resolve(process.cwd(), '../docs/openapi/bundle.yaml');
  // Write JSON for now; user can convert to YAML via redocly bundle
  writeFileSync(
    outPath.replace(/\.yaml$/, '.json'),
    JSON.stringify(spec, null, 2),
    'utf8',
  );
  console.log(`OpenAPI spec written to ${outPath.replace(/\.yaml$/, '.json')}`);
  await app.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
