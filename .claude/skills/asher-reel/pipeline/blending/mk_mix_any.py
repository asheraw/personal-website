"""Make mix_any.py (run inside cN) from c1/mix2.py: events from ../cN-film, landing words from LAND env,
music can start at a scene (MUSIC_SCENE env), Billie Jean's first 2.3 s on each freeze hold (BILLIE=1) with the music muted there."""
s = open('c1/mix2.py', encoding='utf-8').read()
def sub(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b, 1)
sub('EV = json.load(open("../c1-film/events.json"))["ev"]', 'NN = os.path.basename(os.getcwd())\nEV = json.load(open(f"../{NN}-film/events.json"))["ev"]')
a = s.index('t_ = wt("copy", 40)'); b = s.index('# ---------- music, ducked under speech')
s = s[:a] + '''for w_, mn_ in json.loads(os.environ.get("LAND", "[]")):
    t_ = wt(w_, mn_)
    if t_: landing(SFXD + ("ES_PE Crescendo To Hit 7.mp3" if mn_ % 2 else "ES_PE Crescendo To Hit 8.mp3"), t_, 0.28)

# ---------- music sting on each freeze hold (Billie Jean intro drums), clear and on its own
HOLDS = [(w["s"], w["e"]) for w in WD if w["w"] == "__HOLD__"]
if os.environ.get("BILLIE") == "1":
    bj = read("../../Materials/Billie Jean - Michael Jackson.mp3", 0, 2.6, ch=2)
    for h0, h1 in HOLDS:
        seg = bj[:, :int((h1 - h0 + 0.15) * SR)].copy(); k = int(0.25 * SR); seg[:, -k:] *= np.linspace(1, 0, k)
        i = int(h0 * SR); n_ = min(seg.shape[1], N - i); fol[:, i:i + n_] += seg[:, :n_] * 0.9

''' + s[b:]
sub('mus[:, :m.shape[1]] = m[:, :N]', '''mus[:, :m.shape[1]] = m[:, :N]
M0 = json.load(open(f"../{NN}-film/times.json"))["scenes"][int(os.environ["MUSIC_SCENE"])] if os.environ.get("MUSIC_SCENE") else 0.0
if M0: sh = int(M0 * SR); mus = np.concatenate([np.zeros((2, sh)), mus[:, :N - sh]], axis=1)   # the track starts at its own beginning at M0''')
sub('mus *= np.clip(x / 0.6, 0, 1) * np.clip((DUR - x) / 2.0, 0, 1)',
    '''mus *= np.clip((x - M0) / 0.6, 0, 1) * np.clip((DUR - x) / 2.0, 0, 1)
for h0, h1 in HOLDS:   # silence the bed under each sting
    mus *= 1 - np.clip(1 - np.abs(x - (h0 + h1) / 2) / ((h1 - h0) / 2 + 0.2), 0, 1) ** 0.25''')
open('mix_any.py', 'w', encoding='utf-8').write(s)
print('ok')
