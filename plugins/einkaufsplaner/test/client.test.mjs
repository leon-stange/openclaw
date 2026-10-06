import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ShoppingClient } from '../src/client.mjs';
const listId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const response = (body, status = 200, cookie = false) => ({
  ok: status === 200, status, json: async () => body,
  headers: { getSetCookie: () => cookie ? ['bhd_session=test-session; HttpOnly; Path=/'] : [] },
});
async function fixture(fn) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'shopping-test-'));
  const passwordFile = path.join(root, 'password');
  await writeFile(passwordFile, 'test-password\n', { mode: 0o600 });
  const calls = [];
  const client = new ShoppingClient({ passwordFile, stateDir: path.join(root, 'ledger'), fetchImpl: async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/login')) return response({ user: { username: 'Jarvis', role: 'USER', groupId: 'group' }, csrfToken: 'test-csrf' }, 200, true);
    if (url.endsWith('/lists')) return response({ lists: [{ id: listId, name: 'Einkaufen' }] });
    return response({ list: { id: listId }, items: [], item: { id: 'item' } });
  } });
  try { await fn({ client, calls, root }); } finally { await rm(root, { recursive: true, force: true }); }
}
test('login uses fixed Jarvis identity, cookie and default list', () => fixture(async ({ client, calls }) => {
  assert.equal((await client.list()).list.id, listId);
  assert.deepEqual(JSON.parse(calls[0].options.body), { username: 'Jarvis', password: 'test-password' });
  assert.equal(calls[1].options.headers.cookie, 'bhd_session=test-session');
  assert.equal(calls[0].options.redirect, 'error');
}));
test('write passes CSRF and same tool-call replay returns stored result', () => fixture(async ({ client, calls }) => {
  await client.list();
  const route = `/lists/${listId}/items`, body = { name: 'Milch', quantity: 1000, unit: 'ml' };
  const first = await client.mutate('call-1', route, body);
  const second = await client.mutate('call-1', route, body);
  assert.deepEqual(first, second);
  assert.equal(calls.filter(x => x.options.method === 'POST' && x.url.endsWith('/items')).length, 1);
  assert.equal(calls.at(-1).options.headers['x-csrf-token'], 'test-csrf');
  await assert.rejects(client.mutate('call-1', route, { name: 'Brot' }), /bereits begonnen/);
}));
test('uncertain mutation remains locked across client recreation', () => fixture(async ({ client, root }) => {
  await client.list();
  client.fetch = async () => { throw new Error('network'); };
  await assert.rejects(client.mutate('uncertain', `/lists/${listId}/items`, { name: 'Milch' }), /unklar/);
  const replacement = new ShoppingClient({ passwordFile: client.passwordFile, stateDir: path.join(root, 'ledger'), fetchImpl: () => assert.fail('must not retry') });
  await assert.rejects(replacement.mutate('uncertain', `/lists/${listId}/items`, { name: 'Milch' }), /bereits begonnen/);
}));
test('ambiguous list prevents writes', () => fixture(async ({ client }) => {
  await client.login();
  client.fetch = async () => response({ lists: [{ id: listId, name: 'Einkaufen' }, { id: listId, name: 'Einkaufen' }] });
  await assert.rejects(client.list(), /nicht eindeutig/);
}));
test('expired session can relogin before read', () => fixture(async ({ client, calls }) => {
  await client.list();
  const normal = client.fetch;
  let expire = true;
  client.fetch = async (url, options) => {
    if (url.endsWith('/lists') && expire) { expire = false; return response({}, 401); }
    return normal(url, options);
  };
  await client.list();
  assert.equal(calls.filter(x => x.url.endsWith('/auth/login')).length, 2);
}));
test('aborted invocation never sends request', () => fixture(async ({ client, calls }) => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(client.list('Einkaufen', controller.signal));
  assert.equal(calls.length, 0);
}));
