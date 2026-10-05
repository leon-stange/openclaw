import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";
const e164Pattern = "^\\+[1-9]\\d{7,14}$";
const contactSchema = Type.Object({
    name: Type.String({ minLength: 1, maxLength: 80 }),
    phone: Type.String({ pattern: e164Pattern }),
    aliases: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 80 }), { maxItems: 10 })),
}, { additionalProperties: false });
const configSchema = Type.Object({
    dailyBriefing: Type.Optional(Type.Object({
        automationId: Type.String({ pattern: "^[a-f0-9-]{36}$" }),
        dryRun: Type.Optional(Type.Boolean()),
    }, { additionalProperties: false })),
    authorizedCaller: Type.String({
        pattern: e164Pattern,
        description: "Setup reference for the intended owner number. Runtime authorization uses OpenClaw senderIsOwner / commands.ownerAllowFrom so WhatsApp LID senders work correctly.",
    }),
    contacts: Type.Array(contactSchema, {
        minItems: 1,
        maxItems: 50,
        description: "Pre-approved WhatsApp call targets. The model never supplies a phone number directly.",
    }),
    voiceId: Type.String({ minLength: 1, description: "ElevenLabs voice id." }),
    model: Type.Optional(Type.String({ minLength: 1, description: "ElevenLabs TTS model id." })),
    accountId: Type.Optional(Type.String({ minLength: 1, description: "MeowCaller/OpenClaw WhatsApp call account id." })),
    meowcallerPath: Type.Optional(Type.String({ minLength: 1, description: "Path or command name for meowcaller." })),
    maxMessageChars: Type.Optional(Type.Integer({ minimum: 50, maximum: 1000 })),
    maxCallsPer10Minutes: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })),
}, { additionalProperties: false });
const recentCalls = [];
function normalizeName(value) {
    return value.trim().toLocaleLowerCase("de-DE");
}
function findContact(contacts, requested) {
    const needle = normalizeName(requested);
    return contacts.find((contact) => {
        if (normalizeName(contact.name) === needle)
            return true;
        return (contact.aliases ?? []).some((alias) => normalizeName(alias) === needle);
    });
}
function assertRateLimit(maxCalls) {
    const now = Date.now();
    const cutoff = now - 10 * 60 * 1000;
    while (recentCalls.length > 0 && recentCalls[0] < cutoff)
        recentCalls.shift();
    if (recentCalls.length >= maxCalls) {
        throw new Error(`Anruflimit erreicht: maximal ${maxCalls} Anrufe in 10 Minuten.`);
    }
}
function recordCall() {
    recentCalls.push(Date.now());
}
async function synthesizeElevenLabs(params) {
    const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(params.voiceId)}`);
    url.searchParams.set("output_format", "mp3_44100_128");
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "xi-api-key": params.apiKey,
            "content-type": "application/json",
            accept: "audio/mpeg",
        },
        body: JSON.stringify({
            text: params.text,
            model_id: params.model,
        }),
        signal: params.signal,
    });
    if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);
        throw new Error(`ElevenLabs TTS fehlgeschlagen (${response.status}): ${detail}`);
    }
    return Buffer.from(await response.arrayBuffer());
}
async function runMeowCaller(params) {
    await new Promise((resolve, reject) => {
        const child = spawn(params.executable, ["notify", "--store", params.storePath, params.target, params.audioPath], {
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"],
            signal: params.signal,
        });
        let stderr = "";
        child.stderr.setEncoding("utf8");
        child.stderr.on("data", (chunk) => {
            stderr += chunk;
            if (stderr.length > 4000)
                stderr = stderr.slice(-4000);
        });
        child.once("error", (error) => {
            reject(new Error(`MeowCaller konnte nicht gestartet werden: ${error.message}`));
        });
        child.once("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(`MeowCaller-Anruf fehlgeschlagen (Exit ${code ?? "?"}): ${stderr.trim() || "keine Details"}`));
        });
    });
}
export function isDailyBriefingSession(sessionKey, agentId, automationId) {
    if (agentId !== "main" || !sessionKey || !/^[a-f0-9-]{36}$/.test(automationId))
        return false;
    const base = `agent:main:cron:${automationId}`;
    return sessionKey === base || sessionKey.startsWith(`${base}:run:`) && /^[a-f0-9-]{36}$/.test(sessionKey.slice(`${base}:run:`.length));
}
export default defineToolPlugin({
    id: "whatsapp-call-contact",
    name: "WhatsApp Call Contact",
    description: "Lets the OpenClaw owner call only pre-approved WhatsApp contacts. Audio is synthesized with ElevenLabs and delivered by MeowCaller.",
    configSchema,
    tools: (tool) => [
        tool({
            name: "whatsapp_call_contact",
            label: "WhatsApp Call Contact",
            description: "Call a pre-approved contact over WhatsApp and play a short spoken message. Use a configured contact name/alias only; never invent or pass a phone number.",
            parameters: Type.Object({
                contact: Type.String({ minLength: 1, maxLength: 80, description: "Configured contact name or alias." }),
                message: Type.String({ minLength: 1, maxLength: 1000, description: "Exact message to speak during the call." }),
            }, { additionalProperties: false }),
            factory({ config, toolContext }) {
                if (toolContext.messageChannel !== "whatsapp")
                    return null;
                // WhatsApp may expose the requester as a LID JID instead of an E.164 number.
                // Trust OpenClaw's own owner authorization rather than comparing the raw sender id.
                if (toolContext.senderIsOwner !== true)
                    return null;
                const names = config.contacts.map((contact) => contact.name).join(", ");
                const assertCurrent = toolContext.assertInvocationCurrent;
                return {
                    name: "whatsapp_call_contact",
                    label: "WhatsApp Call Contact",
                    description: `Call one pre-approved WhatsApp contact and play a message. Available contacts: ${names}. Never use a phone number supplied by the conversation; choose only one configured contact name or alias.`,
                    parameters: Type.Object({
                        contact: Type.String({ minLength: 1, maxLength: 80 }),
                        message: Type.String({ minLength: 1, maxLength: 1000 }),
                    }, { additionalProperties: false }),
                    executionMode: "sequential",
                    async execute(_toolCallId, rawParams, signal) {
                        const params = rawParams;
                        signal?.throwIfAborted();
                        const contact = findContact(config.contacts, params.contact);
                        if (!contact) {
                            throw new Error(`Kontakt nicht freigegeben. Erlaubt sind: ${names}.`);
                        }
                        const maxChars = config.maxMessageChars ?? 450;
                        const message = params.message.trim();
                        if (!message)
                            throw new Error("Die Anrufnachricht ist leer.");
                        if (message.length > maxChars) {
                            throw new Error(`Die Anrufnachricht ist zu lang (${message.length}/${maxChars} Zeichen).`);
                        }
                        const apiKey = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY;
                        if (!apiKey) {
                            throw new Error("ELEVENLABS_API_KEY/XI_API_KEY ist im Gateway-Prozess nicht gesetzt.");
                        }
                        assertRateLimit(config.maxCallsPer10Minutes ?? 5);
                        const accountId = config.accountId ?? "default";
                        const storePath = path.join(os.homedir(), ".openclaw", "credentials", "whatsapp-calls", accountId, "wa-voip.db");
                        await fs.access(storePath);
                        const tempAudio = path.join(os.tmpdir(), `openclaw-contact-call-${randomUUID()}.mp3`);
                        try {
                            const audio = await synthesizeElevenLabs({
                                apiKey,
                                voiceId: config.voiceId,
                                model: config.model ?? "eleven_multilingual_v2",
                                text: message,
                                signal,
                            });
                            await fs.writeFile(tempAudio, audio, { mode: 0o600 });
                            signal?.throwIfAborted();
                            assertCurrent?.();
                            await runMeowCaller({
                                executable: config.meowcallerPath ?? "meowcaller",
                                storePath,
                                target: contact.phone,
                                audioPath: tempAudio,
                                signal,
                            });
                            recordCall();
                            return {
                                content: [
                                    {
                                        type: "text",
                                        text: `WhatsApp-Anruf an ${contact.name} wurde erfolgreich abgespielt und beendet.`,
                                    },
                                ],
                                details: {
                                    success: true,
                                    contact: contact.name,
                                },
                            };
                        }
                        finally {
                            await fs.rm(tempAudio, { force: true }).catch(() => undefined);
                        }
                    },
                };
            },
        }),
        tool({
            name: "whatsapp_call_contacts",
            label: "WhatsApp Call Contacts",
            description: "List the pre-approved WhatsApp contacts that the current authorized owner may call.",
            parameters: Type.Object({}, { additionalProperties: false }),
            factory({ config, toolContext }) {
                if (toolContext.messageChannel !== "whatsapp")
                    return null;
                // Same owner gate as whatsapp_call_contact; this also works for WhatsApp LID senders.
                if (toolContext.senderIsOwner !== true)
                    return null;
                return {
                    name: "whatsapp_call_contacts",
                    label: "WhatsApp Call Contacts",
                    description: "List the names and aliases of contacts approved for WhatsApp calls. Phone numbers are intentionally not returned.",
                    parameters: Type.Object({}, { additionalProperties: false }),
                    async execute() {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Freigegebene Anrufkontakte: ${config.contacts.map((c) => c.name).join(", ")}.`,
                                },
                            ],
                            details: {
                                contacts: config.contacts.map((contact) => ({
                                    name: contact.name,
                                    aliases: contact.aliases ?? [],
                                })),
                            },
                        };
                    },
                };
            },
        }),
        tool({
            name: "whatsapp_call_daily_briefing",
            label: "Daily Outlook Briefing",
            description: "Call Leon with the daily Outlook and unread-mail briefing. Available only to the explicitly configured isolated automation. Target is fixed; accepts message only.",
            parameters: Type.Object({
                message: Type.String({ minLength: 1, maxLength: 1800, description: "Exact message to speak during the call." }),
            }, { additionalProperties: false }),
            factory({ config, toolContext }) {
                const briefing = config.dailyBriefing;
                if (!briefing || !isDailyBriefingSession(toolContext.sessionKey, toolContext.agentId, briefing.automationId))
                    return null;
                const names = "Leon";
                const assertCurrent = toolContext.assertInvocationCurrent;
                return {
                    name: "whatsapp_call_daily_briefing",
                    label: "Daily Outlook Briefing",
                    description: "Deliver the daily briefing to Leon only. Target is fixed. In dry-run mode return a preview without TTS or a call.",
                    parameters: Type.Object({
                        message: Type.String({ minLength: 1, maxLength: 1800 }),
                    }, { additionalProperties: false }),
                    executionMode: "sequential",
                    async execute(_toolCallId, rawParams, signal) {
                        const params = rawParams;
                        signal?.throwIfAborted();
                        const contact = { name: "Leon", phone: config.authorizedCaller };
                        const maxChars = 1800;
                        const message = params.message.trim();
                        if (!message)
                            throw new Error("Die Anrufnachricht ist leer.");
                        if (message.length > maxChars) {
                            throw new Error(`Die Anrufnachricht ist zu lang (${message.length}/${maxChars} Zeichen).`);
                        }
                        assertCurrent?.();
                        if (briefing.dryRun === true) {
                            return { content: [{ type: "text", text: `Vorschau ohne Anruf: ${message}` }], details: { dryRun: true, called: false, message } };
                        }
                        const apiKey = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY;
                        if (!apiKey) {
                            throw new Error("ELEVENLABS_API_KEY/XI_API_KEY ist im Gateway-Prozess nicht gesetzt.");
                        }
                        assertRateLimit(config.maxCallsPer10Minutes ?? 5);
                        const accountId = config.accountId ?? "default";
                        const storePath = path.join(os.homedir(), ".openclaw", "credentials", "whatsapp-calls", accountId, "wa-voip.db");
                        await fs.access(storePath);
                        const tempAudio = path.join(os.tmpdir(), `openclaw-contact-call-${randomUUID()}.mp3`);
                        try {
                            const audio = await synthesizeElevenLabs({
                                apiKey,
                                voiceId: config.voiceId,
                                model: config.model ?? "eleven_multilingual_v2",
                                text: message,
                                signal,
                            });
                            await fs.writeFile(tempAudio, audio, { mode: 0o600 });
                            signal?.throwIfAborted();
                            assertCurrent?.();
                            const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
                            const stateDir = path.join(os.homedir(), ".openclaw", "state", "daily-briefing-calls");
                            await fs.mkdir(stateDir, { recursive: true, mode: 0o700 });
                            assertCurrent?.();
                            const marker = await fs.open(path.join(stateDir, `${briefing.automationId}-${day}.json`), "wx", 0o600).catch((error) => {
                                if (error.code === "EEXIST")
                                    throw new Error("Der heutige Automationsanruf wurde bereits versucht; keine automatische Wiederholung.");
                                throw error;
                            });
                            try {
                                await marker.writeFile(JSON.stringify({ attemptedAt: new Date().toISOString() }));
                            }
                            finally {
                                await marker.close();
                            }
                            signal?.throwIfAborted();
                            assertCurrent?.();
                            await runMeowCaller({
                                executable: config.meowcallerPath ?? "meowcaller",
                                storePath,
                                target: contact.phone,
                                audioPath: tempAudio,
                                signal,
                            });
                            recordCall();
                            return {
                                content: [
                                    {
                                        type: "text",
                                        text: `WhatsApp-Anruf an ${contact.name} wurde erfolgreich abgespielt und beendet.`,
                                    },
                                ],
                                details: {
                                    success: true,
                                    contact: contact.name,
                                },
                            };
                        }
                        finally {
                            await fs.rm(tempAudio, { force: true }).catch(() => undefined);
                        }
                    },
                };
            },
        }),
    ],
});
