"""Final mix: python3 mix.py current/voice.mp3 music.wav sfx.wav [-> mix.wav]

Voice unchanged; music ducked 6 dB under speech (from the voice envelope); SFX added; soft limiter.
Length = total_frames / 30 from current/meta.json. Loudness (-14 LUFS) is set by finish.sh.
"""
import json, subprocess, sys, wave
import numpy as np

SR = 48000


def read_any(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def fit(x, n):
    return x[:n] if len(x) >= n else np.vstack([x, np.zeros((n - len(x), 2), np.float32)])


def main():
    voice_p, music_p, sfx_p = sys.argv[1:4]
    out = sys.argv[4] if len(sys.argv) > 4 else "mix.wav"
    total = json.load(open("current/meta.json"))["total_frames"]
    n = int(total / 30 * SR)
    v, m, s = (fit(read_any(p), n) for p in (voice_p, music_p, sfx_p))
    # duck: voice rms per 10 ms, held 150 ms, smoothed -> up to -6 dB on music
    hop = SR // 100
    blocks = len(v) // hop
    e = np.sqrt((v[: blocks * hop].mean(1) ** 2).reshape(blocks, hop).mean(1))
    e = np.lib.stride_tricks.sliding_window_view(np.pad(e, (14, 0)), 15).max(1)
    e = np.convolve(e, np.ones(5) / 5, "same")
    g = 1 - 0.5 * np.clip(e / (e.max() * 0.25 + 1e-9), 0, 1)
    duck = np.interp(np.arange(n) / hop, np.arange(blocks), g)
    y = v + m * duck[:, None] + s
    peak = np.abs(y).max()
    if peak > 0.95:  # soft-knee limiter above 0.8
        a = np.abs(y)
        y = np.where(a > 0.8, np.sign(y) * (0.8 + 0.15 * np.tanh((a - 0.8) / 0.15)), y)
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"{out}: {n / SR:.2f} s, peak {20 * np.log10(np.abs(y).max() + 1e-9):.1f} dBFS")


if __name__ == "__main__":
    main()
