import { spawn } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";
import { sendDurableMessageBatch } from "openclaw/plugin-sdk/channel-outbound";
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
    inboxAlert: Type.Optional(Type.Object({
        automationId: Type.String({ pattern: "^[a-f0-9-]{36}$" }),
        dryRun: Type.Optional(Type.Boolean()),
    }, { additionalProperties: false })),
    shoppingReminder: Type.Optional(Type.Object({
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
export function shoppingReminderMessage(name, count) {
    return `Hallo ${name}, ${name === "Annka" ? "JARVIS" : "Jarvis"} hier. Ich habe festgestellt, dass auf eurer Einkaufsliste Einkaufen erst ${count} offene Artikel stehen. Die Liste scheint noch nicht vollständig zu sein und müsste noch ausgefüllt werden. Wenn ihr möchtet, kontaktiert mich per WhatsApp. Ich kann auch Artikel auf die Liste schreiben.`;
}
export function shoppingReminderPeriod(now = new Date()) {
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const day = new Date(`${date}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 3) % 7);
    return day.toISOString().slice(0, 10);
}
export function decideInboxAlert(state, unreadCount) {
    if (state.version !== 1 || typeof state.armed !== "boolean" || !Number.isSafeInteger(unreadCount) || unreadCount < 0) {
        throw new Error("Ungueltiger E-Mail-Warnzustand oder Zaehler; keine Aktion.");
    }
    const alert = unreadCount > 7 && state.armed;
    return { alert, state: { ...state, lastCount: unreadCount, armed: unreadCount < 7 ? true : alert ? false : state.armed } };
}
// Native plugin operation scoped to its configured job; no model-supplied CLI args.
async function inboxScratch(jobId, update, signal) {
    if (!/^[a-f0-9-]{36}$/.test(jobId))
        throw new Error("Ungueltige Automation-ID.");
    const args = ["automations", "scratch", jobId, "--json"];
    if (update)
        args.push("--set", update.content, "--expected-revision", String(update.revision));
    return await new Promise((resolve, reject) => {
        const child = spawn("openclaw", args, { windowsHide: true, stdio: ["ignore", "pipe", "ignore"], signal });
        const timer = setTimeout(() => { child.kill(); reject(new Error("Automation-Scratch-Zugriff hat das Zeitlimit erreicht.")); }, 20000);
        let stdout = "";
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (chunk) => {
            stdout += chunk;
            if (stdout.length > 524288) {
                child.kill();
                reject(new Error("Unerwartet grosser Scratch-Inhalt."));
            }
        });
        child.once("error", (error) => { clearTimeout(timer); reject(error); });
        child.once("close", (code) => {
            clearTimeout(timer);
            if (code !== 0) {
                reject(new Error("Automation-Scratch konnte nicht gelesen/atomar gespeichert werden; keine Aktion."));
                return;
            }
            try {
                const clean = stdout.replace(/\x1b\[[0-9;]*m/g, "");
                const result = JSON.parse(clean.slice(clean.indexOf("{")));
                if (!Number.isSafeInteger(result.currentRevision) || result.currentRevision < 0)
                    throw new Error("Ungueltige Scratch-Revision.");
                resolve(result);
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
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
class MeowCallerError extends Error {
    exitCode;
    stderr;
    constructor(exitCode, stderr) {
        super(`MeowCaller-Anruf fehlgeschlagen (Exit ${exitCode ?? "?"}): ${stderr.trim() || "keine Details"}`);
        this.exitCode = exitCode;
        this.stderr = stderr;
    }
}
export function isUnansweredCall(error) {
    return error instanceof MeowCallerError && error.exitCode === 1 &&
        /^recipient did not answer within \d+(?:\.\d+)?(?:ms|s|m|h)\s*$/m.test(error.stderr);
}
export async function callWithAudioFallback(params) {
    try {
        await params.call();
        return { called: true };
    }
    catch (error) {
        params.signal?.throwIfAborted();
        if (!params.fallbackOnCallError && !isUnansweredCall(error))
            throw error;
        return { called: false, fallbackMessageId: await params.sendAudio() };
    }
}
export async function runMeowCaller(params) {
    await new Promise((resolve, reject) => {
        const child = spawn(params.executable, ["notify", "--store", params.storePath, params.target, params.audioPath], {
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"],
            signal: params.signal,
        });
        const startedAt = new Date().toISOString();
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
        child.once("close", async (code) => {
            // Persist only our structured phases and known error classes, never raw logs,
            // phone numbers, credentials, audio text or paths from the CLI.
            const phases = [];
            for (const line of stderr.split("\n")) {
                try {
                    const event = JSON.parse(line);
                    if (typeof event.jarvis_call_event === "string" && /^[a-z_]+$/.test(event.jarvis_call_event)) {
                        phases.push({ phase: event.jarvis_call_event, ...(typeof event.time === "string" ? { time: event.time } : {}),
                            ...(Number.isSafeInteger(event.frames) ? { frames: event.frames } : {}) });
                    }
                }
                catch { /* Only structured phase events are retained. */ }
            }
            const known = stderr.split("\n").reverse().find(line => /^(call ended (before|during) playback:|recipient did not answer within|timed out waiting for WhatsApp connection|audio playback failed:|audio input contained no frames|notification exceeded)/.test(line));
            const reason = known?.replace(/\+?\d{10,16}(?:@(?:s\.whatsapp\.net|lid))?/g, "[redacted]").slice(0, 250)
                ?? (stderr.includes("Client outdated (405)") ? "Client outdated (405)" : code === 0 ? undefined : "Unclassified call failure");
            try {
                const dir = path.join(os.homedir(), ".openclaw", "state", "call-diagnostics");
                await fs.mkdir(dir, { recursive: true, mode: 0o700 });
                await fs.writeFile(path.join(dir, `${randomUUID()}.json`), JSON.stringify({
                    startedAt, endedAt: new Date().toISOString(), exitCode: code, phases, reason,
                    targetHash: createHash("sha256").update(params.target).digest("hex").slice(0, 16),
                }), { mode: 0o600 });
            }
            catch { /* A diagnostic storage failure must not change call delivery. */ }
            if (code === 0) {
                resolve();
                return;
            }
            reject(new MeowCallerError(code, stderr));
        });
    });
}
export function isDailyBriefingSession(sessionKey, agentId, automationId) {
    if (agentId !== "main" || !sessionKey || !/^[a-f0-9-]{36}$/.test(automationId))
        return false;
    const base = `agent:main:cron:${automationId}`;
    return sessionKey === base || sessionKey.startsWith(`${base}:run:`) && /^[a-f0-9-]{36}$/.test(sessionKey.slice(`${base}:run:`.length));
}
async function encodeVoiceNote(inputPath, outputPath, signal) {
    await new Promise((resolve, reject) => {
        const child = spawn("ffmpeg", ["-nostdin", "-hide_banner", "-loglevel", "error",
            "-i", inputPath, "-vn", "-ac", "1", "-ar", "48000", "-c:a", "libopus",
            "-b:a", "64k", outputPath], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"], signal });
        let stderr = "";
        child.stderr.setEncoding("utf8");
        child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-2000); });
        child.once("error", reject);
        child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`Audio-Konvertierung fehlgeschlagen (Exit ${code}): ${stderr}`)));
    });
}
async function deliverInboxAlert(params) {
    const { config, signal, assertCurrent } = params;
    signal?.throwIfAborted();
    assertCurrent?.();
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY;
    if (!apiKey)
        throw new Error("ElevenLabs-Key ist nicht gesetzt.");
    assertRateLimit(config.maxCallsPer10Minutes ?? 5);
    const accountId = config.accountId ?? "default";
    const storePath = path.join(os.homedir(), ".openclaw", "credentials", "whatsapp-calls", accountId, "wa-voip.db");
    await fs.access(storePath);
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-inbox-alert-"));
    const audioPath = path.join(tempDir, "alert.mp3");
    try {
        const audio = await synthesizeElevenLabs({ apiKey, voiceId: config.voiceId,
            model: config.model ?? "eleven_multilingual_v2", text: params.message, signal });
        await fs.writeFile(audioPath, audio, { mode: 0o600 });
        signal?.throwIfAborted();
        assertCurrent?.();
        const result = await callWithAudioFallback({
            signal,
            fallbackOnCallError: params.fallbackOnCallError,
            call: () => runMeowCaller({ executable: config.meowcallerPath ?? "meowcaller", storePath,
                target: params.target ?? config.authorizedCaller, audioPath, signal }),
            sendAudio: async () => {
                const voicePath = path.join(tempDir, "alert.ogg");
                await encodeVoiceNote(audioPath, voicePath, signal);
                await fs.chmod(voicePath, 0o600);
                signal?.throwIfAborted();
                assertCurrent?.();
                const sent = await sendDurableMessageBatch({ cfg: params.runtimeConfig, channel: "whatsapp",
                    to: params.target ?? config.authorizedCaller, accountId,
                    payloads: [{ mediaUrl: voicePath, audioAsVoice: true }], mediaAccess: { localRoots: [tempDir] },
                    signal, assertDirectAdapterHandoff: assertCurrent,
                    deliveryIntentId: `${params.intentPrefix ?? "inbox-alert-voice"}:${params.alertId}`, durability: "required" });
                if (sent.status !== "sent" || !sent.receipt.primaryPlatformMessageId) {
                    throw new Error("Nicht angenommen; Ersatz-Sprachnachricht nicht bestaetigt. Keine automatische Wiederholung.");
                }
                return sent.receipt.primaryPlatformMessageId;
            },
        });
        recordCall();
        return result;
    }
    finally {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
}
export default defineToolPlugin({
    id: "whatsapp-call-contact",
    name: "WhatsApp Call Contact",
    description: "Lets the OpenClaw owner call only pre-approved WhatsApp contacts. Audio is synthesized with ElevenLabs and delivered by MeowCaller.",
    configSchema,
    tools: (tool) => [
        tool({
            name: "whatsapp_weekly_shopping_reminder",
            label: "Weekly Shopping Reminder",
            description: "Bound weekly automation only: below ten open shopping items call Leon and Annka separately with personalized audio, voice fallback for call failure. At most once per Thursday cycle.",
            parameters: Type.Object({ openCount: Type.Integer({ minimum: 0, maximum: 1000000 }) }, { additionalProperties: false }),
            factory({ api, config, toolContext }) {
                const reminder = config.shoppingReminder;
                if (!reminder || !isDailyBriefingSession(toolContext.sessionKey, toolContext.agentId, reminder.automationId))
                    return null;
                const annka = findContact(config.contacts, "Annka");
                if (!annka || annka.phone === config.authorizedCaller)
                    throw new Error("Annka ist nicht eindeutig als anderer Kontakt konfiguriert.");
                return {
                    name: "whatsapp_weekly_shopping_reminder", label: "Weekly Shopping Reminder",
                    description: "Use the verified count of open items on Einkaufen. No call at ten or more. Calls fixed Leon and Annka, each once per weekly cycle. Never invent zero on an API failure.",
                    parameters: Type.Object({ openCount: Type.Integer({ minimum: 0, maximum: 1000000 }) }, { additionalProperties: false }),
                    executionMode: "sequential",
                    async execute(_id, raw, signal) {
                        const { openCount } = raw;
                        if (!Number.isSafeInteger(openCount) || openCount < 0)
                            throw new Error("Ungueltiger Artikelzaehler.");
                        const assertCurrent = toolContext.assertInvocationCurrent;
                        signal?.throwIfAborted();
                        assertCurrent?.();
                        const period = shoppingReminderPeriod();
                        const scratch = await inboxScratch(reminder.automationId, undefined, signal);
                        const state = scratch.scratch ? JSON.parse(scratch.scratch.content) : { version: 1 };
                        if (state.version !== 1)
                            throw new Error("Ungueltiger Erinnerungszustand.");
                        const wouldAlert = openCount < 10 && state.attemptedPeriod !== period;
                        const messages = [shoppingReminderMessage("Leon", openCount), shoppingReminderMessage("Annka", openCount)];
                        if (reminder.dryRun)
                            return { content: [{ type: "text", text: "Vorschau ohne Anruf, Versand oder Zustandsaenderung." }],
                                details: { dryRun: true, openCount, wouldAlert, messages } };
                        const next = { ...state, checkedAt: new Date().toISOString(), openCount,
                            ...(wouldAlert ? { attemptedPeriod: period } : {}) };
                        const saved = await inboxScratch(reminder.automationId, { content: JSON.stringify(next), revision: scratch.currentRevision }, signal);
                        if (!saved.ok)
                            throw new Error("Erinnerungszustand nicht gespeichert; keine Anrufe.");
                        if (!wouldAlert)
                            return { content: [{ type: "text", text: openCount >= 10 ? "Mindestens zehn offene Artikel; keine Erinnerung." : "Diese Woche bereits versucht; keine Wiederholung." }], details: { openCount, alerted: false } };
                        const results = [];
                        for (const [index, contact] of [{ name: "Leon", phone: config.authorizedCaller }, { name: "Annka", phone: annka.phone }].entries()) {
                            signal?.throwIfAborted();
                            assertCurrent?.();
                            try {
                                const outcome = await deliverInboxAlert({ config,
                                    runtimeConfig: toolContext.getRuntimeConfig?.() ?? toolContext.runtimeConfig ?? api.config,
                                    message: messages[index], alertId: `${reminder.automationId}:${period}:${contact.name}`,
                                    target: contact.phone, fallbackOnCallError: true, intentPrefix: "shopping-reminder-voice", assertCurrent, signal });
                                results.push({ contact: contact.name, success: true, ...outcome });
                            }
                            catch {
                                signal?.throwIfAborted();
                                assertCurrent?.();
                                results.push({ contact: contact.name, success: false, error: "Anruf/Audio nicht bestaetigt; keine automatische Wiederholung." });
                            }
                        }
                        return { content: [{ type: "text", text: JSON.stringify(results) }], details: { openCount, alerted: true, results } };
                    },
                };
            },
        }),
        tool({
            name: "whatsapp_check_unread_mail_alert",
            label: "Unread Mail Threshold Alert",
            description: "Apply the persistent unread-mail threshold gate for the bound hourly automation. Above seven call Leon once; rearm only below seven. Unanswered calls send the same audio as a voice note.",
            parameters: Type.Object({
                unreadCount: Type.Integer({ minimum: 0, maximum: 1000000 }),
                latest: Type.Array(Type.Object({
                    from: Type.String({ maxLength: 500 }),
                    subject: Type.String({ maxLength: 500 }),
                }, { additionalProperties: false }), { maxItems: 2 }),
            }, { additionalProperties: false }),
            factory({ api, config, toolContext }) {
                const alertConfig = config.inboxAlert;
                if (!alertConfig || !isDailyBriefingSession(toolContext.sessionKey, toolContext.agentId, alertConfig.automationId))
                    return null;
                const assertCurrent = toolContext.assertInvocationCurrent;
                return {
                    name: "whatsapp_check_unread_mail_alert",
                    label: "Unread Mail Threshold Alert",
                    description: "Persist threshold state for this hourly job, call fixed target Leon once above seven, rearm below seven. Never infer zero on a failed mail fetch.",
                    parameters: Type.Object({
                        unreadCount: Type.Integer({ minimum: 0, maximum: 1000000 }),
                        latest: Type.Array(Type.Object({ from: Type.String({ maxLength: 500 }), subject: Type.String({ maxLength: 500 }) }, { additionalProperties: false }), { maxItems: 2 }),
                    }, { additionalProperties: false }),
                    executionMode: "sequential",
                    async execute(_toolCallId, raw, signal) {
                        const params = raw;
                        signal?.throwIfAborted();
                        assertCurrent?.();
                        const scratch = await inboxScratch(alertConfig.automationId, undefined, signal);
                        const state = scratch.scratch ? JSON.parse(scratch.scratch.content) : { version: 1, armed: true };
                        const decision = decideInboxAlert(state, params.unreadCount);
                        if (decision.alert && params.latest.length !== 2)
                            throw new Error("Zwei neueste E-Mails fehlen; Zustand unveraendert.");
                        if (alertConfig.dryRun)
                            return {
                                content: [{ type: "text", text: "Vorschau: keine Zustandsaenderung und kein Anruf." }],
                                details: { dryRun: true, wouldAlert: decision.alert, unreadCount: params.unreadCount, armed: decision.state.armed },
                            };
                        const checkedAt = new Date().toISOString();
                        const nextState = { ...decision.state, checkedAt,
                            ...(decision.alert ? { alertId: randomUUID(), attemptedAt: checkedAt } : {}) };
                        signal?.throwIfAborted();
                        assertCurrent?.();
                        const saved = await inboxScratch(alertConfig.automationId, {
                            content: JSON.stringify(nextState), revision: scratch.currentRevision,
                        }, signal);
                        if (!saved.ok)
                            throw new Error("Warnzustand wurde gleichzeitig geaendert; keine Aktion.");
                        if (!decision.alert)
                            return {
                                content: [{ type: "text", text: nextState.armed ? "Keine Warnung; Schwelle wieder freigegeben." : "Keine weitere Warnung; Sperre aktiv." }],
                                details: { alerted: false, unreadCount: params.unreadCount, armed: nextState.armed },
                            };
                        const clean = (value, fallback) => value.replace(/\s+/g, " ").trim().slice(0, 180) || fallback;
                        const latest = params.latest.map((mail, index) => `${index + 1}: Von ${clean(mail.from, "unbekanntem Absender")}. Betreff: ${clean(mail.subject, "ohne Betreff")}.`).join(" ");
                        const message = `Hallo Leon, Jarvis hier. Du hast ${params.unreadCount} ungelesene E-Mails im Posteingang. Es sind viele E-Mails offen. Die zwei neuesten: ${latest}`;
                        const outcome = await deliverInboxAlert({ config,
                            runtimeConfig: toolContext.getRuntimeConfig?.() ?? toolContext.runtimeConfig ?? api.config,
                            message, alertId: nextState.alertId, assertCurrent, signal });
                        return {
                            content: [{ type: "text", text: outcome.called ? "E-Mail-Warnanruf abgeschlossen; Sperre aktiv."
                                        : "Nicht angenommen; E-Mail-Warnung als Sprachnachricht gesendet; Sperre aktiv." }],
                            details: { alerted: true, unreadCount: params.unreadCount, armed: false, ...outcome },
                        };
                    },
                };
            },
        }),
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
            factory({ api, config, toolContext }) {
                const briefing = config.dailyBriefing;
                if (!briefing || !isDailyBriefingSession(toolContext.sessionKey, toolContext.agentId, briefing.automationId))
                    return null;
                const names = "Leon";
                const assertCurrent = toolContext.assertInvocationCurrent;
                return {
                    name: "whatsapp_call_daily_briefing",
                    label: "Daily Outlook Briefing",
                    description: "Deliver the daily briefing to Leon only. If unanswered after 45 seconds, send the same audio as a WhatsApp voice note. No second call. In dry-run mode return a preview only.",
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
                        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-daily-briefing-"));
                        const tempAudio = path.join(tempDir, "briefing.mp3");
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
                            const outcome = await callWithAudioFallback({
                                signal,
                                call: () => runMeowCaller({
                                    executable: config.meowcallerPath ?? "meowcaller",
                                    storePath,
                                    target: contact.phone,
                                    audioPath: tempAudio,
                                    signal,
                                }),
                                sendAudio: async () => {
                                    signal?.throwIfAborted();
                                    assertCurrent?.();
                                    const voicePath = path.join(tempDir, "briefing.ogg");
                                    await encodeVoiceNote(tempAudio, voicePath, signal);
                                    await fs.chmod(voicePath, 0o600);
                                    signal?.throwIfAborted();
                                    assertCurrent?.();
                                    const sent = await sendDurableMessageBatch({
                                        cfg: toolContext.getRuntimeConfig?.() ?? toolContext.runtimeConfig ?? api.config,
                                        channel: "whatsapp",
                                        to: contact.phone,
                                        accountId,
                                        payloads: [{ mediaUrl: voicePath, audioAsVoice: true }],
                                        mediaAccess: { localRoots: [tempDir] },
                                        signal,
                                        assertDirectAdapterHandoff: assertCurrent,
                                        deliveryIntentId: `daily-briefing-voice:${briefing.automationId}:${day}`,
                                        durability: "required",
                                    });
                                    if (sent.status !== "sent" || !sent.receipt.primaryPlatformMessageId) {
                                        throw new Error("Anruf nicht angenommen; Ersatz-Sprachnachricht nicht erfolgreich bestaetigt. Keine automatische Wiederholung.");
                                    }
                                    return sent.receipt.primaryPlatformMessageId;
                                },
                            });
                            recordCall();
                            return {
                                content: [
                                    {
                                        type: "text",
                                        text: outcome.called
                                            ? `WhatsApp-Anruf an ${contact.name} wurde erfolgreich abgespielt und beendet.`
                                            : `Anruf nicht angenommen; dieselbe Audio wurde als WhatsApp-Sprachnachricht an ${contact.name} gesendet.`,
                                    },
                                ],
                                details: {
                                    success: true,
                                    contact: contact.name,
                                    ...outcome,
                                },
                            };
                        }
                        finally {
                            await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
                        }
                    },
                };
            },
        }),
    ],
});
