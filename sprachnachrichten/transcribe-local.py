#!/usr/bin/env python3
"""Local-only audio-to-text bridge for OpenClaw's media CLI."""

import argparse
import contextlib
import os
from pathlib import Path
import sys


def transcribe(audio, model_directory, threads=2, max_seconds=180):
    audio = Path(audio).resolve(strict=True)
    model_directory = Path(model_directory).resolve(strict=True)
    if not audio.is_file() or audio.stat().st_size > 20 * 1024 * 1024:
        raise ValueError("Audiodatei fehlt oder ist größer als 20 MB.")
    for filename in ("model.bin", "config.json", "tokenizer.json"):
        if not (model_directory / filename).is_file():
            raise ValueError("Das lokale Whisper-Modell ist unvollständig.")

    # Downloads belong to setup, never to an incoming-message transcription.
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
    with contextlib.redirect_stdout(sys.stderr):
        from faster_whisper import WhisperModel

        model = WhisperModel(
            str(model_directory), device="cpu", compute_type="int8",
            cpu_threads=threads, local_files_only=True,
        )
        segments, info = model.transcribe(
            str(audio), language="de", task="transcribe", beam_size=3,
            vad_filter=True, condition_on_previous_text=False,
        )
        if info.duration > max_seconds:
            raise ValueError("Sprachnachricht ist länger als drei Minuten.")
        text = " ".join(segment.text.strip() for segment in segments).strip()
    if not text:
        raise ValueError("Keine Sprache erkannt.")
    return text


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--threads", type=int, choices=range(1, 17), default=2)
    parser.add_argument("audio")
    args = parser.parse_args()
    try:
        text = transcribe(args.audio, args.model_dir, args.threads)
    except (ValueError, FileNotFoundError) as error:
        print(f"Lokale Transkription fehlgeschlagen: {error}", file=sys.stderr)
        return 1
    except Exception as error:
        # No transcript, recording, credential or raw library response in error logs.
        print(f"Lokale Transkription fehlgeschlagen ({type(error).__name__}).", file=sys.stderr)
        return 1
    sys.stdout.reconfigure(encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
