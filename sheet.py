"""Contact sheet of rendered stills: python3 sheet.py [stills dir] -> <dir>/contact_sheet.jpg (3 columns)."""
import glob, os, re, sys
from PIL import Image, ImageDraw

d = sys.argv[1] if len(sys.argv) > 1 else "stills"
files = sorted((f for f in glob.glob(os.path.join(d, "*.jpg")) if not f.endswith("contact_sheet.jpg")),
               key=lambda f: int(re.findall(r"(\d+)\.jpg$", f)[0]) if re.findall(r"(\d+)\.jpg$", f) else 0)
if not files:
    sys.exit(f"no stills in {d}")
tw, th, cols = 360, 640, 3
rows = -(-len(files) // cols)
sheet = Image.new("RGB", (cols * tw + (cols + 1) * 8, rows * th + (rows + 1) * 8), "#2a2522")
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((tw, th))
    x, y = 8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + 8)
    sheet.paste(im, (x, y))
    ImageDraw.Draw(sheet).text((x + 6, y + 6), os.path.basename(f), fill="#ffffff")
out = os.path.join(d, "contact_sheet.jpg")
sheet.save(out, quality=88)
print(out, len(files), "stills")
