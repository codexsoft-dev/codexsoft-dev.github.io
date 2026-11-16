from pathlib import Path
html = Path(r"d:\My Documents\Development\web-site\codex-soft\index.html").read_text(encoding="utf-8")
i = html.find('id="experience"')
j = html.find('id="about"')
chunk = html[i:j]
# strip svgs for readability but keep structure tags
import re
text = re.sub(r"<svg[\s\S]*?</svg>", "[svg]", chunk)
print(text[:6000])
print("\n---LEN", len(chunk))
