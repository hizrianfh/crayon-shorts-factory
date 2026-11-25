"""Indonesian narration + word timings + kid captions.

    python3 scripts/generate_voice_and_captions.py [--ep current]

Reads <ep>/script.txt and config.json "tts" (set from the dashboard):
  provider "gemini": Gemini TTS (GEMINI_API_KEY from the environment or a gitignored .env) -> <ep>/voice.wav.
                     Gemini gives no timestamps, so word timings come from scripts/align_audio.py.
                     Falls back to edge-tts if the key is missing or the API call fails.
  provider "edge":   edge-tts with exact WordBoundary timings -> <ep>/voice.mp3.
Writes <ep>/work/phrases.json (30 fps word + phrase frames), <ep>/captions.ass (2-3 words per chunk, active word in
yellow) and total_frames in <ep>/meta.json. Exits with code 3 if the video would be outside config duration.min..max,
printing how many words to add or cut.
"""
import argparse, asyncio, base64, io, json, math, os, re, sys, urllib.error, urllib.request, wave
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from align_audio import align_tokens

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
TTS_DEFAULTS = {"provider": "gemini", "gemini_model": "gemini-3.8-flash-tts", "gemini_voice": "Leda",
                "style": "Warm, cheerful older sister telling a fun science story to five-year-old kids in Indonesian. "
                         "Speak slowly, clearly and playfully, with real curiosity on the questions.",
                "edge_voice": "id-ID-GadisNeural", "edge_rate": "-6%"}

FPS = 30
TAIL = 0.8  # seconds of picture after the last word
YELLOW, WHITE, INK = "&H4DE1FF&", "&HFFFFFF&", "&H22252A&"  # ASS colours are &HBBGGRR&

ASS_HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Kid,Fredoka,96,&H00FFFFFF,&H00FFFFFF,&H0022252A,&H5A1A1410,-1,0,0,0,100,100,1,0,1,8,5,2,90,90,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def norm(s):
    return re.sub(r"[^0-9a-zà-ÿ]", "", s.lower())


async def tts(text, voice, rate, mp3):
    import edge_tts
    com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append({"text": ch["text"], "start": ch["offset"] / 1e7, "end": (ch["offset"] + ch["duration"]) / 1e7})
    return words


