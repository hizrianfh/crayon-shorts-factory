"""Step A: narration audio.  python3 scripts/generate_voice.py [--ep current] [--provider gemini|edge]

Reads <ep>/script.txt and config.json "tts" (set from the dashboard) and writes <ep>/voice.mp3.
  gemini: gemini-3.8-flash-tts via the v1beta Interactions API, tone from speech_metadata.style.
          Key from GEMINI_API_KEY or a gitignored .env. Falls back to edge-tts if the key is missing or the call fails.
  edge:   edge-tts (config edge_voice / edge_rate).
Timing is NOT taken from the TTS: Step B (transcribe_srt.py) measures it from this exact file.
"""
import argparse, asyncio, base64, io, json, os, shutil, subprocess, sys, urllib.error, urllib.request, wave

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
TTS_DEFAULTS = {"provider": "gemini", "gemini_model": "gemini-3.8-flash-tts", "gemini_voice": "Leda",
                "style": "Warm, cheerful older sister telling a fun science story to five-year-old kids in Indonesian. "
                         "Speak slowly, clearly and playfully, with real curiosity on the questions.",
                "edge_voice": "id-ID-GadisNeural", "edge_rate": "-6%"}


def gemini_key():
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"].strip()
    if os.path.exists(".env"):
        for line in open(".env", encoding="utf-8"):
            k, _, v = line.partition("=")
            if k.strip() == "GEMINI_API_KEY":
                return v.strip().strip('"').strip("'")
    return ""


def find_audio(obj):
    """first {"type": "audio", "data": <base64>} anywhere in the Interactions API response"""
    if isinstance(obj, dict):
        if obj.get("type") == "audio" and obj.get("data"):
            return obj["data"]
        obj = list(obj.values())
    if isinstance(obj, list):
        for v in obj:
            d = find_audio(v)
            if d:
                return d
    return None


def gemini_wav(text, t, key):
    body = {"model": t["gemini_model"],
            "input": [{"type": "user_input", "content": [{"type": "text", "text": text,
                       "annotations": [{"type": "speech_metadata", "style": t["style"]}]}]}],
            "response_format": {"type": "audio"},
            "generation_config": {"speech_config": [{"voice": t["gemini_voice"]}]}}
    req = urllib.request.Request(GEMINI_URL, data=json.dumps(body).encode(), method="POST",
                                 headers={"x-goog-api-key": key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            res = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode()[:400]}")
    b64 = find_audio(res)
    if not b64:
        raise RuntimeError(f"response had no audio: {json.dumps(res)[:400]}")
    raw = base64.b64decode(b64)
    if raw[:4] != b"RIFF":  # documented unary output is WAV 24 kHz mono 16-bit; wrap bare PCM just in case
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(raw)
        raw = buf.getvalue()
    return raw


def wav_to_mp3(wav_bytes, mp3):
    if shutil.which("ffmpeg"):
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "-", "-c:a", "libmp3lame", "-b:a", "128k", mp3],
                       input=wav_bytes, check=True)
        return
    import av  # ships with faster-whisper, so the routine VM needs no ffmpeg
    with av.open(io.BytesIO(wav_bytes)) as src, av.open(mp3, "w", format="mp3") as dst:
        out = dst.add_stream("mp3", rate=src.streams.audio[0].rate)
        out.bit_rate = 128000
        for frame in src.decode(audio=0):
            for pkt in out.encode(frame):
                dst.mux(pkt)
        for pkt in out.encode(None):
            dst.mux(pkt)


async def edge_mp3(text, t, mp3):
    import edge_tts
    await edge_tts.Communicate(text, t["edge_voice"], rate=t["edge_rate"]).save(mp3)


def main():
    cfg = json.load(open("config.json", encoding="utf-8")) if os.path.exists("config.json") else {}
    t = {**TTS_DEFAULTS, **cfg.get("tts", {})}
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep", default="current")
    ap.add_argument("--provider", default=t["provider"], choices=["gemini", "edge"])
    a = ap.parse_args()
    text = " ".join(open(os.path.join(a.ep, "script.txt"), encoding="utf-8").read().split())
    mp3 = os.path.join(a.ep, "voice.mp3")
    for stale in ("voice.wav",):  # older episodes stored Gemini audio as WAV
        if os.path.exists(os.path.join(a.ep, stale)):
            os.remove(os.path.join(a.ep, stale))
    if a.provider == "gemini":
        try:
            key = gemini_key()
            if not key:
                raise RuntimeError("GEMINI_API_KEY is not set")
            wav_to_mp3(gemini_wav(text, t, key), mp3)
            print(f"voice: Gemini {t['gemini_model']} / {t['gemini_voice']} -> {mp3}")
            return
        except Exception as e:  # never lose a day
            print(f"WARNING: Gemini TTS failed ({e}); falling back to edge-tts {t['edge_voice']}")
    asyncio.run(edge_mp3(text, t, mp3))
    print(f"voice: edge-tts {t['edge_voice']} {t['edge_rate']} -> {mp3}")


if __name__ == "__main__":
    main()
