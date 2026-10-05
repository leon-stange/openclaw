import contextlib
import importlib.util
import io
import os
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("local_stt", Path(__file__).with_name("transcribe-local.py"))
stt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stt)


class LocalTranscriptionTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.audio = self.root / "voice.ogg"
        self.audio.write_bytes(b"offline audio fixture")
        self.model = self.root / "model"
        self.model.mkdir()
        for name in ("model.bin", "config.json", "tokenizer.json"):
            (self.model / name).write_text("fixture")

    def fake_library(self, text="Hallo Jarvis, prüfe meinen Kalender.", duration=12):
        calls = []

        class WhisperModel:
            def __init__(inner, model, **options):
                calls.append((model, options))
                print("library diagnostic")

            def transcribe(inner, audio, **options):
                return iter([SimpleNamespace(text=text)]), SimpleNamespace(duration=duration)

        return SimpleNamespace(WhisperModel=WhisperModel), calls

    def test_local_cpu_model_and_plain_transcript_without_diagnostics(self):
        library, calls = self.fake_library()
        output, diagnostic = io.StringIO(), io.StringIO()
        with patch.dict(sys.modules, {"faster_whisper": library}), patch.dict(os.environ), \
                contextlib.redirect_stdout(output), contextlib.redirect_stderr(diagnostic):
            result = stt.transcribe(self.audio, self.model)
            self.assertEqual(os.environ["HF_HUB_OFFLINE"], "1")
        self.assertEqual(result, "Hallo Jarvis, prüfe meinen Kalender.")
        self.assertEqual(output.getvalue(), "")
        self.assertIn("library diagnostic", diagnostic.getvalue())
        self.assertEqual(calls[0][0], str(self.model.resolve()))
        self.assertTrue(calls[0][1]["local_files_only"])
        self.assertEqual(calls[0][1]["device"], "cpu")

    def test_incomplete_model_fails_before_library_or_download(self):
        (self.model / "tokenizer.json").unlink()
        with patch.dict(sys.modules, {"faster_whisper": None}):
            with self.assertRaisesRegex(ValueError, "unvollständig"):
                stt.transcribe(self.audio, self.model)

    def test_silence_and_overlong_audio_fail_instead_of_fabricating_transcript(self):
        for text, duration, expected in [(" ", 1, "Keine Sprache"), ("Test", 181, "drei Minuten")]:
            library, _ = self.fake_library(text, duration)
            with patch.dict(sys.modules, {"faster_whisper": library}), patch.dict(os.environ), \
                    contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaisesRegex(ValueError, expected):
                    stt.transcribe(self.audio, self.model)


if __name__ == "__main__":
    unittest.main()
