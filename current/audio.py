"""Episode sound -> music.wav (cool, sparkly marimba + ukulele loop, -6 dB under the voice) and sfx.wav.
Run from the repo root: python3 current/audio.py"""
import os, sys
import numpy as np
sys.path.insert(0, os.getcwd())
from synth import SR, FPS, buf, note, pop, boing, sparkle, put, db, write_wav, episode

meta, ph = episode()
dur = meta["total_frames"] / FPS
W = ph["words"]
def first(w, n=0):
    hits = [x["f0"] / FPS for x in W if "".join(c for c in x["text"].lower() if c.isalpha()).startswith(w)]
    return hits[n] if len(hits) > n else None

# music: F-Dm-Bb-C, 104 bpm, icy bright marimba melody that climbs like a bubble rising
music, beat = buf(dur), 60 / 104
chords = [[174.6, 220.0, 261.6], [146.8, 174.6, 220.0], [116.5, 146.8, 174.6], [130.8, 164.8, 196.0]]
melody = [698.5, 880.0, 1046.5, 880.0, 784.0, 698.5, 587.3, 659.3]
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

# sfx: boing as the ice drops in / pops up, pops on titles, sparkles on freezing + reveals (each <= -12 dBFS)
sfx = buf(dur)
cues = [("es", 0, boing(db(-16))), ("mengapung", 0, pop(db(-14))), ("butiran", 0, pop(db(-14))), ("membeku", 0, sparkle(db(-16))),
        ("bergandengan", 0, pop(db(-14))), ("ruang", 0, sparkle(db(-17))), ("ringan", 0, pop(db(-14))), ("makanya", 0, boing(db(-16))),
        ("mengapung", 1, sparkle(db(-16))), ("esnya", 0, sparkle(db(-18))), ("keren", 0, sparkle(db(-16)))]
for w, i, fx in cues:
    s = first(w, i)
    if s is not None:
        put(sfx, fx, max(0.0, s - 0.05))
write_wav("music.wav", music)
write_wav("sfx.wav", sfx)
print("music.wav + sfx.wav", round(dur, 2), "s")
