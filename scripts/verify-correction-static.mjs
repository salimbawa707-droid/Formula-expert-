import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const server = read('server.ts');
const encyclopedia = read('src/components/ChemicalEncyclopedia.tsx');
const pkg = JSON.parse(read('package.json'));

const requiredRoutes = [
  ["/api/ai/chat", "maxRequests: 20", "limit: '256kb'"],
  ["/api/ai/analyze-label", "maxRequests: 8", "limit: '12mb'"],
  ["/api/ai/research-ingredient", "maxRequests: 10", "limit: '256kb'"],
  ["/api/ai/apply-verified-ingredient", "maxRequests: 20", "limit: '256kb'"],
  ["/api/ai/analyze-recommend", "maxRequests: 10", "limit: '256kb'"],
  ["/api/billing/verify-purchase", "maxRequests: 10", "limit: '64kb'"],
];

for (const [route, rateLimit, bodyLimit] of requiredRoutes) {
  const routeStart = server.indexOf(`'${route}'`);
  assert.notEqual(routeStart, -1, `Route exists: ${route}`);
  const routeChunk = server.slice(routeStart, routeStart + 700);
  assert.match(routeChunk, /authenticateUserMiddleware/, `${route} requires authentication`);
  assert.ok(routeChunk.includes(rateLimit), `${route} has a rate limit`);
  assert.ok(routeChunk.includes(bodyLimit), `${route} has a bounded JSON parser`);
}

assert.doesNotMatch(server, /express\.json\(\{\s*limit:\s*['"]30mb['"]/, 'No global 30 MB JSON parser');
assert.doesNotMatch(server, /details:\s*err\?\.message\s*\|\|\s*String\(err\)/, 'Raw internal errors are not returned');
assert.match(server, /verificationStatus:\s*'UNVERIFIED'/, 'AI-applied ingredient remains unverified');
assert.match(server, /app\.delete\(\s*'\/api\/account'[\s\S]{0,300}status\(501\)/, 'Account deletion fails closed instead of reporting fake success');
assert.match(server, /sourceType:\s*'AI_RESEARCH_PENDING_REVIEW'/, 'AI-applied ingredient provenance is not claimed as manufacturer verified');
assert.doesNotMatch(encyclopedia, /dangerouslySetInnerHTML/, 'SVG is not injected as HTML');
assert.match(encyclopedia, /data:image\/svg\+xml;charset=utf-8,/, 'SVG is rendered in an image context');
assert.match(pkg.scripts.start, /--experimental-strip-types|node server\.ts/, 'Server startup explicitly enables Node server execution');
assert.ok(pkg.engines?.node, 'Node engine version is documented');

console.log('Correction static checks passed.');
console.log(`Protected routes checked: ${requiredRoutes.length}`);
console.log('Checks: auth middleware, per-route limits, safe error responses, unverified AI provenance, SVG rendering, Node startup configuration.');
console.log('Note: these are static source checks, not runtime, dependency, Android, or scientific validation tests.');
