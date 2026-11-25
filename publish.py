"""Publish out/<name>.mp4 with current/meta.json to TikTok + YouTube Shorts (standard library only).

env: PUBLISHER_API_KEY (required), PUBLISHER_PROVIDER = zernio (default) | scheduleandchill,
     VIDEO (default out/final.mp4), DRY_RUN=1 to print the request without sending.
config.json "publish": enabled, tiktok, youtube, made_for_kids, tiktok_privacy (set from the dashboard).
"""
import json, os, sys, urllib.error, urllib.request

ZERNIO = "https://zernio.com/api/v1"


def call(method, url, key=None, body=None, data=None, ctype="application/json"):
    headers = {"Content-Type": ctype}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    if body is not None:
        data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            txt = r.read().decode() or "{}"
            return r.status, json.loads(txt) if txt.strip().startswith(("{", "[")) else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {url.split('?')[0]} -> HTTP {e.code}: {e.read().decode()[:800]}")


def caption(meta):
    tags = " ".join(t if t.startswith("#") else f"#{t}" for t in meta.get("hashtags", []))
    return f"{meta['description']}\n\n{tags}".strip()


def zernio(key, meta, video, dry, pub):
    body = {"content": caption(meta), "publishNow": True, "platforms": []}
    if pub["tiktok"]:
        body["tiktokSettings"] = {"privacy_level": pub["tiktok_privacy"], "content_preview_confirmed": True,
                                  "express_consent_given": True, "allow_comment": True, "allow_duet": True, "allow_stitch": True}
    yt = {"title": meta["title"][:100], "visibility": "public", "madeForKids": bool(pub["made_for_kids"]), "categoryId": "27"}
    if dry:
        body["mediaItems"] = [{"url": "<uploaded>", "type": "video"}]
        body["platforms"] = ([{"platform": "tiktok", "accountId": "<id>"}] if pub["tiktok"] else []) + \
            ([{"platform": "youtube", "accountId": "<id>", "platformSpecificData": yt}] if pub["youtube"] else [])
        print(json.dumps(body, indent=1)); return
    _, acc = call("GET", f"{ZERNIO}/accounts", key)
    accounts = acc.get("accounts", acc if isinstance(acc, list) else [])
    for a in accounts:
        if a.get("platform") == "tiktok" and pub["tiktok"]:
            body["platforms"].append({"platform": "tiktok", "accountId": a["_id"]})
        elif a.get("platform") == "youtube" and pub["youtube"]:
            body["platforms"].append({"platform": "youtube", "accountId": a["_id"], "platformSpecificData": yt})
    if not body["platforms"]:
        sys.exit("no enabled platform (TikTok/YouTube) is connected in Zernio")
    _, pre = call("POST", f"{ZERNIO}/media/presign", key,
                  {"filename": os.path.basename(video), "contentType": "video/mp4", "size": os.path.getsize(video)})
    with open(video, "rb") as f:
        call("PUT", pre["uploadUrl"], data=f.read(), ctype="video/mp4")  # presigned: no auth header
    body["mediaItems"] = [{"url": pre["publicUrl"], "type": "video"}]
    status, res = call("POST", f"{ZERNIO}/posts", key, body)
    print(f"HTTP {status}", json.dumps(res, indent=1)[:3000])
    if status == 207:
        sys.exit("some platforms failed (HTTP 207), see above")


def publish_config():
    pub = {"enabled": True, "tiktok": True, "youtube": True, "made_for_kids": True, "tiktok_privacy": "PUBLIC_TO_EVERYONE"}
    if os.path.exists("config.json"):
        pub.update(json.load(open("config.json", encoding="utf-8")).get("publish", {}))
    return pub


def main():
    pub = publish_config()
    if not pub["enabled"]:
        print("publishing is turned off in config.json (dashboard); the video is in the run's artifacts")
        return
    meta = json.load(open("current/meta.json", encoding="utf-8"))
    for k in ("title", "description", "hashtags"):
        assert meta.get(k), f"meta.json missing {k}"
    video = os.environ.get("VIDEO", "out/final.mp4")
    dry = os.environ.get("DRY_RUN") == "1"
    if not dry and not os.path.isfile(video):
        sys.exit(f"{video} not found")
    key = os.environ.get("PUBLISHER_API_KEY", "")
    if not key and not dry:
        sys.exit("PUBLISHER_API_KEY is not set")
    provider = (os.environ.get("PUBLISHER_PROVIDER") or "zernio").lower()
    if provider == "zernio":
        zernio(key, meta, video, dry, pub)
    elif provider == "scheduleandchill":
        # shortcut: Schedule & Chill's API could not be verified (domain did not resolve on 2026-11-25); add it once docs exist
        sys.exit("PUBLISHER_PROVIDER=scheduleandchill is not implemented: no verified public API. Use zernio.")
    else:
        sys.exit(f"unknown PUBLISHER_PROVIDER {provider!r}")


if __name__ == "__main__":
    main()
