"""Reel 8 audio: voice (cut per edl.json, 1.05x) + sound design from the board's cues + music ducked under voice.
No marker-stroke sounds. Sound design = risers that land on hits, soft pitched pops, sparkle on the gold 'turn words', chimes, magnet clacks.
Run: python mix2.py (WEB=1 for the other-platforms cut; MUSIC=<file in ../Music>) -> voice.wav foley.wav music.wav mix.wav"""
import json, os, subprocess, wave
import numpy as np

SR = 48000
EDL = json.load(open("edl.json"))
WEBV = os.environ.get("WEB") == "1"
EV = json.load(open("../reel-8-board/events" + ("_web" if WEBV else "") + ".json"))["ev"]
DUR = EDL["dur"]
N = int(SR * DUR) + SR
MUSIC = "../../Music/" + os.environ.get("MUSIC", "ES_Miami - Lofive.wav")
SFX = "C:/Users/Admin/.claude/skills/media-use/audio/assets/sfx/"
rng = np.random.default_rng(11)


def read(path, a=0, b=None, ch=1, rate=1.0):
    cmd = ["ffmpeg", "-v", "error"] + (["-ss", str(a)] if a else []) + (["-t", str(b - a)] if b else []) + ["-i", path, "-vn", "-ac", str(ch), "-ar", str(SR)]
    if rate != 1.0: cmd += ["-af", f"atempo={rate}"]
    out = subprocess.run(cmd + ["-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(out, np.float32).astype(np.float64)
    return x if ch == 1 else x.reshape(-1, 2).T


def fade(x, ms=8):
    n = min(len(x) // 2, int(SR * ms / 1000)); r = np.linspace(0, 1, n)
    x[:n] *= r; x[-n:] *= r[::-1]
    return x


def put(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1] or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), buf.shape[1] - i)
    buf[0, i:i + n] += sig[:n] * gain * (1 - max(0, pan)); buf[1, i:i + n] += sig[:n] * gain * (1 + min(0, pan))


def pitch(x, r):  # resample: r>1 = higher + shorter
    n = int(len(x) / r); return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)



def sq(f, d, duty=.5, vol=1.0, dec=6.0, slide=0.0):    # chip pulse note: freq f Hz for d seconds with a decay (and optional pitch slide)
    n = int(d * SR); u = np.arange(n) / SR; ph = np.cumsum(f * (1 + slide * u / max(d, 1e-3))) / SR
    w = np.where((ph % 1) < duty, 1.0, -1.0) * np.exp(-u * dec) * vol
    return fade(w * 0.5, 2)


def seq(notes, step, **kw):
    out = np.zeros(int(SR * (step * len(notes) + .4)))
    for i, f in enumerate(notes):
        s_ = sq(f, step * 1.6, **kw); j = int(i * step * SR); out[j:j + len(s_)] += s_[:len(out) - j]
    return out


LIB = {k: read(SFX + k + ".mp3") for k in ("pop", "sparkle", "impact-bass-1", "riser", "chime", "click-soft")}

# ---------- voice
voice = np.zeros((2, N))
for s in EDL["segs"]:
    put(voice, fade(read('src.mp4', s["in"], s["out"], rate=s.get("rate", 1.0))), s["start"])
voice *= 0.89 / np.max(np.abs(voice))

