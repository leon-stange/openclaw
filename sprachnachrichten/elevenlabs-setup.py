#!/usr/bin/env python3
"""Secret entry and scoped deactivation, run as leon on Ubuntu. No API calls."""
import argparse
import getpass
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
from datetime import datetime


def private_write(target, content):
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.is_symlink():
        raise RuntimeError("Zieldatei ist ein Symlink; bitte zuerst prüfen.")
    fd, temporary = tempfile.mkstemp(prefix=".jarvis-", dir=target.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            stream.write(content)
        os.chmod(temporary, 0o600)
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def set_key(home):
    env_file = home / ".openclaw/elevenlabs.env"
    if env_file.is_symlink():
        raise RuntimeError("elevenlabs.env ist ein Symlink; zuerst prüfen.")
    original = env_file.read_text(encoding="utf-8") if env_file.exists() else ""
    key = getpass.getpass("Neuer ElevenLabs-Key (Eingabe unsichtbar): ").strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]{20,}", key):
        raise RuntimeError("Key leer oder unerwartetes Format. Es wurde nichts geändert.")
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    if env_file.exists():
        private_write(env_file.with_name(f"elevenlabs.env.vor-umstellung-{stamp}"), original)
    # Preserve unrelated environment variables. Also update the compatibility alias if present.
    lines = [line for line in original.splitlines()
             if not re.match(r"^\s*(?:export\s+)?(?:ELEVENLABS_API_KEY|XI_API_KEY)\s*=", line)]
    lines.append(f"ELEVENLABS_API_KEY={key}")
    if re.search(r"(?m)^\s*(?:export\s+)?XI_API_KEY\s*=", original):
        lines.append(f"XI_API_KEY={key}")
    private_write(env_file, "\n".join(lines) + "\n")
    # A dedicated late drop-in preserves the existing service and its other EnvironmentFiles.
    drop_in = home / ".config/systemd/user/openclaw-gateway.service.d/zz-jarvis-elevenlabs.conf"
    private_write(drop_in, f'[Service]\nEnvironmentFile="{env_file}"\n')
    print("Key privat gespeichert; Gateway-EnvironmentFile vorbereitet. Kein Key ausgegeben.")


def disable_local(home):
    config = json.loads((home / ".openclaw/openclaw.json").read_text(encoding="utf-8"))
    media = config.get("tools", {}).get("media", {})
    models = media.get("models", [])
    audio = [model for model in models
             if "audio" in model.get("capabilities", ["audio"])]
    if not (media.get("audio", {}).get("enabled") is True and len(audio) == 1
            and audio[0].get("provider") == "elevenlabs"
            and audio[0].get("model") == "scribe_v2" and audio[0].get("type") != "cli"
            and config.get("tts", {}).get("provider") == "elevenlabs"):
        raise RuntimeError("ElevenLabs ist noch nicht exklusiv für Audio konfiguriert. Keine Deaktivierung.")
    subprocess.run(["systemctl", "--user", "is-active", "--quiet", "openclaw-gateway.service"], check=True)
    target = home / ".local/share/jarvis-stt"
    if not target.exists():
        print("Kein aktiver jarvis-stt-Ordner vorhanden; ElevenLabs-Konfiguration bestätigt.")
        return
    # Only the known dedicated folder may be moved; never follow symlinks elsewhere.
    if target.is_symlink() or target.resolve() != home.resolve() / ".local/share/jarvis-stt":
        raise RuntimeError("Unerwarteter lokaler STT-Pfad. Keine Dateien verschoben.")
    for proc in Path("/proc").iterdir():
        if not proc.name.isdigit():
            continue
        try:
            if proc.stat().st_uid != os.getuid():
                continue
            args = (proc / "cmdline").read_bytes().split(b"\0")
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            continue
        if any(arg.startswith(os.fsencode(target) + b"/") for arg in args if arg):
            raise RuntimeError("Ein lokaler STT-Prozess läuft noch. Gateway neu starten und erneut prüfen.")
    archive = target.with_name("jarvis-stt.deaktiviert-" + datetime.now().strftime("%Y%m%d-%H%M%S-%f"))
    target.rename(archive)
    print("Lokaler STT-Aufruf entfernt, kein zugehöriger Prozess aktiv.")
    print(f"Whisper-Modell und venv deaktiviert archiviert: {archive}")
    print("ffmpeg bleibt für WhatsApp-Audio installiert.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["key", "disable-local"])
    action = parser.parse_args().action
    try:
        if action == "key":
            set_key(Path.home())
        else:
            disable_local(Path.home())
    except Exception:
        # Avoid echoing exceptions that might contain configuration values or credentials.
        print("Schritt fehlgeschlagen. Pfade, aktive Konfiguration und Gateway-Status prüfen.")
        raise SystemExit(1)
