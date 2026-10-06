package main
import (
 "bytes"
 "encoding/json"
 "testing"
)
func TestJarvisDiagnosticVisibleAtDefaultLogLevel(t *testing.T) {
 t.Setenv("MEOW_LOG_LEVEL", "")
 var out bytes.Buffer
 log, err := commandLogger(&out)
 if err != nil { t.Fatal(err) }
 log.Log().Str("jarvis_call_event", "media_ready").Msg("notification phase")
 var event map[string]any
 if err := json.Unmarshal(out.Bytes(), &event); err != nil { t.Fatal(err) }
 if event["jarvis_call_event"] != "media_ready" { t.Fatal("missing diagnostic event") }
}
