# Crayon Shorts Factory

A daily, zero-extra-bill pipeline for 35–45 s vertical shorts of **fun everyday knowledge for kids aged 5–8, in Bahasa Indonesia**. Each one is drawn as wax crayon on notebook graph paper, hosted by **Lala**, and has burned-in word-highlighted captions.

```
Claude Code Routine (daily, your Claude plan)            GitHub Actions (1 job, ~3 min, $0 on a public repo)
  Indonesian script + edge-tts id-ID-GadisNeural           node render.mjs video   (@napi-rs/canvas -> ffmpeg)
  word timings -> phrases.json + captions.ass      push     audio.py + mix.py
  story.mjs + audio.py + 6 preview stills       ─────────>  finish.sh (captions burned in) -> out/final.mp4
                                                            publish.py (Zernio -> TikTok + YouTube Shorts)
```

## Layout
| Path | What |
|---|---|
| `engine/crayon2d.mjs` | 2D engine: `drawGraphPaper`, `crayonStroke` / `crayonFill` (draw-on `progress`, 4-frame boil), `Camera2D`, `drawKidHost` (Lala), `talkAt`, `dottedPath`, `drawKeywordTitle`, props (flower, bee, sun, cloud, sparkle) |
| `engine/motion.js` | Timing helpers (`keys`, `smooth`, `blink`, `breathe`, …) |
| `render.mjs` | `node render.mjs video` → `out/silent.mp4`. `node render.mjs stills 0,60,120` → `stills/contact_sheet.jpg` |
| `scripts/generate_voice_and_captions.py` | `script.txt` → `voice.mp3` + `work/phrases.json` + `captions.ass` (one edge-tts call with WordBoundary) |
| `synth.py`, `mix.py`, `finish.sh` | Marimba/ukulele/SFX synth, ducked mix, final encode with captions at −14 LUFS |
| `fonts/Fredoka-Bold.ttf` | Static Bold instance of Google's Fredoka (OFL, `fonts/OFL.txt`), used by both the canvas titles and libass |
| `publish.py` | Zernio upload + publish now. `DRY_RUN=1` prints the request instead of sending it |
| `examples/demo/` | Reference episode ("Di Taman! … kenapa lebah suka sekali bunga?") |
| `current/` | Today's episode, written by the routine |
| `prompts/claude_routine_prompt.md` | The routine's instructions (the routine is told to read this file) |

## Local run
Needs Node ≥ 22, Python 3 with `numpy` + `edge-tts`, and ffmpeg with libass.
```bash
npm ci
cp examples/demo/* current/ && python3 scripts/generate_voice_and_captions.py
node render.mjs stills 10,100,200
node render.mjs video && python3 current/audio.py && python3 mix.py current/voice.mp3 music.wav sfx.wav && bash finish.sh
```

## Deployed setup
- **Routine:** claude.ai/code/routines → "Crayon Shorts daily episode", daily 17:57 GMT+7, environment `crayon-shorts` (Full network, needed for edge-tts), no connectors.
- **GitHub → Settings → Secrets and variables → Actions:** secret `PUBLISHER_API_KEY` (Zernio `sk_…`) and variable `PUBLISHER_PROVIDER=zernio`.
- **Schedule & Chill:** not implemented. Its API could not be reached on 2026-11-25, and `publish.py` exits with a clear error if selected.
- **Kids' content:** `publish.py` marks YouTube uploads `madeForKids: true`, as YouTube/COPPA require for content aimed at children. This turns off comments and personalised ads on those videos.
