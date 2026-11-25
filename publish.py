"""Publish out/<name>.mp4 with current/meta.json to TikTok + YouTube Shorts (standard library only).

env: PUBLISHER_API_KEY (required), PUBLISHER_PROVIDER = zernio (default) | scheduleandchill,
     VIDEO (default out/final.mp4), DRY_RUN=1 to print the request without sending,
     TIKTOK_PRIVACY (default PUBLIC_TO_EVERYONE; must be a level TikTok allows for the account).
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


def zernio(key, meta, video, dry):
    body = {
        "content": caption(meta),
        "publishNow": True,
        "platforms": [],
        "tiktokSettings": {"privacy_level": os.environ.get("TIKTOK_PRIVACY", "PUBLIC_TO_EVERYONE"),
                           "content_preview_confirmed": True, "express_consent_given": True,
                           "allow_comment": True, "allow_duet": True, "allow_stitch": True},
    }
    if dry:
        body["mediaItems"] = [{"url": "<uploaded>", "type": "video"}]
        body["platforms"] = [{"platform": "tiktok", "accountId": "<id>"}, {"platform": "youtube", "accountId": "<id>"}]
        print(json.dumps(body, indent=1)); return
    _, acc = call("GET", f"{ZERNIO}/accounts", key)
    accounts = acc.get("accounts", acc if isinstance(acc, list) else [])
    for a in accounts:
        if a.get("platform") == "tiktok":
            body["platforms"].append({"platform": "tiktok", "accountId": a["_id"]})
        elif a.get("platform") == "youtube":
            body["platforms"].append({"platform": "youtube", "accountId": a["_id"], "platformSpecificData": {
                "title": meta["title"][:100], "visibility": "public", "madeForKids": True, "categoryId": "27"}})
    if not body["platforms"]:
        sys.exit("no TikTok or YouTube account connected in Zernio")
    _, pre = call("POST", f"{ZERNIO}/media/presign", key,
                  {"filename": os.path.basename(video), "contentType": "video/mp4", "size": os.path.getsize(video)})
    with open(video, "rb") as f:
        call("PUT", pre["uploadUrl"], data=f.read(), ctype="video/mp4")  # presigned: no auth header
    body["mediaItems"] = [{"url": pre["publicUrl"], "type": "video"}]
    status, res = call("POST", f"{ZERNIO}/posts", key, body)
    print(f"HTTP {status}", json.dumps(res, indent=1)[:3000])
    if status == 207:
        sys.exit("some platforms failed (HTTP 207), see above")


def main():
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
        zernio(key, meta, video, dry)
    elif provider == "scheduleandchill":
        # shortcut: Schedule & Chill's API could not be verified (domain did not resolve on 2026-11-25); add it once docs exist
        sys.exit("PUBLISHER_PROVIDER=scheduleandchill is not implemented: no verified public API. Use zernio.")
    else:
        sys.exit(f"unknown PUBLISHER_PROVIDER {provider!r}")


if __name__ == "__main__":
    main()
