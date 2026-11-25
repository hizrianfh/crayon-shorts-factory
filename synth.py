"""Tiny synth toolkit for current/audio.py: 48 kHz stereo float32 buffers, written as 16-bit WAV.

    import sys; sys.path.insert(0, "."); from synth import *
"""
import json, wave
import numpy as np

SR = 48000
FPS = 30


def frames_to_s(f):
    return f / FPS


def buf(seconds):
    return np.zeros((int(seconds * SR), 2), np.float32)


def note(freq, dur, amp=0.2, kind="pluck", pan=0.0):
    """one note: pluck (decaying sine + 2nd harmonic), pad (soft swell), bell, bass"""
    t = np.arange(int(dur * SR)) / SR
    if kind == "pluck":
        y = (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t)) * np.exp(-t * 5)
    elif kind == "pad":
        y = (np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 1.003 * t)) * np.minimum(1, t / 0.3) * np.minimum(1, (dur - t) / 0.4)
    elif kind == "bell":
        y = (np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2.76 * t)) * np.exp(-t * 2.5)
    elif kind == "marimba":  # woody: fundamental + 4th partial, fast decay
        y = (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 3.99 * t) * np.exp(-t * 18)) * np.exp(-t * 6)
    elif kind == "uke":  # bright nylon pluck: decaying harmonics, upper ones die faster
        y = sum(np.sin(2 * np.pi * freq * h * t) * np.exp(-t * (3 + 2.5 * h)) / h for h in range(1, 7)) * np.minimum(1, t / 0.003)
    else:  # bass
        y = np.sin(2 * np.pi * freq * t) * np.exp(-t * 3)
    y = (y * amp).astype(np.float32)
    return np.stack([y * (1 - pan) ** 0.5, y * (1 + pan) ** 0.5], 1) / 1.42


def noise_hit(dur=0.3, amp=0.3, decay=12, lowpass=0.2, seed=0):
    """filtered noise burst: whoosh/thud/scrape. lowpass 0..1 (smaller = darker)"""
    r = np.random.default_rng(seed)
    n = r.standard_normal(int(dur * SR)).astype(np.float32)
    k = max(1, int(1 / max(lowpass, 1e-3)))
    n = np.convolve(n, np.ones(k) / k, "same")
    t = np.arange(len(n)) / SR
    y = n * np.exp(-t * decay) * amp / (np.abs(n).max() + 1e-9)
    return np.stack([y, y], 1)


def low_hit(amp=0.6):
    """the twist: sub drop 70 -> 40 Hz + dark noise"""
    t = np.arange(int(1.2 * SR)) / SR
    y = np.sin(2 * np.pi * (70 - 25 * t) * t) * np.exp(-t * 3) * amp
    return np.stack([y, y], 1).astype(np.float32) + noise_hit(1.2, amp * 0.3, 6, 0.05)


def pop(amp=0.25):
    """bubble pop: fast upward sine chirp"""
    t = np.arange(int(0.09 * SR)) / SR
    y = np.sin(2 * np.pi * (300 * t + 9000 * t * t)) * np.exp(-t * 45) * amp
    return np.stack([y, y], 1).astype(np.float32)


def boing(amp=0.25):
    """spring: wobbling pitch that settles"""
    t = np.arange(int(0.5 * SR)) / SR
    f = 180 + 120 * np.exp(-t * 6) * np.sin(2 * np.pi * 9 * t)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) * amp
    return np.stack([y, y], 1).astype(np.float32)


def sparkle(amp=0.15, seed=0):
    """magic twinkle: rising run of tiny bells"""
    out = np.zeros((int(0.6 * SR), 2), np.float32)
    r = np.random.default_rng(seed)
    for i, f in enumerate([1568, 1976, 2349, 2637, 3136]):
        put(out, note(f * (1 + r.uniform(-0.01, 0.01)), 0.3, amp, "bell", pan=(-1) ** i * 0.4), i * 0.05)
    return out


def put(dst, src, at_s):
    i = int(at_s * SR)
    if i >= len(dst):
        return
    n = min(len(src), len(dst) - i)
    dst[i:i + n] += src[:n]


def db(x):
    return 10 ** (x / 20)


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def episode():
    """meta.json + phrases.json of the current episode"""
    meta = json.load(open("current/meta.json"))
    ph = json.load(open("current/work/phrases.json"))
    return meta, ph
