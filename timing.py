"""Phrase timings at 30 fps from a narration file and its script, no speech-to-text needed.

    python3 timing.py current/voice.mp3 current/script.txt --out current/work

Splits the script into phrases at punctuation, finds pauses in the audio (energy), and places each phrase
boundary at the pause nearest to where the character count says it should be.
Writes <out>/phrases.json: {duration, total_frames, phrases: [{i, text, start, end, f0, f1}]}.
"""
import argparse, json, math, os, re, subprocess
import numpy as np

FPS, SR, HOP = 30, 16000, 160  # 10 ms analysis hop


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def phrases_of(text):
    parts = re.split(r"(?<=[.,;:!?—])\s+", " ".join(text.split()))
    return [p for p in parts if p.strip()]


def align(x, phrases):
    n = len(x) // HOP
    rms = np.sqrt(np.mean(x[: n * HOP].reshape(n, HOP) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    voiced = db > max(db.max() - 35, -55)
    idx = np.flatnonzero(voiced)
    s0, s1 = idx[0], idx[-1] + 1
    pauses, run = [], 0  # midpoints of silent runs >= 120 ms inside speech
    for i in range(s0, s1):
        if not voiced[i]:
            run += 1
        else:
            if run >= 12:
                pauses.append(i - run / 2)
            run = 0
    w = np.array([len(p) for p in phrases], float)
    cum = s0 + (s1 - s0) * np.cumsum(w)[:-1] / w.sum()
    bounds, used = [], set()
    for c in cum:
        near = [p for p in pauses if abs(p - c) < 70 and p not in used]
        b = min(near, key=lambda p: abs(p - c)) if near else c
        used.add(b)
        bounds.append(b)
    edges = [s0] + sorted(bounds) + [s1]
    return [(edges[i] * HOP / SR, edges[i + 1] * HOP / SR) for i in range(len(phrases))]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("voice"); ap.add_argument("script"); ap.add_argument("--out", default="current/work")
    ap.add_argument("--tail", type=float, default=0.8, help="seconds of picture after the last word")
    a = ap.parse_args()
    x = load(a.voice)
    phrases = phrases_of(open(a.script, encoding="utf-8").read())
    spans = align(x, phrases)
    dur = len(x) / SR
    total = math.ceil((dur + a.tail) * FPS)
    out = {"duration": round(dur, 3), "total_frames": total, "phrases": [
        {"i": i, "text": t, "start": round(s, 3), "end": round(e, 3), "f0": round(s * FPS), "f1": round(e * FPS)}
        for i, (t, (s, e)) in enumerate(zip(phrases, spans))]}
    assert all(p["f0"] < p["f1"] for p in out["phrases"]) and out["phrases"][-1]["f1"] <= total
    os.makedirs(a.out, exist_ok=True)
    json.dump(out, open(os.path.join(a.out, "phrases.json"), "w"), indent=1)
    print(f"{len(phrases)} phrases, {dur:.2f} s voice, total_frames={total}")
    for p in out["phrases"]:
        print(f"  {p['f0']:5d}-{p['f1']:5d}  {p['text']}")


if __name__ == "__main__":
    main()
