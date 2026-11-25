"""Episode sound -> music.wav (bouncy marimba + ukulele loop, -6 dB under the voice) and sfx.wav (pops, boings, sparkles).
Run from the repo root: python3 current/audio.py"""
import os, sys
import numpy as np
sys.path.insert(0, os.getcwd())
from synth import SR, FPS, buf, note, pop, boing, sparkle, put, db, write_wav, episode

meta, ph = episode()
dur = meta["total_frames"] / FPS
norm = lambda s: "".join(c for c in s.lower() if c.isalpha())
def nth(w, n=0):
    hits = [x["f0"] / FPS for x in ph["words"] if norm(x["text"]).startswith(w)]
    return hits[n] if len(hits) > n else None

# music: F-Dm-Bb-C, 116 bpm, tummy-rumble bounce: ukulele strums on the beat + hopping marimba melody
music, beat = buf(dur), 60 / 116
chords = [[174.6, 220.0, 261.6], [146.8, 174.6, 220.0], [116.5, 146.8, 174.6], [130.8, 164.8, 196.0]]
melody = [523.3, 440.0, 523.3, 587.3, 698.5, 587.3, 523.3, 392.0]
t, k = 0.0, 0
while t < dur:
    ch = chords[(k // 4) % 4]
    for i, f in enumerate(ch):
        put(music, note(f, beat * 1.1, 0.10, "uke", pan=-0.25), t + i * 0.012)
    put(music, note(melody[k % 8], beat * 0.8, 0.13, "marimba", pan=0.3), t + beat / 2)
    if k % 2 == 0:
        put(music, note(ch[0] / 2, beat * 0.6, 0.08, "marimba", pan=0.0), t)  # low bouncy bass
    t += beat; k += 1
music *= db(-6)
n = int(0.6 * SR)
music[-n:] *= np.linspace(1, 0, n)[:, None]  # soft fade out

# sfx (each <= -12 dBFS): pops on the 4 titles, boings on the squeezes / sounds, sparkles on the reveal + close
sfx = buf(dur)
events = [(nth("kruyuk", 0), pop(db(-14))), (nth("prut"), boing(db(-15))), (nth("meremas"), pop(db(-14))),
          (nth("kruyuk", 1), boing(db(-15))), (nth("udara"), pop(db(-18))), (nth("makan", 2), pop(db(-14))),
          (nth("keren"), sparkle(db(-17)))]
for at, fx in events:
    if at is not None:
        put(sfx, fx, max(0.0, at - 2 / FPS))
write_wav("music.wav", music)
write_wav("sfx.wav", sfx)
print("music.wav + sfx.wav", round(dur, 2), "s")
