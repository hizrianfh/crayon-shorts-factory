"""Word timings for narration audio that comes without timestamps (e.g. Gemini TTS), no speech recognition needed.

Indonesian spelling is nearly phonemic, so a word's spoken length tracks its syllable count. We find speech and
pauses in the audio (10 ms energy frames), pin every phrase end (punctuation) to the nearest real pause, then spread
each phrase's words over the voiced frames inside it, weighted by syllables.

    align_tokens(samples_float_mono, sample_rate, tokens) -> [{"text", "start", "end"}]   (seconds)
"""
import re
import numpy as np

HOP = 0.01  # analysis frame, seconds
LEAD = 0.06  # word onsets start softer than the energy threshold sees; highlight a touch early rather than late
DIPH = re.compile(r"ai|au|oi|ei")


def syllables(tok):
    w = re.sub(r"[^a-zà-ÿ]", "", tok.lower())
    n = len(re.findall(r"[aiueoà-ÿ]", w)) - len(DIPH.findall(w))
    return max(1, n)


def weight(tok):
    w = re.sub(r"[^a-z]", "", tok.lower())
    return syllables(tok) + 0.08 * len(re.findall(r"[^aiueo]", w))


def voiced_mask(x, sr):
    hop = int(sr * HOP)
    n = len(x) // hop
    rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    v = db > max(np.percentile(db, 95) - 32, -55)
    # close tiny gaps (stop consonants) so they don't count as pauses
    i = 0
    while i < n:
        if not v[i]:
            j = i
            while j < n and not v[j]:
                j += 1
            if 0 < i and j < n and j - i <= 5:
                v[i:j] = True
            i = j
        else:
            i += 1
    return v


def align_tokens(x, sr, tokens):
    v = voiced_mask(x, sr)
    idx = np.flatnonzero(v)
    assert len(idx), "no speech found in the narration audio"
    s0, s1 = int(idx[0]), int(idx[-1]) + 1
    pauses, i = [], s0  # silent runs >= 110 ms inside speech: (start, end) in frames
    while i < s1:
        if not v[i]:
            j = i
            while j < s1 and not v[j]:
                j += 1
            if j - i >= 11:
                pauses.append((i, j))
            i = j
        else:
            i += 1

    w = np.array([weight(t) for t in tokens])
    cumv = np.cumsum(v[s0:s1])  # voiced frames so far, per frame
    total_v = cumv[-1]

    def frame_at_voiced(q):  # real frame where voiced-time fraction q of the whole narration is reached
        return s0 + int(np.searchsorted(cumv, q * total_v))

    # anchor phrase boundaries (tokens ending in punctuation) to pauses with one global, order-preserving best fit:
    # close to where the syllable count expects them; sentence ends (.?!) favour long pauses, commas short ones.
    ends = [k for k, t in enumerate(tokens[:-1]) if re.search(r"[.,!?;:…]$", t)]
    expect = [frame_at_voiced(w[: k + 1].sum() / w.sum()) for k in ends]
    full = [bool(re.search(r"[.!?…]$", tokens[k])) for k in ends]
    P = len(pauses)

    def cost(b, j):
        a, e = pauses[j]
        d = ((a + e) / 2 - expect[b]) / 60  # 0.6 s scale
        bonus = 2.5 * min((e - a) / 100, 1.0) if full[b] else 0.8 * min((e - a) / 60, 1.0)
        return d * d - bonus

    SKIP = 1.5  # boundary left unanchored (speaker didn't pause)
    INF = float("inf")
    B = len(ends)
    dp = [[INF] * (P + 1) for _ in range(B + 1)]  # dp[b][j]: best cost placing the first b boundaries on the first j pauses
    move = [[""] * (P + 1) for _ in range(B + 1)]
    for j in range(P + 1):
        dp[0][j], move[0][j] = 0.0, "unused"
    for b in range(1, B + 1):
        dp[b][0], move[b][0] = dp[b - 1][0] + SKIP, "skip"
        for j in range(1, P + 1):
            opts = [(dp[b][j - 1], "unused"), (dp[b - 1][j - 1] + cost(b - 1, j - 1), "use"), (dp[b - 1][j] + SKIP, "skip")]
            dp[b][j], move[b][j] = min(opts)
    choice, b, j = [None] * B, B, P
    while b > 0:
        m = move[b][j]
        if m == "unused":
            j -= 1
        elif m == "use":
            choice[b - 1] = j - 1; b -= 1; j -= 1
        else:
            b -= 1
    spans, start = [], s0
    for b in range(len(ends)):
        if choice[b] is not None:
            a, e = pauses[choice[b]]
            spans.append((start, a)); start = e
        else:
            nxt = next((pauses[c][0] for c in choice[b + 1:] if c is not None), s1)
            m = int(min(max(expect[b], start + 1), nxt - 1))
            spans.append((start, m)); start = m
    spans.append((start, s1))

    out, k0 = [], 0
    for (a, b), k1 in zip(spans, ends + [len(tokens) - 1]):
        toks = list(range(k0, k1 + 1))
        fr = np.flatnonzero(v[a:b]) + a
        if len(fr) == 0:
            fr = np.arange(a, max(b, a + 1))
        cw = np.concatenate([[0], np.cumsum(w[toks])]) / w[toks].sum()
        for n, t in enumerate(toks):
            f0 = fr[min(len(fr) - 1, int(cw[n] * len(fr)))]
            f1 = fr[min(len(fr) - 1, int(cw[n + 1] * len(fr)) - 1)] + 1 if n + 1 < len(toks) else b
            out.append({"text": tokens[t], "start": max(0.0, f0 * HOP - LEAD), "end": max(f1, f0 + 1) * HOP - LEAD})
        k0 = k1 + 1
    return out


if __name__ == "__main__":
    assert syllables("kenapa") == 3 and syllables("pantai") == 2 and syllables("lebah") == 2 and syllables("Wah!") == 1
    print("align_audio self-check ok")
