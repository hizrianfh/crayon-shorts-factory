"""Episode sound -> music.wav (dreamy-but-cheerful night-sky marimba + ukulele loop, -6 dB under the voice) and sfx.wav.
Run from the repo root: python3 current/audio.py"""
import os, sys
import numpy as np
sys.path.insert(0, os.getcwd())
from synth import SR, FPS, buf, note, pop, boing, sparkle, put, db, write_wav, episode

meta, ph = episode()
dur = meta["total_frames"] / FPS
norm = lambda s: "".join(c for c in s.lower() if c.isalpha())
def nth(w, n=0):
    hits = [x["f0"] / FPS for x in ph["words"] if norm(x["text"]) == w]
    return hits[n] if len(hits) > n else None

# music: F - Dm - Bb - C, 100 bpm (a gentle "twinkly night" feel), ukulele strums + marimba melody with a high bell answer
music, beat = buf(dur), 60 / 100
chords = [[174.6, 220.0, 261.6], [146.8, 174.6, 220.0], [116.5, 146.8, 174.6], [130.8, 164.8, 196.0]]
melody = [523.3, 659.3, 698.5, 784.0, 698.5, 659.3, 587.3, 523.3, 440.0, 523.3, 587.3, 659.3, 587.3, 523.3, 466.2, 523.3]
t, k = 0.0, 0
while t < dur:
    ch = chords[(k // 4) % 4]
    for i, f in enumerate(ch):
        put(music, note(f, beat * 1.3, 0.10, "uke", pan=-0.25), t + i * 0.014)
    put(music, note(melody[k % 16], beat * 0.9, 0.13, "marimba", pan=0.3), t + beat / 2)
    if k % 4 == 3:
        put(music, note(melody[k % 16] * 2, beat * 1.5, 0.05, "marimba", pan=0.5), t + beat * 0.75)
    t += beat; k += 1
music *= db(-6)
n = int(1.0 * SR)
music[-n:] *= np.linspace(1, 0, n)[:, None]  # soft fade out

# sfx (each <= -12 dBFS): pops on titles + phase reveals, boing on the banana / ball, sparkles on the light and the full moon
sfx = buf(dur)
cues = [(nth("bentuk"), pop(db(-14))), (nth("bulat"), sparkle(db(-26))), (nth("pisang"), boing(db(-16))),
        (nth("memantulkan"), pop(db(-14))), (nth("separuh"), sparkle(db(-26))), (nth("bola"), boing(db(-16))),
        (nth("terang", 1), sparkle(db(-26))), (nth("mengelilingi"), pop(db(-14))), (nth("empat"), pop(db(-16))),
        (nth("sabit"), pop(db(-15))), (nth("separuh", 1), pop(db(-15))), (nth("purnama"), sparkle(db(-24))),
        (nth("keren"), sparkle(db(-26)))]
for at, fx in cues:
    if at is not None:
        put(sfx, fx, max(0.0, at - 0.05))
write_wav("music.wav", music)
write_wav("sfx.wav", sfx)
print("music.wav + sfx.wav", round(dur, 2), "s")
