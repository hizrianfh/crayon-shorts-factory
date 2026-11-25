"""Step B: exact timings measured from the narration audio.  python3 scripts/transcribe_srt.py [--ep current]

Runs faster-whisper (base, language id, word timestamps, int8) on <ep>/voice.mp3. Whisper decides WHEN each word is
spoken; the words themselves always come from <ep>/script.txt (Whisper's spelling is matched back to the script
letter by letter), so captions never show a mis-heard word. Writes:
  <ep>/subtitles.srt        2-3 word chunks, human-readable
  <ep>/work/words.json      per-word start/end seconds + 30 fps frames, phrases, chunks, total_frames
  <ep>/captions.ass         kids' captions (Fredoka, active word yellow) built from the same chunks
and total_frames in <ep>/meta.json. Exits with code 3 if the video would be outside config duration.min..max.
"""
import argparse, difflib, json, math, os, re

FPS = 30
TAIL = 0.8  # seconds of picture after the last word
YELLOW, WHITE = "&H4DE1FF&", "&HFFFFFF&"  # ASS colours are &HBBGGRR&
ASS_HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Kid,Fredoka,96,&H00FFFFFF,&H00FFFFFF,&H0022252A,&H5A1A1410,-1,0,0,0,100,100,1,0,1,8,5,2,90,90,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def norm(s):
    return re.sub(r"[^0-9a-zà-ÿ]", "", s.lower())


def chunks_of(n):
    """split n words into chunks of 2-3 (never a lone word unless n == 1)"""
    if n <= 3:
        return [n]
    if n == 4:
        return [2, 2]
    return [3] + chunks_of(n - 3)


def match_to_script(tokens, heard):
    """script tokens + whisper words [(text, start, end)] -> per-token (start, end); returns (times, matched share)"""
    s_str, s_own = "", []
    for i, t in enumerate(tokens):
        n = norm(t); s_str += n; s_own += [i] * len(n)
    w_str, w_own = "", []
    for j, (t, _, _) in enumerate(heard):
        n = norm(t); w_str += n; w_own += [j] * len(n)
    hit = {}
    for a, b, size in difflib.SequenceMatcher(None, s_str, w_str, autojunk=False).get_matching_blocks():
        for k in range(size):
            hit.setdefault(s_own[a + k], set()).add(w_own[b + k])
    times = [None] * len(tokens)
    for i, js in hit.items():
        times[i] = [min(heard[j][1] for j in js), max(heard[j][2] for j in js)]
    # tokens Whisper missed entirely: share the gap between their matched neighbours by letter count
    i = 0
    while i < len(tokens):
        if times[i] is not None:
            i += 1; continue
        j = i
        while j < len(tokens) and times[j] is None:
            j += 1
        lo = times[i - 1][1] if i else (heard[0][1] if heard else 0.0)
        hi = times[j][0] if j < len(tokens) else max(lo + 0.3 * (j - i), heard[-1][2] if heard else lo)
        L = [max(1, len(norm(tokens[k]))) for k in range(i, j)]
        acc = lo
        for k, l in zip(range(i, j), L):
            d = (hi - lo) * l / sum(L)
            times[k] = [acc, acc + d]; acc += d
        i = j
    for k in range(1, len(times)):  # keep strictly in order
        times[k][0] = max(times[k][0], times[k - 1][0] + 0.02)
        times[k][1] = max(times[k][1], times[k][0] + 0.05)
    return times, len([c for c in range(len(s_str)) if s_own[c] in hit]) / max(1, len(s_str))


