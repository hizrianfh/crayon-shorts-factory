# Crayon Shorts Factory

A daily, zero-extra-bill pipeline for 30–45 s vertical history, engineering and mystery shorts in a **Wax Crayon Storybook** style.

```
Claude Code Routine (daily, your Pro/Max plan)          GitHub Actions ($0 on a public repo)
  script + edge-tts voice + timing.py                    prepare -> 4x render (Playwright + three.js)
  cast.js / story.js / audio.py                    push    -> audio.py + mix.py + finish.sh
  6-still contact sheet self-QA            ─────────────>  -> publish.py (Zernio -> TikTok + YouTube Shorts)
```

## Layout
| Path | What |
|---|---|
| `engine/` | Renderer: `main.js` (world + crayon character cards), `crayon.js` (`crayonStroke`, `crayonFill`, `paperGrainOverlay`, `drawCharacter`), `paint.js` (crayon surfaces + sky), `motion.js` (timing helpers) |
| `scripts/setup_engine.sh` | Idempotent bootstrap: clones `mromidev/claude-animated-shorts`, strips `toon.ts` → `engine/toonbase.js`, unpacks `three@0.160.0`, installs Chromium |
| `render.mjs` | `node render.mjs frames "0-224"` or `node render.mjs stills/check 0,150,300` |
| `timing.py` | Voice + script → `current/work/phrases.json` (30 fps phrase frames) |
| `synth.py`, `mix.py`, `finish.sh` | Music/SFX synth helpers, ducked mix, final 1080x1920 MP4 at −14 LUFS |
| `publish.py` | Zernio upload + publish now (TikTok + YouTube). `DRY_RUN=1` prints the request |
| `current/` | Today's episode, written by the routine (`voice.mp3` is tracked on purpose) |
| `examples/demo/` | Reference episode showing the `story.js` / `cast.js` / `audio.py` contract |
| `prompts/claude_routine_prompt.md` | Paste into claude.ai/code/routines |

## Claude Code Routine setup
In **claude.ai/code/routines**: create a routine, connect this repo, paste `prompts/claude_routine_prompt.md`, and set a daily schedule.

Cloud Environment **setup script**:
```bash
pip install edge-tts numpy Pillow && npx playwright install --with-deps chromium && apt-get update && apt-get install -y ffmpeg
```
The routine must be allowed to push to `main`.

## GitHub settings
**Settings → Secrets and variables → Actions**
- Secret `PUBLISHER_API_KEY`: your Zernio API key (`sk_…`).
- Variable `PUBLISHER_PROVIDER`: `zernio`.
- Optional variable `TIKTOK_PRIVACY` (default `PUBLIC_TO_EVERYONE`). Wire it into the workflow `env` if you need another level.

**Settings → Actions → General → Workflow permissions**: the defaults are fine. The workflow only reads the repo.

## Publishing provider
- **Zernio** (implemented): 2 social accounts free, unlimited posts. Connect TikTok + YouTube in its dashboard, then create an API key.
- **Schedule & Chill**: not implemented. Its site and API could not be reached (2026-11-25). `publish.py` exits with a clear error if this provider is selected.

## Cost notes
- A public repo has unlimited standard-runner minutes.
- A private repo has 2,000 free min/month. One episode costs about 4 × 10–20 min plus the mix job (~45–85 billed min), so daily episodes on a private repo will run out of minutes mid-month.

## Local run
```bash
bash scripts/setup_engine.sh            # Linux may also need: sudo npx playwright install-deps chromium
EP=/examples/demo node render.mjs stills/check 10,120,200 && python3 sheet.py stills
```
