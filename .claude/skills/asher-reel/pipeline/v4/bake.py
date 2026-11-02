"""Bake the person layers for the 'pop-out head' layout (run from _work/c1):
  1. person.mp4  = graded 1920x1080 video, cut per edl.json (speed baked in)          [ffmpeg]
  2. popP.mp4 / popM.mp4 = 1080x750 slice (src x X0..X0+1080, y -150..600),
     popP = person * matte over black, popM = inverted matte (white = background).     [mediapipe selfie segmenter]
In the page: panel, then popM with mix-blend-mode:multiply, then popP with mix-blend-mode:plus-lighter => head/cap pops out of the border.
usage: python bake.py [X0=460]"""
import json, subprocess, sys, os
import numpy as np, cv2, mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision

X0 = int(sys.argv[1]) if len(sys.argv) > 1 else 460
Y1 = 600; PAD = 150; SW, SH = 1080, Y1 + PAD   # slice = src rows -150..600 (rows below the border are clipped in the page but needed when zooming)
G = "eq=contrast=1.12:brightness=0.02:saturation=1.18:gamma=0.95,colorbalance=rs=0.03:gs=0.0:bs=-0.04:rm=0.03:bm=-0.03,curves=all='0/0 0.25/0.21 0.75/0.79 1/1'"
E = json.load(open("edl.json"))
parts = []
for i, s in enumerate(E["segs"]):
    parts.append(f"[0:v]trim={s['in']}:{s['out']},setpts=(PTS-STARTPTS)/{s.get('rate', 1.0)},fps=30[v{i}]")
fc = ";".join(parts) + ";" + "".join(f"[v{i}]" for i in range(len(E["segs"]))) + f"concat=n={len(E['segs'])}:v=1:a=0,{G}[v]"
open("bake.filter", "w").write(fc)
if not os.path.exists("person.mp4") or "--rebake" in sys.argv: subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "src.mp4", "-/filter_complex", "bake.filter", "-map", "[v]", "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-pix_fmt", "yuv420p", "person.mp4"], check=True)
print("person.mp4 done")

opts = vision.ImageSegmenterOptions(base_options=mpt.BaseOptions(model_asset_path="selfie.tflite"), output_confidence_masks=True, output_category_mask=False, running_mode=vision.RunningMode.IMAGE)
seg = vision.ImageSegmenter.create_from_options(opts)
def pipe(name, pix):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", pix, "-s", f"{SW}x{SH}", "-r", "30", "-i", "-", "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-pix_fmt", "yuv420p", name], stdin=subprocess.PIPE)
pP, pM = pipe("popP.mp4", "bgr24"), pipe("popM.mp4", "gray")
cap = cv2.VideoCapture("person.mp4"); n = 0; prev = None
while True:
    ok, fr = cap.read()
    if not ok: break
    rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)
    m = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)).confidence_masks[0].numpy_view()[..., 0].copy()
    m = np.clip((m - 0.06) / 0.25, 0, 1)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    b = (m > 0.5).astype(np.uint8); k, lab, st, _ = cv2.connectedComponentsWithStats(b)
    if k > 1:
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); keep = (lab == big).astype(np.float32)
        keep = cv2.dilate(keep, np.ones((15, 15), np.uint8)); m = m * keep
    m = cv2.GaussianBlur(m, (0, 0), 1.6)
    if prev is not None: m = 0.6 * m + 0.4 * prev
    prev = m
    sl = np.zeros((SH, SW, 3), np.uint8); ml = np.zeros((SH, SW), np.float32)
    sl[PAD:] = fr[0:Y1, X0:X0 + SW]; ml[PAD:] = m[0:Y1, X0:X0 + SW]
    ml[:, :190] = 0; ml[:, 890:] = 0   # only the head area: keeps stray matte blobs (chair, shelves) out of the pop-out
    pP.stdin.write((sl * ml[..., None]).astype(np.uint8).tobytes())
    pM.stdin.write((255 * (1 - ml)).astype(np.uint8).tobytes())
    n += 1
    if n % 300 == 0: print(n, flush=True)
for p in (pP, pM): p.stdin.close(); p.wait()
print("frames", n)
