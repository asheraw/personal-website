"""Crop the 3 expert photos to square head shots on a neutral backing -> heads/*.png"""
import cv2, numpy as np, os
os.makedirs("heads", exist_ok=True)
M = "../../../Materials/"
def load(p):
    return cv2.imread(p, cv2.IMREAD_UNCHANGED)
def flat(im):
    if im.shape[2] == 4:
        a = im[..., 3:4] / 255.0; bg = np.full(im[..., :3].shape, (168, 191, 201), np.float32)   # warm grey (BGR)
        return (im[..., :3] * a + bg * (1 - a)).astype(np.uint8)
    return im
def crop(im, x, y, s, out):
    c = flat(im)[y:y + s, x:x + s]; cv2.imwrite(out, cv2.resize(c, (576, 576), interpolation=cv2.INTER_AREA))
import subprocess
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", M + "Alex Hormozi.webp", "a.png"], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", M + "Codie Sanchez.webp", "c.png"], check=True)
crop(load("a.png"), 150, 0, 520, "heads/alex.png")
crop(load("c.png"), 180, 10, 480, "heads/codie.png")
crop(load(M + "Dan Koe.jpeg"), 75, 15, 330, "heads/dan.png")
print("ok")
