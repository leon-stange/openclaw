import test from 'node:test';
import assert from 'node:assert/strict';
import { isWeeklyReadContext } from '../src/index.js';
test('weekly automation can only read with exact trusted job context', () => {
  const id='6e6d41db-2988-4b6c-9bff-b5322527cbd2';
  const c={agentId:'main',sessionKey:`agent:main:cron:${id}`};
  assert.equal(isWeeklyReadContext('einkauf_liste_lesen',c,id),true);
  assert.equal(isWeeklyReadContext('einkauf_artikel_hinzufuegen',c,id),false);
  assert.equal(isWeeklyReadContext('einkauf_artikel_abhaken',c,id),false);
  assert.equal(isWeeklyReadContext('einkauf_liste_lesen',{...c,sessionKey:c.sessionKey+':wrong'},id),false);
  assert.equal(isWeeklyReadContext('einkauf_liste_lesen',{...c,agentId:'other'},id),false);
});
