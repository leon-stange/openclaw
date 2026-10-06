import os from 'node:os';
import path from 'node:path';
import { ShoppingClient } from './dist/client.mjs';
const root = path.join(os.homedir(), '.local/share/jarvis-einkaufsplaner');
const client = new ShoppingClient({ passwordFile: path.join(root, 'password'), stateDir: path.join(root, 'state') });
try {
  const data = await client.list();
  console.log(`OK: Als Jarvis angemeldet. Liste Einkaufen gefunden: ${data.items.filter(x => !x.completed).length} offene Artikel. Keine Artikel verändert.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
