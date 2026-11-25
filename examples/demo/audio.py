"""Episode sound: writes music.wav (-6 dB bed) and sfx.wav (capped) in the repo root. Run: python3 current/audio.py"""
import os, sys
sys.path.insert(0, os.getcwd())
from synth import SR, FPS, buf, note, noise_hit, low_hit, put, db, write_wav, episode

meta, ph = episode()
dur = meta["total_frames"] / FPS
twist = meta.get("twist_frame", meta["total_frames"] - 90) / FPS

# music: warm plucked I-vi-IV-V storybook loop, 100 bpm, stops dead at the twist
music = buf(dur)
beat = 60 / 100
chords = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
t, k = 0.0, 0
while t < twist - 0.05:
    ch = chords[(k // 4) % 4]
    put(music, note(ch[k % 3] * (2 if k % 2 else 1), beat * 1.5, 0.18, "pluck", pan=0.3 * (-1) ** k), t)
    if k % 4 == 0:
        put(music, note(ch[0] / 2, beat * 4, 0.22, "bass"), t)
    t += beat; k += 1
music[int(twist * SR):] = 0
music *= db(-6)

# sfx (each capped at -12 dBFS peak): whoosh on every phrase change after the hook, low hit on the twist
sfx = buf(dur)
for p in ph["phrases"][1:]:
    put(sfx, noise_hit(0.35, db(-18), 9, 0.3, seed=p["i"]), p["f0"] / FPS - 0.1)
put(sfx, low_hit(db(-8)), twist)
write_wav("music.wav", music)
write_wav("sfx.wav", sfx)
print("music.wav + sfx.wav", round(dur, 2), "s")
