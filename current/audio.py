"""Episode sound -> music.wav (sunny, leafy marimba + ukulele loop, -6 dB under the voice) and sfx.wav.
Run from the repo root: python3 current/audio.py"""
import os, sys
import numpy as np
sys.path.insert(0, os.getcwd())
from synth import SR, FPS, buf, note, pop, boing, sparkle, put, db, write_wav, episode

meta, ph = episode()
dur = meta["total_frames"] / FPS
W = ph["words"]
def first(w, n=0):
    """start (s) of the n-th word that equals w exactly (letters only)"""
    hits = [x["f0"] / FPS for x in W if "".join(c for c in x["text"].lower() if c.isalpha()) == w]
    return hits[n] if len(hits) > n else None

# music: G-Em-C-D, 116 bpm, bouncy garden-walk marimba melody
music, beat = buf(dur), 60 / 116
chords = [[196.0, 246.9, 293.7], [164.8, 196.0, 246.9], [130.8, 164.8, 196.0], [146.8, 185.0, 220.0]]
melody = [587.3, 784.0, 740.0, 659.3, 587.3, 493.9, 523.3, 587.3]
t, k = 0.0, 0
while t < dur:
    ch = chords[(k // 4) % 4]
    for i, f in enumerate(ch):
        put(music, note(f, beat * 1.2, 0.10, "uke", pan=-0.25), t + i * 0.012)
    put(music, note(melody[k % 8], beat * 0.8, 0.12, "marimba", pan=0.3), t + beat / 2)
    t += beat; k += 1
music *= db(-6)
n = int(0.8 * SR)
music[-n:] *= np.linspace(1, 0, n)[:, None]

# sfx on titles + on-screen actions (each <= -12 dBFS)
sfx = buf(dur)
cues = [("hijau", 0, pop(db(-14))), ("hijau", 1, sparkle(db(-17))), ("intip", 0, boing(db(-16))), ("klorofil", 0, pop(db(-14))),
        ("koki", 0, pop(db(-15))), ("menangkap", 0, sparkle(db(-17))), ("banyak", 0, pop(db(-14))), ("merah", 2, pop(db(-16))),
        ("biru", 2, pop(db(-16))), ("makanan", 0, sparkle(db(-16))), ("dipantulkan", 0, boing(db(-15))), ("tembok", 0, boing(db(-16))),
        ("mata", 0, sparkle(db(-17))), ("keren", 0, sparkle(db(-16)))]
for w, i, fx in cues:
    s = first(w, i)
    if s is not None:
        put(sfx, fx, max(0.0, s - 0.05))
write_wav("music.wav", music)
write_wav("sfx.wav", sfx)
print("music.wav + sfx.wav", round(dur, 2), "s")
