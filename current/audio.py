"""Episode sound: writes music.wav (-6 dB bed) and sfx.wav (each SFX capped at -12 dBFS) in the repo root.
1904 St. Louis = World's Fair ragtime: bouncy oom-pah piano in C, 112 bpm, brighter and faster for the joyride,
A-minor for the pivot, dead stop at the twist. Run: python3 current/audio.py"""
import os, sys
import numpy as np
sys.path.insert(0, os.getcwd())
from synth import SR, FPS, buf, note, noise_hit, low_hit, put, db, write_wav, episode

meta, ph = episode()
dur = meta["total_frames"] / FPS
twist = meta.get("twist_frame", meta["total_frames"] - 90) / FPS
s = lambda f: f / FPS

C, F, G, Am, Dm, E = ([261.6, 329.6, 392.0], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7],
                     [220.0, 261.6, 329.6], [146.8, 174.6, 220.0], [164.8, 207.7, 246.9])
SECTIONS = [  # (start frame, bpm, progression, melody octave mult, level)
    (0, 112, [C, C, F, G], 2, 1.0),        # hook + setting: sunny rag
    (495, 124, [C, F, C, G], 2, 1.1),      # the joyride: faster, brighter
    (693, 124, [F, C, G, C], 2, 1.2),      # stadium + crowd
    (890, 100, [Am, Dm, Am, E], 1, 0.9),   # busted / pivot: minor, slower
]
music = buf(dur)
for k, (f0, bpm, prog, mel, lvl) in enumerate(SECTIONS):
    end = SECTIONS[k + 1][0] / FPS if k + 1 < len(SECTIONS) else twist
    beat, t, n = 60 / bpm, s(f0), 0
    while t < min(end, twist) - 0.05:
        ch = prog[(n // 4) % 4]
        if n % 2 == 0:  # oom
            put(music, note(ch[0] / 2, beat * 0.9, 0.22 * lvl, "bass"), t)
        else:           # pah
            for q in ch:
                put(music, note(q, beat * 0.5, 0.06 * lvl, "pluck", pan=-0.2), t)
        # syncopated ragtime melody: off-beat eighths walking the chord tones
        pat = [0, 2, 1, 2, 0, 1, 2, 1]
        for e in (0, 1):
            if (n + e) % 3 != 2:
                put(music, note(ch[pat[(n * 2 + e) % 8]] * mel, beat * 0.45, 0.09 * lvl, "pluck", pan=0.3), t + e * beat * 0.5 + (0.03 if e else 0))
        t += beat; n += 1
music[int(twist * SR):] = 0
music *= 0.9 / (np.abs(music).max() + 1e-9) * db(-6)

# sfx: every one capped at -12 dBFS peak and placed on an on-screen action
sfx = buf(dur)
CAP = db(-12)
def fx(x, f, gain=1.0):
    put(sfx, x * (CAP * gain / (np.abs(x).max() + 1e-9)), s(f))

def putter(f0, f1, rate=7.0):  # motor-car engine chug while the car is on screen and driving
    t, k = s(f0), 0
    while t < s(f1):
        put(sfx, noise_hit(0.08, 1.0, 40, 0.02, seed=k) * (CAP * 0.45), t); t += 1 / rate; k += 1

putter(0, 178)                                   # car rolling in the hook shots
putter(426, 470)                                 # car pulls up beside Lorz
putter(495, 585, 8.5)                            # joyride past the runners
fx(noise_hit(0.15, 1, 25, 0.5, seed=3), 452)     # brake squeal-ish scrape as the car stops
fx(noise_hit(1.4, 1, 2.2, 0.6, seed=7), 586)     # steam hiss: the car breaks down
fx(low_hit(1.0)[: int(0.4 * SR)], 590, 0.8)      # clunk of the engine dying
for f in (300, 312, 324):                         # bucket creak at the water stop
    fx(note(880, 0.12, 1, "bell"), f, 0.4)
fx(noise_hit(0.12, 1, 30, 0.8, seed=11), 714)    # tape snaps
crowd = noise_hit(2.6, 1, 0.6, 0.35, seed=21)
crowd *= np.minimum(1, np.arange(len(crowd))[:, None] / (0.25 * SR))
fx(crowd, 746)                                   # the crowd roared
fx(note(1046.5, 0.6, 1, "bell"), 860, 0.7)       # wreath glints as it is presented
fx(noise_hit(0.25, 1, 18, 0.1, seed=5), 924)     # wreath drops to the dirt
fx(note(1318.5, 0.35, 1, "bell"), 1150)          # bottle clink
fx(note(587.3, 0.25, 1, "bell"), 1205, 0.6)      # egg tap
fx(noise_hit(0.2, 1, 20, 0.4, seed=9), 1226)     # tin rattle: rat poison
fx(low_hit(1.0), meta["twist_frame"])            # the twist: low hit
fx(noise_hit(0.4, 1, 9, 0.3, seed=13), meta["twist_frame"] - 3, 0.6)  # whoosh into the push-in
write_wav("music.wav", music)
write_wav("sfx.wav", sfx)
print("music.wav + sfx.wav", round(dur, 2), "s")