def align(tokens, words):
    """map each script token to the tts word that contains its first letter (robust to split/merged words)"""
    owner = []
    for i, w in enumerate(words):
        owner += [i] * len(norm(w["text"]))
    out, pos = [], 0
    for t in tokens:
        n = len(norm(t))
        if n == 0:
            out.append(out[-1] if out else 0)
            continue
        out.append(owner[min(pos, len(owner) - 1)])
        pos += n
    assert abs(pos - len(owner)) <= max(3, len(owner) // 20), f"script/tts text mismatch ({pos} vs {len(owner)} letters)"
    return out


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


def gemini_tts(text, t, key, wav_path):
    """Gemini TTS -> WAV file; returns (float mono samples, sample rate)"""
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
        raise RuntimeError(f"Gemini TTS HTTP {e.code}: {e.read().decode()[:400]}")
    b64 = find_audio(res)
    if not b64:
        raise RuntimeError(f"Gemini TTS response had no audio: {json.dumps(res)[:400]}")
    raw = base64.b64decode(b64)
    if raw[:4] != b"RIFF":  # documented: unary responses are WAV 24 kHz mono 16-bit; wrap raw PCM just in case
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(raw)
        raw = buf.getvalue()
    with open(wav_path, "wb") as f:
        f.write(raw)
    with wave.open(wav_path) as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        x = np.frombuffer(w.readframes(n), np.int16).astype(np.float32) / 32768
    return (x.reshape(-1, ch).mean(1) if ch > 1 else x), sr


def edge_tokens(text, tokens, t, mp3):
    words = asyncio.run(tts(text, t["edge_voice"], t["edge_rate"], mp3))
    assert words, "edge-tts returned no WordBoundary events"
    tok_word = align(tokens, words)
    toks = []
    for i, tk in enumerate(tokens):  # token timing = span of the tts words it owns
        mine = [j for j, k in enumerate(tok_word) if k == tok_word[i]]
        first = mine.index(i)
        w = words[tok_word[i]]
        dur = (w["end"] - w["start"]) / len(mine)  # tokens sharing one tts word split its time
        toks.append({"text": tk, "start": w["start"] + dur * first, "end": w["start"] + dur * (first + 1)})
    return toks


def ts(s):
    cs = int(round(s * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def chunks_of(n):
    """split n words into chunks of 2-3 (never a lone word unless n == 1)"""
    if n <= 3:
        return [n]
    if n == 4:
        return [2, 2]
    return [3] + chunks_of(n - 3)


def main():
    cfg = json.load(open("config.json", encoding="utf-8")) if os.path.exists("config.json") else {}
    limits = cfg.get("duration", {"min": 35, "max": 45})
    t = {**TTS_DEFAULTS, **cfg.get("tts", {})}
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep", default="current")
    ap.add_argument("--provider", default=t["provider"], choices=["gemini", "edge"])
    a = ap.parse_args()
    text = " ".join(open(os.path.join(a.ep, "script.txt"), encoding="utf-8").read().split())
    tokens = text.split()
    wav, mp3 = os.path.join(a.ep, "voice.wav"), os.path.join(a.ep, "voice.mp3")

    used = a.provider
    if used == "gemini":
        key = gemini_key()
        try:
            if not key:
                raise RuntimeError("GEMINI_API_KEY is not set")
            x, sr = gemini_tts(text, t, key, wav)
            toks = align_tokens(x, sr, tokens)
            print(f"voice: Gemini {t['gemini_model']} / {t['gemini_voice']} (timings from audio alignment)")
        except Exception as e:  # never lose a day: fall back to edge-tts
            print(f"WARNING: Gemini TTS failed ({e}); falling back to edge-tts {t['edge_voice']}")
            used = "edge"
    if used == "edge":
        toks = edge_tokens(text, tokens, t, mp3)
        print(f"voice: edge-tts {t['edge_voice']} {t['edge_rate']} (exact word timings)")
    for stale in ([mp3] if used == "gemini" else [wav]):  # exactly one voice file per episode
        if os.path.exists(stale):
            os.remove(stale)

    # phrases end at punctuation
    phrases, cur = [], []
    for i, t in enumerate(toks):
        cur.append(i)
        if re.search(r"[.,!?;:…]$", t["text"]) or i == len(toks) - 1:
            phrases.append(cur)
            cur = []

    total = math.ceil((toks[-1]["end"] + TAIL) * FPS)
    F = lambda s: round(s * FPS)
    out = {
        "duration": round(toks[-1]["end"], 3), "total_frames": total,
        "words": [{"i": i, "text": t["text"], "start": round(t["start"], 3), "end": round(t["end"], 3), "f0": F(t["start"]), "f1": max(F(t["end"]), F(t["start"]) + 1)} for i, t in enumerate(toks)],
        "phrases": [{"i": k, "text": " ".join(toks[i]["text"] for i in p), "w0": p[0], "w1": p[-1], "f0": F(toks[p[0]]["start"]), "f1": F(toks[p[-1]]["end"])} for k, p in enumerate(phrases)],
    }
    os.makedirs(os.path.join(a.ep, "work"), exist_ok=True)
    json.dump(out, open(os.path.join(a.ep, "work", "phrases.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # captions: 2-3 word chunks inside each phrase; one event per active word with that word in yellow
    clean = lambda s: re.sub(r"[.,;:…]+$", "", s)
    chunks = []
    for p in phrases:
        k = 0
        for n in chunks_of(len(p)):
            chunks.append(p[k:k + n])
            k += n
    lines = []
    for c_i, c in enumerate(chunks):
        nxt = toks[chunks[c_i + 1][0]]["start"] if c_i + 1 < len(chunks) else toks[c[-1]]["end"] + 0.4
        c_end = nxt if nxt - toks[c[-1]]["end"] < 0.35 else toks[c[-1]]["end"] + 0.2
        for j, wi in enumerate(c):
            s = toks[wi]["start"]
            e = toks[c[j + 1]]["start"] if j + 1 < len(c) else c_end
            pop = r"{\fscx82\fscy82\t(0,90,\fscx100\fscy100)}" if j == 0 else ""
            body = " ".join((f"{{\\c{YELLOW}}}{clean(toks[k]['text'])}{{\\c{WHITE}}}" if k == wi else clean(toks[k]["text"])) for k in c)
            lines.append(f"Dialogue: 0,{ts(s)},{ts(e)},Kid,,0,0,0,,{pop}{body}")
    with open(os.path.join(a.ep, "captions.ass"), "w", encoding="utf-8") as f:
        f.write(ASS_HEAD + "\n".join(lines) + "\n")

    meta = os.path.join(a.ep, "meta.json")
    if os.path.exists(meta):
        m = json.load(open(meta, encoding="utf-8"))
        m["total_frames"] = total
        json.dump(m, open(meta, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"voice {out['duration']:.2f} s, {len(toks)} words, {len(phrases)} phrases, {len(chunks)} caption chunks, total_frames={total}")
    for p in out["phrases"]:
        print(f"  {p['f0']:5d}-{p['f1']:5d}  {p['text']}")
    length = total / FPS
    if not limits["min"] <= length <= limits["max"]:
        wps = len(toks) / max(out["duration"], 0.1)
        target = (limits["min"] + limits["max"]) / 2 - TAIL
        print(f"OUT OF RANGE: video is {length:.1f} s, config wants {limits['min']}-{limits['max']} s. "
              f"{'Add' if length < limits['min'] else 'Cut'} about {abs(round((target - out['duration']) * wps))} words "
              f"({wps:.2f} words/s), then run this again.")
        raise SystemExit(3)
    print(f"duration OK: {length:.1f} s (config {limits['min']}-{limits['max']} s)")


if __name__ == "__main__":
    assert chunks_of(5) == [3, 2] and chunks_of(4) == [2, 2] and chunks_of(7) == [3, 2, 2]
    main()
