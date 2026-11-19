"""Reel 6 preview round 3 (Asher's feedback 2026-11-17): his hooks, side-view cup, Asher stickers, line breaks, emoji pins, Netflix sound note."""
p = 'reels.mjs'; s = open(p, encoding='utf-8').read()
a = s.index('  6: { title:'); b = s.index('  7: { title:')
r6 = s[a:b]
CUP = 'file:///D:/Work/Assets/coffee_side.svg'
R = [
 # thumbnail = title hook
 ('copy: `YOUR ${y("USUAL")}<br>ORDER`, fs: 124', 'copy: `MAKE YOUR AUDIENCE<br>${y("REMEMBER")} YOU`, fs: 104'),
 ('notes: ["Netflix is named only; no logo or sound is used."]', 'notes: ["Netflix intro sound (Materials/netflix intro.mp3) plays under the voice at \'Netflix does it\', no freeze frame."]'),
 # hooks: his picks first (first option = selected)
 ('HK([["Your usual order", T.thumb],', 'HK([["Make your audience remember you", "your pick"], ["Your usual order", T.thumb],'),
 ('[["You don\'t have a creativity problem', '[["Why your content needs to be \\"the same\\" for your audience", "your pick"], ["You don\'t have a creativity problem'),
 ('[["New look, new intro, every post?", T.q], ["The real reason nobody recognises your posts", T.real], ["Why changing every post loses people", T.why]]',
  '[["Why changing every post loses people", T.why], ["New look, new intro, every post?", T.q], ["The real reason nobody recognises your posts", T.real]]'),
 ('[["Pick your order", "name card"], ["This is the simplest way to be recognised", T.fast], ["What really is a \'signature\' post?", T.what]]',
  '[["This is the simplest way to be recognised", T.fast], ["Try this", "name card"], ["What really is a \'signature\' post?", T.what]]'),
 ('[["Lock your style: step 2 of 3", T.num], ["Free article: check the caption", T.cta],', '[["Free article: check the caption", T.cta], ["Lock your style: step 2 of 3", T.num],'),
 # 0:00 Asher at the computer, no cup yet
 ('note: "A coffee cup and a yellow tick.", html: row(U("☕", 300) + E("check_mark_button", 200) + H("Known as " + y("mine"), "font-size:140px"), 70)',
  'note: "You at your computer, posting; a yellow tick: known as yours.", html: row(AE("a4_10", 520) + E("check_mark_button", 180) + H("Known as " + y("mine"), "font-size:140px;white-space:nowrap"), 60)'),
 # 0:03 swap: cup left, you walk in from the right; cup pops after you walk in
 ('note: "A cup gets made while the customer is still walking in.", html: row(`<span id="walk">${AE("a3_02", 250)}</span>` + `<span style="width:300px"></span>` + col(U("☕", 260, glow, "cup") + tag("your usual"), 20), 60) + ar("#walk", "#cup", "yel", -100)',
  'note: "You walk in from the right; once you are in, the cup pops up on the counter (side view, not top-down).", html: row(col(CUPI(240, glow, "cup") + tag("your usual"), 20) + `<span style="width:300px"></span>` + `<span id="walk" style="display:inline-block;transform:scaleX(-1)">${AE("a3_02", 250)}</span>`, 60) + ar("#walk", "#cup", "yel", 100)'),
 # 0:07
 ('H("You haven\'t said<br>a " + y("word"), "font-size:140px")', 'H("You<br>haven\'t said<br>a " + y("word"), "font-size:140px")'),
 # 0:08
 ('${H("The " + y("same") + " order. Every time.")}', '${H("The " + y("same") + " order.<br>Every time.")}'),
 # 0:14 emojis on the 4 posts + 2 lines
 ('${["New look", "New intro", "New tone", "New font"][i]}</div>`).join(""), 34)}${H("Every post: " + r("someone new"))}',
  '${E(["sparkles", "clapper_board", "musical_note", "pencil"][i], 120)}${["New look", "New intro", "New tone", "New font"][i]}</div>`).join(""), 34)}${H("Every post:<br>" + r("Someone new"))}'),
 # 0:21 double underline "before"
 ('H("Known " + y("before you speak"), "font-size:150px")', 'H("Known " + y(`<u style="text-decoration:underline double;text-decoration-thickness:8px;text-underline-offset:18px">before</u> you speak`), "font-size:150px")'),
 # 0:26 pointing Asher above "The same", in front of "Exciting"; strike draws on "not because you're exciting"
 ('note: "\'Exciting\' struck; \'the same\' in yellow.", html: `${H(`<span class="strike">Exciting</span>`, "color:var(--grey);font-size:150px")}${H(y("The same."), "font-size:190px")}`',
  'note: "You (pointing) sit above \'The same\', in front of \'Exciting\'. The red line crosses out \'Exciting\' as you say \'not because you\'re exciting\'.", html: row(AE("a2_point", 300) + H(`<span class="strike" id="ex">Exciting</span>`, "color:var(--grey);font-size:150px"), 50, "align-items:center") + H(y("The same."), "font-size:190px")'),
 # 0:33 Netflix sound
 ('note: "A soundwave pulse: you hear it, you know what\'s coming."', 'note: "A soundwave pulse while the real Netflix intro sound plays under your voice (no freeze frame)."'),
 # 0:38
 ('${H("Your version: " + y("small stuff"))}', '${H("The details are<br>the " + y("small stuff"))}'),
 # 0:48 Try this + an Asher sticker
 ('note: "Your order as 2 yellow cards.", html: `${H("Pick your " + y("order"), "font-size:150px")}${row(tag("1 way to open") + tag("1 way to sign off"), 60)}`',
  'note: "Try this: 2 yellow cards, you with the idea bulb.", html: row(AE("a5_16", 320) + col(H(y("Try this"), "font-size:150px") + row(tag("1 way to open") + tag("1 way to sign off"), 50), 40), 60)'),
 # 1:02 robot Asher + same side cup
 ('note: "Your yellow cup vs a grey robot copy.", html: row(col(U("☕", 260, glow) + H(y("Yours")), 10) + H("→", "font-size:200px") + col(E("robot", 240, grey) + H(g("Everyone\'s")), 10), 80)',
  'note: "Your yellow cup vs robot you: AI polish makes it everyone\'s.", html: row(col(CUPI(220, glow) + H(y("Yours")), 10) + H("→", "font-size:200px") + col(AE("a4_11", 300) + H(g("Everyone\'s")), 10), 80)'),
]
for o, n in R:
    if n in r6: continue
    assert o in r6, o[:80]
    r6 = r6.replace(o, n, 1)
r6 = r6.replace('<span class="u" style="font-size:60px">☕</span>', '<img src="' + CUP + '" style="width:50px;height:auto">')
s = s[:a] + r6 + s[b:]
if 'const CUPI' not in s:
    s = s.replace('const U = (c, s = 200', 'const CUPI = (w, st = "", id = "") => `<img ${id ? `id="${id}"` : ""} src="' + CUP + '" style="width:${w}px;height:auto;${st}">`;\nconst U = (c, s = 200', 1)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
