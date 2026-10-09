import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

export class ShoppingClient {
  constructor({ passwordFile, stateDir, fetchImpl = fetch }) {
    this.passwordFile = passwordFile;
    this.stateDir = stateDir;
    this.fetch = fetchImpl;
    this.cookie = null;
    this.csrf = null;
  }

  async request(route, { method = 'GET', body, signal, assertCurrent } = {}) {
    signal?.throwIfAborted();
    assertCurrent?.();
    const headers = { accept: 'application/json' };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (this.cookie) headers.cookie = this.cookie;
    if (method !== 'GET' && this.csrf) headers['x-csrf-token'] = this.csrf;
    let response;
    try {
      response = await this.fetch(`https://app.stangeleon.de/api${route}`, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error(method === 'GET' ? 'Einkaufs-App nicht erreichbar.' :
        'API-Antwort unklar. Auftrag nicht automatisch wiederholen; zuerst die Liste prüfen.');
    }
    if (!response.ok) {
      if (response.status === 401) { this.cookie = null; this.csrf = null; }
      throw new Error(`Einkaufs-App meldet HTTP ${response.status}; keine automatische Wiederholung.`);
    }
    let data;
    try { data = await response.json(); } catch { throw new Error('Ungültige API-Antwort; zuerst die Liste prüfen.'); }
    return { data, response };
  }

  async login(signal, assertCurrent) {
    this.cookie = null; this.csrf = null;
    const info = await stat(this.passwordFile);
    if (!info.isFile() || (process.platform !== 'win32' && (info.mode & 0o077))) {
      throw new Error('Passwortdatei muss eine private Datei mit Modus 600 sein.');
    }
    const password = (await readFile(this.passwordFile, 'utf8')).replace(/\r?\n$/, '');
    if (!password) throw new Error('Jarvis-Passwort fehlt.');
    const { data, response } = await this.request('/auth/login', {
      method: 'POST', body: { username: 'Jarvis', password }, signal, assertCurrent,
    });
    const cookie = response.headers.getSetCookie().find(x => x.startsWith('bhd_session='))?.split(';')[0];
    if (!cookie || typeof data.csrfToken !== 'string' || !data.csrfToken ||
        data.user?.username?.toLowerCase() !== 'jarvis' || data.user.role !== 'USER' || !data.user.groupId) {
      throw new Error('Jarvis-Anmeldung oder Gruppenzuordnung nicht bestätigt.');
    }
    this.cookie = cookie; this.csrf = data.csrfToken;
  }

  async lists(signal, assertCurrent) {
    if (!this.cookie) await this.login(signal, assertCurrent);
    let result;
    try { result = await this.request('/lists', { signal, assertCurrent }); }
    catch (error) {
      // Reauthenticate only before a read, never repeat an uncertain mutation.
      if (this.cookie) throw error;
      await this.login(signal, assertCurrent);
      result = await this.request('/lists', { signal, assertCurrent });
    }
    if (!Array.isArray(result.data.lists)) throw new Error('Listen-Antwort ungültig.');
    return result.data.lists;
  }

  async list(name = 'Einkaufen', signal, assertCurrent) {
    const lists = await this.lists(signal, assertCurrent);
    const matches = lists.filter(x => typeof x.name === 'string' && x.name.toLocaleLowerCase('de-DE') === name.trim().toLocaleLowerCase('de-DE'));
    if (matches.length !== 1) throw new Error('Listenname fehlt oder ist nicht eindeutig. Bitte eine eindeutige Liste nennen.');
    const id = matches[0].id;
    if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error('Listen-ID ungültig.');
    const { data } = await this.request(`/lists/${id}`, { signal, assertCurrent });
    if (data.list?.id !== id || !Array.isArray(data.items)) throw new Error('Artikel-Antwort ungültig.');
    return data;
  }

  async meals(signal, assertCurrent) {
    if (!this.cookie) await this.login(signal, assertCurrent);
    let result;
    try { result = await this.request('/meals', { signal, assertCurrent }); }
    catch (error) {
      if (this.cookie) throw error;
      await this.login(signal, assertCurrent);
      result = await this.request('/meals', { signal, assertCurrent });
    }
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    if (!Array.isArray(result.data.meals) || result.data.meals.some(m =>
      !m || typeof m.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(m.id) ||
      typeof m.name !== 'string' || !m.name.trim() || m.name.length > 150 ||
      !(m.weekday === null || days.includes(m.weekday)) ||
      !(m.information === null || typeof m.information === 'string' && m.information.length <= 500) ||
      !Array.isArray(m.bulletPoints) || m.bulletPoints.length > 12 ||
      m.bulletPoints.some(p => typeof p !== 'string' || p.length > 120) ||
      m.archivedAt !== null || m.cookedAt !== null)) {
      throw new Error('Essensplan-Antwort ungueltig; keine verlaessliche Zusammenfassung moeglich.');
    }
    return result.data.meals.map(({ id, name, weekday, information, bulletPoints }) =>
      ({ id, name, weekday, information, bulletPoints }));
  }

  async mutate(toolCallId, route, body, signal, assertCurrent) {
    if (typeof toolCallId !== 'string' || !toolCallId) throw new Error('Auftrags-ID fehlt.');
    signal?.throwIfAborted(); assertCurrent?.();
    await mkdir(this.stateDir, { recursive: true, mode: 0o700 });
    const key = createHash('sha256').update(toolCallId).digest('hex');
    const fingerprint = createHash('sha256').update(JSON.stringify({ route, body })).digest('hex');
    const file = path.join(this.stateDir, `${key}.json`);
    try { await writeFile(file, JSON.stringify({ fingerprint, status: 'started' }), { flag: 'wx', mode: 0o600 }); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const previous = JSON.parse(await readFile(file, 'utf8'));
      if (previous.fingerprint === fingerprint && previous.status === 'done') return previous.result;
      throw new Error('Dieser Auftrag wurde bereits begonnen. Nicht erneut ausführen; zuerst die Liste prüfen.');
    }
    const { data } = await this.request(route, {
      method: route.endsWith('/items') ? 'POST' : 'PATCH', body, signal, assertCurrent,
    });
    if (!data.item?.id) throw new Error('Speicherung nicht bestätigt; zuerst die Liste prüfen.');
    const result = { success: true, itemId: data.item.id };
    await writeFile(file, JSON.stringify({ fingerprint, status: 'done', result }), { mode: 0o600 });
    return result;
  }
}
