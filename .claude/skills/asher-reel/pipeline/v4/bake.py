"""Bake the person layers for the 'pop-out head' layout (run from _work/c1):
  1. person.mp4  = graded 1920x1080 video, cut per edl.json (speed baked in)          [ffmpeg]
  2. popP.mp4 / popM.mp4 = 1080x750 slice (src x X0..X0+1080, y -150..600),
     popP = person * matte over black, popM = inverted matte (white = background).     [mediapipe selfie segmenter]
In the page: panel, then popM with mix-blend-mode:multiply, then popP with mix-blend-mode:plus-lighter => head/cap pops out of the border.
usage: python bake.py [X0=460]"""
import json, subprocess, sys, os
import numpy as np, cv2

X0 = int(sys.argv[1]) if len(sys.argv) > 1 else 460
SW, SH = 1920, 1080   # full-frame matte layers (same transform as the main video)
G = "eq=contrast=1.12:brightness=0.02:saturation=1.18:gamma=0.95,colorbalance=rs=0.03:gs=0.0:bs=-0.04:rm=0.03:bm=-0.03,curves=all='0/0 0.25/0.21 0.75/0.79 1/1'"
E = json.load(open("edl.json"))
parts = []
for i, s in enumerate(E["segs"]):
    parts.append(f"[0:v]trim={s['in']}:{s['out']},setpts=(PTS-STARTPTS)/{s.get('rate', 1.0)},fps=30[v{i}]")
fc = ";".join(parts) + ";" + "".join(f"[v{i}]" for i in range(len(E["segs"]))) + f"concat=n={len(E['segs'])}:v=1:a=0,{G}[v]"
open("bake.filter", "w").write(fc)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "src.mp4", "-/filter_complex", "bake.filter", "-map", "[v]", "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-pix_fmt", "yuv420p", "person.mp4"], check=True)
print("person.mp4 done")
if "--person-only" in sys.argv: sys.exit(0)

# Robust Video Matting (https://github.com/PeterL1n/RobustVideoMatting, cloned at D:/Work/RobustVideoMatting): clean, temporally stable alpha
import torch
sys.path.insert(0, "D:/Work/RobustVideoMatting")
from model import MattingNetwork
dev = "cuda" if torch.cuda.is_available() else "cpu"
rvm = MattingNetwork("resnet50").eval().to(dev); rvm.load_state_dict(torch.load("D:/Work/RobustVideoMatting/rvm_resnet50.pth", map_location=dev))
rec = [None] * 4
@torch.no_grad()
def matte(fr_bgr):
    global rec
    x = torch.from_numpy(cv2.cvtColor(fr_bgr, cv2.COLOR_BGR2RGB)).to(dev).permute(2, 0, 1).float().div(255)[None]
    fgr, pha, *rec = rvm(x, *rec, downsample_ratio=0.25)
    return pha[0, 0].float().cpu().numpy()
def pipe(name, pix):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", pix, "-s", f"{SW}x{SH}", "-r", "30", "-i", "-", "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-pix_fmt", "yuv420p", name], stdin=subprocess.PIPE)
pP, pM = pipe("popP.mp4", "bgr24"), pipe("popM.mp4", "gray")
cap = cv2.VideoCapture("person.mp4"); n = 0; prev = None
while True:
    ok, fr = cap.read()
    if not ok: break
    m = matte(fr)
    ml = np.zeros((SH, SW), np.float32); ml[0:650, 740:1380] = m[0:650, 740:1380]   # head/cap area only (stray blobs ignored)
    pP.stdin.write((fr * ml[..., None]).astype(np.uint8).tobytes())
    pM.stdin.write((255 * (1 - ml)).astype(np.uint8).tobytes())
    n += 1
    if n % 300 == 0: print(n, flush=True)
for p in (pP, pM): p.stdin.close(); p.wait()
print("frames", n)
