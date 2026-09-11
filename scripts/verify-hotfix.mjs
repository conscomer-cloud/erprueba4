/** Run after npm run build. Every database is created in a separate temporary directory. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const tempRoot = path.resolve(tmpdir());
const directory = await mkdtemp(path.join(tempRoot, 'conscore-hotfix-'));
const serverDatabase = path.join(directory, 'server.json');
const password = crypto.randomBytes(24).toString('hex');
const listener = net.createServer();
await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve); });
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const baseURL = `http://127.0.0.1:${port}`;
let serverOutput = '';
const server = spawn(process.execPath, ['dist/server.cjs'], {
  env: { ...process.env, NODE_ENV: 'production', PORT: String(port), DB_PATH: serverDatabase,
    SEED_PASSWORD: password, SESSION_SECRET: crypto.randomBytes(48).toString('hex') },
  stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
server.stdout.on('data', chunk => { serverOutput += chunk; });
server.stderr.on('data', chunk => { serverOutput += chunk; });
let serverError;
server.on('error', error => { serverError = error; });
const streamController = new AbortController();
const request = (url, token, method = 'GET', body) => fetch(baseURL + url, {
  method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000),
});
async function login(user) {
  const response = await request('/api/auth/login', null, 'POST', { identifier: user.username || user.email, password });
  assert.equal(response.status, 200);
  const session = await response.json();
  assert.ok(session.token);
  return session.token;
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (serverError) throw serverError;
    if (server.exitCode !== null) throw new Error('Servidor terminó antes de iniciar: ' + serverOutput);
    try { ready = (await request('/api/health')).ok; } catch {}
    if (ready) break;
    await delay(250);
  }
  assert.ok(ready, 'El servidor debe iniciar');
  assert.equal((await request('/api/events')).status, 401);
  assert.equal((await request('/api/events?token=invalid')).status, 401);
  assert.equal((await request('/api/users')).status, 401);
  console.log('PASS HTTP: SSE y usuarios rechazan peticiones sin sesión válida.');

  const database = JSON.parse(await readFile(serverDatabase, 'utf8'));
  const admin = database.users.find(user => user.role === 'ADMINISTRADOR');
  const seller = database.users.find(user => user.role === 'VENDEDOR');
  assert.ok(admin && seller, 'Se requieren los usuarios del seed');
  const adminToken = await login(admin);
  const sellerToken = await login(seller);
  assert.equal((await request('/api/users', sellerToken)).status, 403);
  console.log('PASS HTTP: el vendedor no puede administrar usuarios.');

  const stream = await fetch(baseURL + '/api/events?token=' + encodeURIComponent(sellerToken), { signal: streamController.signal });
  assert.equal(stream.status, 200);
  const reader = stream.body.getReader();
  const first = await reader.read();
  assert.match(new TextDecoder().decode(first.value), /event: connected/);
  assert.equal((await request('/api/auth/logout', sellerToken, 'POST', {})).status, 200);
  assert.equal((await request('/api/auth/me', sellerToken)).status, 401);
  await login(admin); // A login event must trigger session revalidation without exposing user data.
  let timeout;
  const end = await Promise.race([reader.read(), new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('SSE no cerró tras revocar sesión')), 10000); })]).finally(() => clearTimeout(timeout));
  assert.equal(end.done, true);
  console.log('PASS HTTP: logout invalida API y cierra SSE antes de difundir eventos.');

  const newSellerToken = await login(seller);
  const disable = await request(`/api/users/${seller.id}/status`, adminToken, 'PATCH', { status: 'INACTIVO' });
  assert.equal(disable.status, 200);
  assert.equal((await request('/api/auth/me', newSellerToken)).status, 401);
  console.log('PASS HTTP: desactivar un usuario invalida su sesión.');

  const suites = [
    ['regression', ['--test', 'src/tests/hotfixRegression.test.ts']],
    ['print', ['src/tests/orderPrintVerification.test.ts']],
    ['pdf', ['src/tests/quotePdfVerification.test.ts']],
    ['returns', ['src/tests/returnE2EVerification.test.ts']],
    ['stock', ['scripts/test_observation_09.ts']],
    ['pod', ['scripts/test_observation_01_hotfix.ts']],
    ['rls', ['scripts/test-hotfix05.ts']],
    ['financial-approval', ['scripts/test_observation_16_hotfix.ts']],
  ];
  for (const [name, args] of suites) {
    const child = spawn(process.execPath, ['--import', 'tsx', ...args], {
      env: { ...process.env, DB_PATH: path.join(directory, name + '.json'), TEST_BASE_URL: baseURL, SEED_PASSWORD: password },
      stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
    process.stdout.write(output);
    assert.equal(code, 0, `${name}: salida distinta de cero`);
    assert.doesNotMatch(output, /\[FAIL\]|❌|Overall Success: FAIL|RESUMEN FINAL DE CERTIFICACIÓN:.*FALL/, `${name}: fallo reportado`);
    console.log(`PASS suite: ${name}`);
  }
  console.log('Verificación completa: todos los procesos y comprobaciones HTTP pasaron.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  streamController.abort();
  if (server.exitCode === null && !serverError) {
    const closed = new Promise(resolve => server.once('close', resolve));
    server.kill();
    await closed;
  }
  // Only remove the unique directory generated by this run beneath the OS temp root.
  const resolved = path.resolve(directory);
  if (path.dirname(resolved) === tempRoot && path.basename(resolved).startsWith('conscore-hotfix-')) {
    await rm(resolved, { recursive: true, force: true });
  }
}