def ts_ass(s):
    cs = int(round(s * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def ts_srt(s):
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def main():
    cfg = json.load(open("config.json", encoding="utf-8")) if os.path.exists("config.json") else {}
    limits = cfg.get("duration", {"min": 35, "max": 45})
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep", default="current")
    ap.add_argument("--model", default="base")
    a = ap.parse_args()
    text = " ".join(open(os.path.join(a.ep, "script.txt"), encoding="utf-8").read().split())
    tokens = text.split()

    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(os.path.join(a.ep, "voice.mp3"), language="id", word_timestamps=True,
                                   initial_prompt=text, condition_on_previous_text=False, beam_size=5)
    heard = [(w.word.strip(), w.start, w.end) for s in segments for w in (s.words or [])]
    assert heard, "Whisper heard no words in voice.mp3"
    times, share = match_to_script(tokens, heard)
    print(f"whisper heard: {' '.join(h[0] for h in heard)}")
    print(f"matched to script: {share * 100:.0f}% of letters")
    if share < 0.6:
        raise SystemExit("Whisper's transcript barely matches script.txt: is voice.mp3 the narration of this script?")

    F = lambda s: round(s * FPS)
    words = [{"i": i, "text": t, "start": round(s, 3), "end": round(e, 3), "f0": F(s), "f1": max(F(e), F(s) + 1)}
             for i, (t, (s, e)) in enumerate(zip(tokens, times))]
    phrases, cur = [], []
    for i, t in enumerate(tokens):
        cur.append(i)
        if re.search(r"[.,!?;:…]$", t) or i == len(tokens) - 1:
            phrases.append(cur); cur = []
    chunks = []
    for p in phrases:
        k = 0
        for n in chunks_of(len(p)):
            chunks.append(p[k:k + n]); k += n
    clean = lambda s: re.sub(r"[.,;:…]+$", "", s)
    cdata = []
    for ci, c in enumerate(chunks):
        last_end = words[c[-1]]["end"]
        nxt = words[chunks[ci + 1][0]]["start"] if ci + 1 < len(chunks) else last_end + 0.4
        end = nxt if nxt - last_end < 0.35 else last_end + 0.2
        cdata.append({"text": " ".join(clean(tokens[k]) for k in c), "w0": c[0], "w1": c[-1],
                      "start": words[c[0]]["start"], "end": round(end, 3), "f0": F(words[c[0]]["start"]), "f1": F(end)})

    total = math.ceil((words[-1]["end"] + TAIL) * FPS)
    out = {"source": f"faster-whisper {a.model} (id, word timestamps) matched to script.txt", "match": round(share, 3),
           "duration": words[-1]["end"], "total_frames": total, "words": words,
           "phrases": [{"i": k, "text": " ".join(tokens[i] for i in p), "w0": p[0], "w1": p[-1],
                        "f0": words[p[0]]["f0"], "f1": words[p[-1]]["f1"]} for k, p in enumerate(phrases)],
           "chunks": cdata}
    os.makedirs(os.path.join(a.ep, "work"), exist_ok=True)
    json.dump(out, open(os.path.join(a.ep, "work", "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    with open(os.path.join(a.ep, "subtitles.srt"), "w", encoding="utf-8") as f:
        for n, c in enumerate(cdata, 1):
            f.write(f"{n}\n{ts_srt(c['start'])} --> {ts_srt(c['end'])}\n{c['text']}\n\n")

    lines = []
    for c, ids in zip(cdata, chunks):
        for j, wi in enumerate(ids):
            e = words[ids[j + 1]]["start"] if j + 1 < len(ids) else c["end"]
            pop = r"{\fscx82\fscy82\t(0,90,\fscx100\fscy100)}" if j == 0 else ""
            body = " ".join((f"{{\\c{YELLOW}}}{clean(tokens[k])}{{\\c{WHITE}}}" if k == wi else clean(tokens[k])) for k in ids)
            lines.append(f"Dialogue: 0,{ts_ass(words[wi]['start'])},{ts_ass(e)},Kid,,0,0,0,,{pop}{body}")
    with open(os.path.join(a.ep, "captions.ass"), "w", encoding="utf-8") as f:
        f.write(ASS_HEAD + "\n".join(lines) + "\n")

    meta = os.path.join(a.ep, "meta.json")
    if os.path.exists(meta):
        m = json.load(open(meta, encoding="utf-8"))
        m["total_frames"] = total
        json.dump(m, open(meta, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(words)} words, {len(phrases)} phrases, {len(cdata)} subtitle chunks, total_frames={total} ({total / FPS:.1f} s)")
    length = total / FPS
    if not limits["min"] <= length <= limits["max"]:
        wps = len(words) / max(out["duration"], 0.1)
        target = (limits["min"] + limits["max"]) / 2 - TAIL
        print(f"OUT OF RANGE: video is {length:.1f} s, config wants {limits['min']}-{limits['max']} s. "
              f"{'Add' if length < limits['min'] else 'Cut'} about {abs(round((target - out['duration']) * wps))} words "
              f"({wps:.2f} words/s), then run Step A and B again.")
        raise SystemExit(3)
    print(f"duration OK: {length:.1f} s (config {limits['min']}-{limits['max']} s)")


if __name__ == "__main__":
    assert chunks_of(5) == [3, 2] and chunks_of(4) == [2, 2] and chunks_of(7) == [3, 2, 2]
    t, share = match_to_script(["Di", "Taman!", "Halo"], [("di", 0.1, 0.3), ("taman", 0.3, 0.8)])
    assert share > 0.6 and t[1] == [0.3, 0.8] and t[2][0] >= 0.8, t  # unheard last word lands after the heard ones
    main()
