"""Indonesian narration + word timings + kid captions, from one edge-tts call.

    python3 scripts/generate_voice_and_captions.py [--ep current] [--voice id-ID-GadisNeural] [--rate=-6%]

Reads <ep>/script.txt. Writes <ep>/voice.mp3, <ep>/work/phrases.json (30 fps word + phrase frames),
<ep>/captions.ass (2-3 words per chunk, active word in yellow), and sets total_frames in <ep>/meta.json if present.
"""
import argparse, asyncio, json, math, os, re
import edge_tts

FPS = 30
TAIL = 0.8  # seconds of picture after the last word
YELLOW, WHITE, INK = "&H4DE1FF&", "&HFFFFFF&", "&H22252A&"  # ASS colours are &HBBGGRR&

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


async def tts(text, voice, rate, mp3):
    com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append({"text": ch["text"], "start": ch["offset"] / 1e7, "end": (ch["offset"] + ch["duration"]) / 1e7})
    return words


def align(tokens, words):
    """map each script token to the tts word that contains its first letter (robust to split/merged words)"""
    owner = []
    for i, w in enumerate(words):
        owner += [i] * len(norm(w["text"]))
    out, pos = [], 0
    for t in tokens:
        n = len(norm(t))
        if n == 0:
            out.append(out[-1] if out else 0)
            continue
        out.append(owner[min(pos, len(owner) - 1)])
        pos += n
    assert abs(pos - len(owner)) <= max(3, len(owner) // 20), f"script/tts text mismatch ({pos} vs {len(owner)} letters)"
    return out


def ts(s):
    cs = int(round(s * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def chunks_of(n):
    """split n words into chunks of 2-3 (never a lone word unless n == 1)"""
    if n <= 3:
        return [n]
    if n == 4:
        return [2, 2]
    return [3] + chunks_of(n - 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep", default="current")
    ap.add_argument("--voice", default="id-ID-GadisNeural")
    ap.add_argument("--rate", default="-6%")
    a = ap.parse_args()
    text = " ".join(open(os.path.join(a.ep, "script.txt"), encoding="utf-8").read().split())
    words = asyncio.run(tts(text, a.voice, a.rate, os.path.join(a.ep, "voice.mp3")))
    assert words, "edge-tts returned no WordBoundary events"

    tokens = text.split()
    tok_word = align(tokens, words)
    # token timing = span of the tts words it owns
    toks = []
    for i, t in enumerate(tokens):
        mine = [j for j, k in enumerate(tok_word) if k == tok_word[i]]
        first = mine.index(i)
        w = words[tok_word[i]]
        dur = (w["end"] - w["start"]) / len(mine)  # tokens sharing one tts word split its time
        toks.append({"text": t, "start": w["start"] + dur * first, "end": w["start"] + dur * (first + 1)})

    # phrases end at punctuation
    phrases, cur = [], []
    for i, t in enumerate(toks):
        cur.append(i)
        if re.search(r"[.,!?;:…]$", t["text"]) or i == len(toks) - 1:
            phrases.append(cur)
            cur = []

    total = math.ceil((toks[-1]["end"] + TAIL) * FPS)
    F = lambda s: round(s * FPS)
    out = {
        "duration": round(toks[-1]["end"], 3), "total_frames": total,
        "words": [{"i": i, "text": t["text"], "start": round(t["start"], 3), "end": round(t["end"], 3), "f0": F(t["start"]), "f1": max(F(t["end"]), F(t["start"]) + 1)} for i, t in enumerate(toks)],
        "phrases": [{"i": k, "text": " ".join(toks[i]["text"] for i in p), "w0": p[0], "w1": p[-1], "f0": F(toks[p[0]]["start"]), "f1": F(toks[p[-1]]["end"])} for k, p in enumerate(phrases)],
    }
    os.makedirs(os.path.join(a.ep, "work"), exist_ok=True)
    json.dump(out, open(os.path.join(a.ep, "work", "phrases.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # captions: 2-3 word chunks inside each phrase; one event per active word with that word in yellow
    clean = lambda s: re.sub(r"[.,;:…]+$", "", s)
    chunks = []
    for p in phrases:
        k = 0
        for n in chunks_of(len(p)):
            chunks.append(p[k:k + n])
            k += n
    lines = []
    for c_i, c in enumerate(chunks):
        nxt = toks[chunks[c_i + 1][0]]["start"] if c_i + 1 < len(chunks) else toks[c[-1]]["end"] + 0.4
        c_end = nxt if nxt - toks[c[-1]]["end"] < 0.35 else toks[c[-1]]["end"] + 0.2
        for j, wi in enumerate(c):
            s = toks[wi]["start"]
            e = toks[c[j + 1]]["start"] if j + 1 < len(c) else c_end
            pop = r"{\fscx82\fscy82\t(0,90,\fscx100\fscy100)}" if j == 0 else ""
            body = " ".join((f"{{\\c{YELLOW}}}{clean(toks[k]['text'])}{{\\c{WHITE}}}" if k == wi else clean(toks[k]["text"])) for k in c)
            lines.append(f"Dialogue: 0,{ts(s)},{ts(e)},Kid,,0,0,0,,{pop}{body}")
    with open(os.path.join(a.ep, "captions.ass"), "w", encoding="utf-8") as f:
        f.write(ASS_HEAD + "\n".join(lines) + "\n")

    meta = os.path.join(a.ep, "meta.json")
    if os.path.exists(meta):
        m = json.load(open(meta, encoding="utf-8"))
        m["total_frames"] = total
        json.dump(m, open(meta, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"voice {out['duration']:.2f} s, {len(toks)} words, {len(phrases)} phrases, {len(chunks)} caption chunks, total_frames={total}")
    for p in out["phrases"]:
        print(f"  {p['f0']:5d}-{p['f1']:5d}  {p['text']}")


if __name__ == "__main__":
    assert chunks_of(5) == [3, 2] and chunks_of(4) == [2, 2] and chunks_of(7) == [3, 2, 2]
    main()
