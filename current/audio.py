"""Episode sound -> music.wav (bright, airy marimba + ukulele loop in D, -6 dB under the voice) and sfx.wav.
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

# music: D-A-Bm-G, 118 bpm, ukulele strums on the beat + a sky-high marimba line on the off-beats
music, beat = buf(dur), 60 / 118
chords = [[293.7, 370.0, 440.0], [220.0, 277.2, 329.6], [246.9, 293.7, 370.0], [196.0, 246.9, 293.7]]
melody = [587.3, 740.0, 880.0, 740.0, 659.3, 554.4, 587.3, 880.0]
t, k = 0.0, 0
while t < dur:
    ch = chords[(k // 4) % 4]
    for i, f in enumerate(ch):
        put(music, note(f, beat * 1.2, 0.10, "uke", pan=-0.25), t + i * 0.012)
    put(music, note(melody[k % 8], beat * 0.9, 0.13, "marimba", pan=0.3), t + beat / 2)
    t += beat; k += 1
music *= db(-6)
fade = int(0.8 * SR)
music[-fade:] *= np.linspace(1, 0, fade)[:, None]

# sfx on titles and on-screen actions only (each <= -12 dBFS)
sfx = buf(dur)
cues = [(("langit", 0), pop(db(-14))), (("kotak", 0), pop(db(-15))), (("krayon", 0), pop(db(-14))),
        (("merah", 0), pop(db(-18))), (("kuning", 0), pop(db(-18))), (("hijau", 0), pop(db(-18))), (("biru", 1), pop(db(-18))),
        (("udara", 0), sparkle(db(-18))), (("menabrak", 0), pop(db(-16))), (("memantul", 0), boing(db(-14))),
        (("terpental", 0), boing(db(-16))), (("bola", 0), boing(db(-16))), (("menyebar", 0), sparkle(db(-16))),
        (("keren", 0), sparkle(db(-14)))]
for (w, n), fx in cues:
    ts = nth(w, n)
    if ts is not None:
        level = 20 * np.log10(np.abs(fx).max() + 1e-9)
        if level > -12:  # bells stack: cap every cue at -12 dBFS
            fx = fx * db(-12 - level)
        put(sfx, fx, max(0.0, ts - 0.07))
peak = np.abs(sfx).max()
if peak > db(-12):
    sfx *= db(-12) / peak
write_wav("music.wav", music)
write_wav("sfx.wav", sfx)
print("music.wav + sfx.wav", round(dur, 2), "s")
