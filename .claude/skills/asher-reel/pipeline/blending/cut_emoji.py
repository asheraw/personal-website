"""Cut Asher's emoji sticker sheets (fake-transparent checkerboard JPEGs, white sticker outlines) into transparent PNGs.
python cut_emoji.py -> D:/Work/Assets/asher-emoji/a{sheet}_{nn}.png + index.jpg (numbered contact sheet)"""
import cv2, numpy as np, os
SRC = "D:/Work/00 Resources/Photo Assets/Character Sheets/"
OUT = "D:/Work/Assets/asher-emoji/"; os.makedirs(OUT, exist_ok=True)
tiles = []
for si in (1, 2, 3, 4, 5):
    im = cv2.imread(f"{SRC}Asher emoji 0{si}.jpeg"); h, w = im.shape[:2]
    white = (im.min(axis=2) > 225).astype(np.uint8) * 255
    white = cv2.morphologyEx(white, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    # background = non-white pixels reachable from the image border
    ff = (white == 0).astype(np.uint8)
    if im[:20, :20].mean() < 30:  # sheets 04-05: solid black background, not a checkerboard
        ff = (im.max(axis=2) < 40).astype(np.uint8)
    n, lab = cv2.connectedComponents(ff, connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    bg = np.isin(lab, list(border)) & (ff == 1)
    fg = (~bg).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n2, lab2, st, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    comps = [i for i in range(1, n2) if st[i, cv2.CC_STAT_AREA] > 4000]
    comps.sort(key=lambda i: (round(st[i, 1] / (h / 6)), st[i, 0]))
    for k, i in enumerate(comps):
        x, y, cw, ch = st[i, :4]
        a = (lab2[y:y + ch, x:x + cw] == i).astype(np.uint8) * 255
        a = cv2.GaussianBlur(a, (3, 3), 0)
        rgba = np.dstack([im[y:y + ch, x:x + cw], a])
        name = f"a{si}_{k + 1:02d}"
        cv2.imwrite(f"{OUT}{name}.png", rgba)
        t = cv2.resize(im[y:y + ch, x:x + cw], (140, int(140 * ch / cw)) if cw > ch else (int(140 * cw / ch), 140))
        tile = np.full((170, 150, 3), 40, np.uint8); tile[:t.shape[0], :t.shape[1]] = t
        cv2.putText(tile, name, (4, 165), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1)
        tiles.append(tile)
    print(si, len(comps), "stickers")
cols = 12
while len(tiles) % cols: tiles.append(np.full((170, 150, 3), 40, np.uint8))
cv2.imwrite(OUT + "index.jpg", np.vstack([np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]))
