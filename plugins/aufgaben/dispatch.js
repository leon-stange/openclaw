const tools = catalog.all();
const dispatcher = tools.find(tool => tool.toolName === 'aufgaben_erinnerungen_pruefen');
if (!dispatcher) throw new Error('Gebundenes Aufgaben-Erinnerungstool fehlt im Automationskatalog.');
await dispatcher({});
return {};
