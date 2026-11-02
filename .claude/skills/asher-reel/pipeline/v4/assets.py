"""Fun image assets for reel panels (installed 2026-11-02).
  python assets.py fluent "money bag" "man teacher default" ...   -> D:/Work/Assets/fluent-emoji/<slug>.png   (Microsoft Fluent Emoji, 3D, MIT; 3,145 images, index.json)
  python assets.py lottie 1f4b8 1f525 ...                          -> D:/Work/Assets/lottie/<codepoint>.json  (Google Noto animated emoji, Lottie; play with lottie-web = lottie/node_modules/lottie-web/build/player/lottie.min.js)
  python assets.py find fire                                       -> lists matching Fluent names
In a page: <img src="img/money_bag_3d.png"> (copy the png next to the film) or lottie.loadAnimation({container,renderer:'svg',loop:false,autoplay:false,path:'x.json'}) then anim.goToAndStop(frame,true) so it renders deterministically.
Fluent names: person emoji have a tone folder (Default/Light/Dark...): use e.g. "man teacher default"."""
import json, sys, os, urllib.request, urllib.parse
D = os.path.dirname(os.path.abspath(__file__)); idx = json.load(open(f"{D}/fluent-emoji/index.json"))
def get(url, out):
    if os.path.exists(out): return
    open(out, "wb").write(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "asher"})).read())
cmd, args = sys.argv[1], sys.argv[2:]
for a in args:
    if cmd == "find":
        print(a, "->", [os.path.basename(x) for x in idx if a.lower() in x.lower()][:12])
    elif cmd == "fluent":
        ws = a.lower().split(); m = [x for x in idx if all(w in x.lower().replace("_", " ") for w in ws)]
        if not m: print("none:", a); continue
        m.sort(key=lambda x: len(x)); p = m[0]; out = f"{D}/fluent-emoji/{os.path.basename(p)}"
        get("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/" + urllib.parse.quote(p), out); print(a, "->", out)
    elif cmd == "lottie":
        out = f"{D}/lottie/{a}.json"; get(f"https://fonts.gstatic.com/s/e/notoemoji/latest/{a}/lottie.json", out); print(a, "->", out)
