"""Cut the black background off the Frankenstein artwork (flood from the border) -> transparent PNGs + a 3-character group image. python cut/cutout.py (from _work)"""
import cv2, numpy as np
M = "../Materials/"
def cut(name, out, thr=14, pockets=False):
    im = cv2.imread(M + name, cv2.IMREAD_COLOR)
    dark = (im.max(axis=2) < thr).astype(np.uint8)
    n, lab = cv2.connectedComponents(dark, connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = np.bincount(lab.ravel()); big = [i for i in range(1, n) if pockets and sizes[i] > 0.002 * lab.size]   # enclosed black pockets (between arm and body)
    bg = np.isin(lab, list(border) + big).astype(np.float32)
    a = 1 - cv2.GaussianBlur(cv2.dilate(bg, np.ones((3, 3), np.uint8)), (0, 0), 1.3)
    rgba = np.dstack([im, (a * 255).astype(np.uint8)])
    ys, xs = np.where(a > 0.05); rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    cv2.imwrite(out, rgba); return rgba
mon = cut("Frankenstein Monster.png", "cut/monster.png"); vic = cut("Victor Frankenstein the Scientist.png", "cut/victor.png"); bri = cut("Frankenstein Patchwork Bride.png", "cut/bride.png", pockets=True)
def put(canvas, im, h, cx, bottom):
    w = int(im.shape[1] * h / im.shape[0]); r = cv2.resize(im, (w, h), interpolation=cv2.INTER_AREA)
    x0, y0 = int(cx - w / 2), bottom - h
    for yy in range(h):
        py = y0 + yy
        if py < 0 or py >= canvas.shape[0]: continue
        xs0, xs1 = max(0, x0), min(canvas.shape[1], x0 + w)
        if xs1 <= xs0: continue
        src = r[yy, xs0 - x0:xs1 - x0].astype(np.float32); al = src[:, 3:4] / 255
        dst = canvas[py, xs0:xs1].astype(np.float32)
        canvas[py, xs0:xs1] = np.concatenate([src[:, :3] * al + dst[:, :3] * (1 - al) * (dst[:, 3:4] / 255) + 0, np.maximum(dst[:, 3:4], src[:, 3:4])], axis=1).astype(np.uint8) if False else np.concatenate([src[:, :3] * al + dst[:, :3] * (1 - al), np.maximum(dst[:, 3:4], src[:, 3:4])], axis=1).astype(np.uint8)
G = np.zeros((760, 1080, 4), np.uint8)
put(G, mon, 640, 215, 760); put(G, bri, 640, 865, 760); put(G, vic, 740, 540, 760)   # Victor in the middle, in front
cv2.imwrite("cut/chars.png", G); print("cut ok", G.shape)