# ---------- sound design from the board's cues
fol = np.zeros((2, N))
for e in EV:
    t, ty = e["t"], e["type"]
    if ty == "pop":
        put(fol, pitch(LIB["pop"], e.get("r", 1.0)), t, 0.20)
    elif ty == "turn":                                           # gold Playfair word wipes in: sparkle + a soft low hit
        put(fol, LIB["sparkle"][:int(SR * 1.2)], t, 0.14)
        put(fol, LIB["impact-bass-1"][:int(SR * 1.2)], t, 0.10)
    elif ty == "riser":                                          # last d seconds of the riser's ramp, so it peaks exactly on the hit
        d = e["dur"]; r = LIB["riser"]; end = int(4.5 * SR); seg = r[max(0, end - int(d * SR)):end].copy()
        seg *= np.linspace(0, 1, len(seg)) ** 1.5
        put(fol, seg, t, 0.12)
    elif ty == "key":
        n = int(.03 * SR); u = np.arange(n) / SR
        put(fol, rng.standard_normal(n) * np.exp(-u * 120) * .6 + np.sin(2 * np.pi * (700 + 300 * rng.random()) * u) * np.exp(-u * 90) * .3, t + (rng.random() - .5) * .01, .16)
    elif ty == "notif":
        put(fol, seq([1047, 1568], .09, duty=.5, dec=8) * .6 + 0, t, .20)
    elif ty == "swish":
        n = int(.35 * SR); u = np.arange(n) / SR; nz = rng.standard_normal(n); k = np.convolve(nz, np.ones(24) / 24, "same")
        put(fol, k * np.sin(np.pi * np.clip(u / .35, 0, 1)) ** 2 * 1.6, t, .16)
    elif ty == "flash":
        n = int(.25 * SR); u = np.arange(n) / SR
        put(fol, rng.standard_normal(n) * np.exp(-u * 30) * .6 + np.sin(2 * np.pi * 2400 * u) * np.exp(-u * 12) * .4, t, .38)
    elif ty == "scratch":
        n = int(.35 * SR); u = np.arange(n) / SR; ph = np.cumsum(np.where(u < .17, 900 - 4200 * u, 200 + 3200 * (u - .17))) / SR
        put(fol, (np.sign(np.sin(2 * np.pi * ph)) * .5 + rng.standard_normal(n) * .3) * np.exp(-u * 5), t, .22)
    elif ty == "blip":
        put(fol, sq(660 * e.get("r", 1.0), .09, .25, 1, 14), t, .20)
    elif ty == "select":
        put(fol, seq([784, 1175], .06, duty=.5, dec=9), t, .22)
    elif ty == "tick":
        put(fol, sq(1500, .03, .125, 1, 60), t, .16)
    elif ty == "coin":
        put(fol, seq([988, 1319], .07, duty=.5, dec=7), t, .20)
    elif ty == "error":
        put(fol, sq(110, .22, .5, 1, 5, slide=-.4), t, .22)
    elif ty == "levelup":
        put(fol, seq([523, 659, 784, 1047, 784, 1047, 1319], .075, duty=.25, dec=5), t, .24)
    elif ty == "fanfare":
        put(fol, seq([523, 523, 523, 659, 784, 659, 784, 1047], .11, duty=.25, dec=3), t, .26)
        put(fol, seq([262, 262, 262, 330, 392, 330, 392, 523], .11, duty=.5, dec=3), t, .16)
    elif ty == "door":
        n = int(.6 * SR); u = np.arange(n) / SR; nz = rng.standard_normal(n) * np.exp(-u * 3) * np.sin(np.pi * np.minimum(u / .2, 1))
        put(fol, nz * .5 + sq(70, .6, .5, 1, 4) * .6, t, .22)
    elif ty == "swirl":
        put(fol, sq(300, .24, .5, 1, 3, slide=3.0), t, .12)
    elif ty == "hit":
        put(fol, LIB["impact-bass-1"][:int(SR * 1.6)], t, 0.16)
    elif ty == "chime":
        put(fol, LIB["chime"][:int(SR * 1.6)], t, 0.10)
    elif ty == "magnet":
        n = int(0.45 * SR); u = np.arange(n) / SR; click = np.zeros(n); click[:120] = rng.standard_normal(120)
        ring = sum(np.sin(2 * np.pi * f * u) * np.exp(-u / 0.06) * a for f, a in ((830, .5), (1370, .35), (2210, .25), (3120, .15)))
        put(fol, click * 0.6 + ring * 0.5 + np.sin(2 * np.pi * 140 * u) * np.exp(-u / 0.05), t, 0.26, 0)

# ---------- music, ducked under speech
mus = np.zeros((2, N))
m = read(MUSIC, 0, DUR + 1, ch=2)
mus[:, :m.shape[1]] = m[:, :N]
vm = np.abs(voice[0]); win = int(.12 * SR)
envv = np.convolve(vm, np.ones(win) / win, "same")
duck = 1 - 0.6 * np.clip(envv / (envv.max() * .2), 0, 1)
duck = np.convolve(duck, np.ones(int(.15 * SR)) / int(.15 * SR), "same")
mus *= duck
x = np.arange(N) / SR
mus *= np.clip(x / 0.6, 0, 1) * np.clip((DUR - x) / 2.0, 0, 1)


def rms(b): return 20 * np.log10(np.sqrt(np.mean(b[:, :int(DUR * SR)] ** 2)) + 1e-9)
mus *= 10 ** ((rms(voice) - 15.5 - rms(mus)) / 20)
mix = voice + fol + mus
mix /= max(1, np.max(np.abs(mix)) / 0.95)


def write(name, buf):
    b = np.clip(buf[:, :int(DUR * SR)], -1, 1)
    with wave.open(name, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((b.T * 32767).astype("<i2").tobytes())
for n_, b in (("voice.wav", voice), ("foley.wav", fol), ("music.wav", mus), ("mix.wav", mix)): write(n_, b)
print("voice", round(rms(voice), 1), "sfx", round(rms(fol), 1), "music", round(rms(mus), 1), "mix", round(rms(mix), 1), "dBFS RMS;", len(EV), "sfx events")
