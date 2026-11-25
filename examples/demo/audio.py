"""Episode sound -> music.wav (cheerful marimba + ukulele loop, -6 dB under the voice) and sfx.wav (pops, boings, sparkles).
Run from the repo root: python3 current/audio.py"""
import os, sys
sys.path.insert(0, os.getcwd())
from synth import SR, FPS, buf, note, pop, boing, sparkle, put, db, write_wav, episode

meta, ph = episode()
dur = meta["total_frames"] / FPS
first = lambda w: next((x["f0"] / FPS for x in ph["words"] if x["text"].lower().startswith(w)), None)

# music: C-G-Am-F, 112 bpm, ukulele strums on the beat + marimba melody on the off-beats
music, beat = buf(dur), 60 / 112
chords = [[261.6, 329.6, 392.0], [196.0, 246.9, 293.7], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6]]
melody = [523.3, 587.3, 659.3, 784.0, 659.3, 587.3, 523.3, 440.0]
t, k = 0.0, 0
while t < dur:
    ch = chords[(k // 4) % 4]
    for i, f in enumerate(ch):
        put(music, note(f, beat * 1.2, 0.10, "uke", pan=-0.25), t + i * 0.012)  # strum
    put(music, note(melody[k % 8], beat * 0.9, 0.14, "marimba", pan=0.3), t + beat / 2)
    t += beat; k += 1
music *= db(-6)
music[-int(0.5 * SR):] *= __import__("numpy").linspace(1, 0, int(0.5 * SR))[:, None]  # soft fade out

# sfx: pop when the title lands, boing when the bee starts, sparkle on the flower zoom (each <= -12 dBFS)
sfx = buf(dur)
for w, fx in (("di", pop(db(-14))), ("lebah", boing(db(-16))), ("bunga", sparkle(db(-18)))):
    if first(w) is not None:
        put(sfx, fx, first(w))
write_wav("music.wav", music)
write_wav("sfx.wav", sfx)
print("music.wav + sfx.wav", round(dur, 2), "s")
